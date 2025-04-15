package dto

type WorkspaceNoteDTO struct {
	ID           int64  `json:"id"`
	Title        string `json:"title"`
	Content      string `json:"content"`
	WorkspaceID  int64  `json:"workspace_id"`
	CategoryID   int64  `json:"category_id"`
	Share        bool   `json:"share"`
	AllowEdit    bool   `json:"allow_edit"`
	AllowComment bool   `json:"allow_comment"`
	AllowShare   bool   `json:"allow_share"`
	Status       string `json:"status"`
	AllowJoin    bool   `json:"allow_join"`
	AllowInvite  bool   `json:"allow_invite"`
	OwnerID      int64  `json:"owner_id"`
	OwnerName    string `json:"owner_name"`
	OwnerAvatar  string `json:"owner_avatar"`
	OwnerEmail   string `json:"owner_email"`
	OwnerPhone   string `json:"owner_phone"`
}

type WorkspaceNoteCategoryDTO struct {
	ID           int64  `json:"id"`
	CategoryName string `json:"category_name"`
	Total        int64  `json:"total"`
}
