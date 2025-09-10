package bus

import "fmt"

// 基于当前 Broker 的 SSE 实现（Adapter）
type ssePublisher struct {
	b *Broker
}

func NewSSEPublisher(b *Broker) Publisher {
	return &ssePublisher{b: b}
}

func (p *ssePublisher) ToWorkspace(workspaceID, typ string, payload any) {
	if p == nil || p.b == nil {
		return
	}
	t := TopicWorkspace(workspaceID)
	p.b.Publish(t, NewEvent(typ, t, payload))
}

func (p *ssePublisher) ToProject(projectID, typ string, payload any) {
	if p == nil || p.b == nil {
		return
	}
	t := TopicProject(projectID)
	p.b.Publish(t, NewEvent(typ, t, payload))
}

func (p *ssePublisher) ToWorkspaceProject(workspaceID, projectID, typ string, payload any) {
	fmt.Println("ToWorkspaceProject", p == nil, p.b == nil)
	if p == nil || p.b == nil {
		return
	}
	t := TopicWorkspaceProject(workspaceID, projectID)
	p.b.Publish(t, NewEvent(typ, t, payload))
}

func (p *ssePublisher) ToUser(userID, typ string, payload any) {
	if p == nil || p.b == nil {
		return
	}
	t := TopicUser(userID)
	p.b.Publish(t, NewEvent(typ, t, payload))
}

func (p *ssePublisher) ToTopics(topics []string, typ string, payload any) {
	if p == nil || p.b == nil {
		return
	}
	for _, t := range topics {
		if t == "" {
			continue
		}
		p.b.Publish(t, NewEvent(typ, t, payload))
	}
}
