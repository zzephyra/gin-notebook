package protocol

type Outgoing struct {
	Type    string      `json:"type"`
	Room    string      `json:"room"`
	Payload interface{} `json:"payload,omitempty"`
}
