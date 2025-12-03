package dto

type GitHubRepoMetricsDTO struct {
	ForksCount       *int    `json:"forks_count,omitempty"`
	SubscribersCount *int    `json:"subscribers_count,omitempty"`
	StargazersCount  *int    `json:"stargazers_count,omitempty"`
	DefaultBranch    *string `json:"default_branch,omitempty"`
	GitURL           *string `json:"git_url,omitempty"`
	HTMLURL          *string `json:"html_url,omitempty"`
	AllowForking     *bool   `json:"allow_forking,omitempty"`
}
