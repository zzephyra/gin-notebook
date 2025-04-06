package algorithm

import "github.com/bwmarrin/snowflake"

type Snowflake struct {
	node *snowflake.Node
}

var Snow *Snowflake

func NewSnowflake(nodeID int64) error {
	node, err := snowflake.NewNode(nodeID)
	if err != nil {
		return err
	}
	Snow = &Snowflake{node: node}
	return nil
}

func (s *Snowflake) GenerateID() snowflake.ID {
	return s.node.Generate()
}

func (s *Snowflake) GenerateIDInt64() int64 {
	return s.GenerateID().Int64()
}
