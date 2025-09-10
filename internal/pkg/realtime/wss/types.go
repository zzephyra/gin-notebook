package ws

type Incoming struct {
	Type      string   `json:"type"`                 // "subscribe" | "unsubscribe" | "focus_task" | "blur_task" | "ping"
	Rooms     []string `json:"rooms,omitempty"`      // e.g. ["project_presence:123"]
	ProjectID string   `json:"project_id,omitempty"` // for focus/blur
	TaskID    string   `json:"task_id,omitempty"`    // for focus/blur
}

type Outgoing struct {
	Type    string      `json:"type"` // "presence_state" | "pong"
	Room    string      `json:"room"`
	Payload interface{} `json:"payload,omitempty"`
}
