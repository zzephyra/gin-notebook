package dto

type FeishuFileMeta struct {
	CreateTime       string `json:"create_time"`
	DocToken         string `json:"doc_token"`
	DocType          string `json:"doc_type"`
	LatestModifyTime string `json:"latest_modify_time"`
	LatestModifyUser string `json:"latest_modify_user"`
	OwnerID          string `json:"owner_id"`
	RequestDocInfo   struct {
		DocToken string `json:"doc_token"`
		DocType  string `json:"doc_type"`
	} `json:"request_doc_info"`
	Title string `json:"title"`
	URL   string `json:"url"`
}
