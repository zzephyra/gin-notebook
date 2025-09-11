package protocol

type Incoming struct {
	Type      string   `json:"type"`
	Rooms     []string `json:"rooms,omitempty"`
	ProjectID string   `json:"project_id,omitempty"`
	TaskID    string   `json:"task_id,omitempty"`
	ColumnID  string   `json:"column_id,omitempty"`
	CommentID string   `json:"comment_id,omitempty"`
}
