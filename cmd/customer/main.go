package main

import (
	"context"
	"encoding/json"
	"gin-notebook/configs"
	"gin-notebook/internal/pkg/queue"
	"log"

	"github.com/IBM/sarama"
	"github.com/hibiken/asynq"
)

type KafkaMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

func InitAsynqClient() *asynq.Client {
	asynqClient := asynq.NewClient(asynq.RedisClientOpt{Addr: configs.Configs.Cache.Host + ":" + configs.Configs.Cache.Port})
	return asynqClient
}

type ConsumerClient struct {
	asynqClient *asynq.Client
}

func (kc *ConsumerClient) Setup(sarama.ConsumerGroupSession) error   { return nil }
func (kc *ConsumerClient) Cleanup(sarama.ConsumerGroupSession) error { return nil }

func (kc *ConsumerClient) ConsumeClaim(sess sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
	for msg := range claim.Messages() {
		log.Printf("收到 Kafka 消息: %s", string(msg.Value))

		// Kafka 消息直接是 Asynq 的任务 JSON 格式（包含 type 和 payload）
		var kmsg KafkaMessage
		if err := json.Unmarshal(msg.Value, &kmsg); err != nil {
			log.Printf("解析 Kafka 消息失败: %v", err)
			continue
		}

		// 创建 Asynq 任务
		task := asynq.NewTask(kmsg.Type, kmsg.Payload)

		if _, err := kc.asynqClient.Enqueue(task); err != nil {
			log.Printf("Asynq 入队失败: %v", err)
		}
		sess.MarkMessage(msg, "")
	}
	return nil
}

func main() {
	// 加载配置文件
	configs.Load()

	// 创建消费者
	custormerGroup := queue.NewCustomerGroup()

	// 初始化 Asynq Client
	asynqClient := InitAsynqClient()
	defer asynqClient.Close()

	consumer := &ConsumerClient{asynqClient: asynqClient}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	custormerGroup.Consume(ctx, []string{configs.Configs.Worker.Topic}, consumer)
	defer custormerGroup.Close()
}
