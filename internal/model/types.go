package model

type IntegrationProvider string
type IntegrationAuthType string

const (
	AuthOAuth2 IntegrationAuthType = "oauth2"
	AuthPAT    IntegrationAuthType = "pat"     // personal access token
	AuthAPIKey IntegrationAuthType = "api_key" // 兼容部分服务
)

const (
	ProviderNotion IntegrationProvider = "notion"
	ProviderJira   IntegrationProvider = "jira"
	ProviderFeishu IntegrationProvider = "feishu"
	// ...后续扩展
)

type ExternalResourceType string

const (
	ExtTypePage     ExternalResourceType = "page"
	ExtTypeDatabase ExternalResourceType = "database"
	ExtTypeIssue    ExternalResourceType = "issue"
	// ...
)

type SyncDirection string

const (
	SyncPushOnly SyncDirection = "push" // 以本地为主，单向推送
	SyncPullOnly SyncDirection = "pull" // 以外部为主，单向拉取
	SyncTwoWay   SyncDirection = "both" // 双向
)

type SyncStatus string

const (
	SyncIdle    SyncStatus = "idle"
	SyncPending SyncStatus = "pending"
	SyncRunning SyncStatus = "running"
	SyncSuccess SyncStatus = "success"
	SyncFailed  SyncStatus = "failed"
	SyncSkipped SyncStatus = "skipped"
)

type SyncMode string

const (
	SyncModeAuto   SyncMode = "auto"
	SyncModeManual SyncMode = "manual"
)

type ConflictPolicy string

const (
	ConflictLatest ConflictPolicy = "latest" // 以最新修改时间为准
	// ...
)

type InitStatus string

const (
	InitPending InitStatus = "pending" // 新建后尚未开始初始化
	InitRunning InitStatus = "running" // 正在初始化
	InitReady   InitStatus = "ready"   // 初始化完成，可增量同步
	InitFailed  InitStatus = "failed"  // 初始化失败（可重试）
)

type PromptType string

const (
	PromptTypeSystem    PromptType = "system"
	PromptTypeUser      PromptType = "user"
	PromptTypeAssistant PromptType = "assistant"
	PromptTypeFewShot   PromptType = "fewshot"
)

var (
	PriorityMap = map[uint8]string{
		0: "",
		1: "low",
		2: "medium",
		3: "high",
	}
	StringToPriority = map[string]uint8{
		"":       0,
		"low":    1,
		"medium": 2,
		"high":   3,
	}
)
