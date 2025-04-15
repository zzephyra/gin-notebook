package queue

import (
	"context"
	"gin-notebook/configs"
	"log"
	"strings"

	"github.com/IBM/sarama"
)

type ConsumerGroup struct {
	Customer sarama.ConsumerGroup
}

var (
	group string = "gnote"
)

func (c *ConsumerGroup) Close() {
	if c.Customer != nil {
		if err := c.Customer.Close(); err != nil {
			log.Println("关闭消费者组失败:", err)
		}
	}
}

func (c *ConsumerGroup) Consume(ctx context.Context, topics []string, handler sarama.ConsumerGroupHandler) {
	for {
		if err := c.Customer.Consume(ctx, topics, handler); err != nil {
			log.Println("消费失败:", err)
		}

		if ctx.Err() != nil {
			panic("消费者组退出")
		}
	}
}

func SetCustomerConfig() (c *sarama.Config) {
	c = sarama.NewConfig()
	c.Version = sarama.DefaultVersion
	c.Consumer.Group.Rebalance.Strategy = sarama.BalanceStrategyRoundRobin
	c.Consumer.Offsets.Initial = sarama.OffsetNewest
	return
}

func NewCustomerGroup() (CustomerClient *ConsumerGroup) {
	var err error
	CustomerClient = &ConsumerGroup{}
	brokers := strings.Split(configs.Configs.Worker.Brokers, ",")
	log.Println("Kafka brokers:", configs.Configs.Worker.Brokers)
	CustomerClient.Customer, err = sarama.NewConsumerGroup(brokers, group, SetCustomerConfig())
	if err != nil {
		log.Fatalln("创建消费者组失败:", err)
	}
	return
}
