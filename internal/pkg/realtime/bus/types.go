package bus

import (
	"bytes"
	"encoding/json"
	"strconv"
	"strings"
	"time"
)

const (
	PrefixWorkspace = "ws:"   // ws:<workspaceID>
	PrefixProject   = "proj:" // proj:<projectID>
	PrefixUser      = "user:" // user:<userID>
)

type Event struct {
	ID    string      `json:"id"`
	Type  string      `json:"type"`
	Topic string      `json:"topic"`
	Data  interface{} `json:"data"`
	At    time.Time   `json:"at"`
}

func newID() string { return strconv.FormatInt(time.Now().UnixNano(), 10) }

func NewEvent(typ string, topic string, data any) Event {
	return Event{
		ID:    newID(),
		Type:  typ,
		Topic: topic,
		Data:  data,
		At:    time.Now().UTC(),
	}
}

func (e Event) Marshal() []byte {
	var buf bytes.Buffer
	buf.WriteString("event: ")
	buf.WriteString(string(e.Type))
	buf.WriteByte('\n')

	buf.WriteString("id: ")
	buf.WriteString(e.ID)
	buf.WriteByte('\n')

	js, _ := json.Marshal(e)
	buf.WriteString("data: ")
	buf.Write(js)
	buf.WriteString("\n\n")
	return buf.Bytes()
}

func TopicWorkspace(workspaceID string) string {
	return PrefixWorkspace + strings.TrimSpace(workspaceID)
}
func TopicProject(projectID string) string {
	return PrefixProject + strings.TrimSpace(projectID)
}
func TopicWorkspaceProject(workspaceID, projectID string) string {
	w := strings.TrimSpace(workspaceID)
	p := strings.TrimSpace(projectID)
	if w == "" {
		return TopicProject(p)
	}
	if p == "" {
		return TopicWorkspace(w)
	}
	return PrefixWorkspace + w + ":proj:" + p
}
func TopicUser(userID string) string {
	return PrefixUser + strings.TrimSpace(userID)
}

// —— Default Broker（全局注入） ——
var defaultBroker *Broker

func Use(b *Broker)    { defaultBroker = b }
func Default() *Broker { return defaultBroker }
func Publish(topic, typ string, data any) {
	if defaultBroker == nil {
		return
	}
	defaultBroker.Publish(topic, NewEvent(typ, topic, data))
}

// 便捷发布
func PublishWorkspace(workspaceID, typ string, data any) {
	Publish(TopicWorkspace(workspaceID), typ, data)
}
func PublishProject(projectID, typ string, data any) {
	Publish(TopicProject(projectID), typ, data)
}
func PublishWorkspaceProject(workspaceID, projectID, typ string, data any) {
	Publish(TopicWorkspaceProject(workspaceID, projectID), typ, data)
}
func PublishUser(userID, typ string, data any) {
	Publish(TopicUser(userID), typ, data)
}
