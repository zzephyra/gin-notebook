// GitHub: https://github.com/IBM/sarama/blob/main/examples/txn_producer/main.go
package queue

import (
	"encoding/json"
	"fmt"
	"gin-notebook/configs"
	"gin-notebook/pkg/logger"
	"log"
	"strings"
	"sync"

	"github.com/IBM/sarama"
)

type ProducerProvider struct {
	TransactionIdGenerator int32

	producersLock sync.Mutex
	producers     []sarama.AsyncProducer

	ProducerProvider func() sarama.AsyncProducer
}

var (
	Provider *ProducerProvider
)

type KafkaMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

func NewProducerProvider() {
	Provider = &ProducerProvider{}
	Provider.ProducerProvider = func() sarama.AsyncProducer {
		config := SetKafkaProducerConfig()
		suffix := Provider.TransactionIdGenerator
		// Append TransactionIdGenerator to current config.Producer.Transaction.ID to ensure transaction-id uniqueness.
		if config.Producer.Transaction.ID != "" {
			Provider.TransactionIdGenerator++
			config.Producer.Transaction.ID = config.Producer.Transaction.ID + "-" + fmt.Sprint(suffix)
		}
		producer, err := sarama.NewAsyncProducer(strings.Split(configs.Configs.Worker.Brokers, ","), config)
		if err != nil {
			logger.LogError(err, "创建Kafka生产者失败")
			return nil
		}
		return producer
	}
}

func SetKafkaProducerConfig() *sarama.Config {
	// 官方默认配置
	config := sarama.NewConfig()
	config.Producer.Idempotent = true
	config.Producer.Return.Errors = false
	config.Producer.RequiredAcks = sarama.WaitForAll
	config.Producer.Partitioner = sarama.NewRoundRobinPartitioner
	config.Producer.Transaction.Retry.Backoff = 10
	config.Producer.Transaction.ID = "gnote_producer"
	config.Producer.Retry.Max = configs.Configs.Worker.MaxReties
	config.Net.MaxOpenRequests = 1
	return config
}

func (p *ProducerProvider) Borrow() (producer sarama.AsyncProducer) {
	p.producersLock.Lock()
	defer p.producersLock.Unlock()

	if len(p.producers) == 0 {
		for {
			producer = p.ProducerProvider()
			if producer != nil {
				return
			}
		}
	}

	index := len(p.producers) - 1
	producer = p.producers[index]
	p.producers = p.producers[:index]
	return
}

func (p *ProducerProvider) Release(producer sarama.AsyncProducer) {
	p.producersLock.Lock()
	defer p.producersLock.Unlock()

	// If released producer is erroneous close it and don't return it to the producer pool.
	if producer.TxnStatus()&sarama.ProducerTxnFlagInError != 0 {
		// Try to close it
		_ = producer.Close()
		return
	}
	p.producers = append(p.producers, producer)
}

func (p *ProducerProvider) Clear() {
	p.producersLock.Lock()
	defer p.producersLock.Unlock()

	for _, producer := range p.producers {
		producer.Close()
	}
	p.producers = p.producers[:0]
}

func (p *ProducerProvider) Test() {
	producer := p.Borrow()
	log.Printf("Producer: %s\n", producer)
	defer p.Release(producer)

	// Start kafka transaction
	err := producer.BeginTxn()
	if err != nil {
		log.Printf("unable to start txn %s\n", err)
		return
	}
	var m = KafkaMessage{
		Type: "email:deliver",
		Payload: json.RawMessage(`{
			"to": "1131659949@qq.com",
			"subject": "测试邮件",
			"body": "测试邮件内容"
		}`),
	}
	// Produce some records in transaction
	messageBytes, err := json.Marshal(m)
	if err != nil {
		log.Printf("unable to marshal message %s\n", err)
		return
	}
	producer.Input() <- &sarama.ProducerMessage{Topic: configs.Configs.Worker.Topic, Key: nil, Value: sarama.StringEncoder(messageBytes)}

	// commit transaction
	err = producer.CommitTxn()
	if err != nil {
		log.Printf("Producer: unable to commit txn %s\n", err)
		for {
			if producer.TxnStatus()&sarama.ProducerTxnFlagFatalError != 0 {
				// fatal error. need to recreate producer.
				log.Printf("Producer: producer is in a fatal state, need to recreate it")
				break
			}
			// If producer is in abortable state, try to abort current transaction.
			if producer.TxnStatus()&sarama.ProducerTxnFlagAbortableError != 0 {
				err = producer.AbortTxn()
				if err != nil {
					// If an error occured just retry it.
					log.Printf("Producer: unable to abort transaction: %+v", err)
					continue
				}
				break
			}
			// if not you can retry
			err = producer.CommitTxn()
			if err != nil {
				log.Printf("Producer: unable to commit txn %s\n", err)
				continue
			}
		}
		return
	}
}
