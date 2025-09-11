// Package bus 定义了一个发布-订阅接口和默认实现
// Publisher 负责发布事件，Subscriber 负责订阅事件
// defaultPublisher 为SSE服务提供事件
// defaultWsPublisher 为WS服务提供事件
package bus

// 业务侧只依赖这个接口，不关心底层是 SSE、Kafka 还是 WS
type Publisher interface {
	ToWorkspace(workspaceID, typ string, payload any)
	ToProject(projectID, typ string, payload any)
	ToWorkspaceProject(workspaceID, projectID, typ string, payload any)
	ToUser(userID, typ string, payload any)
	// 可选：批量
	ToTopics(topics []string, typ string, payload any)
}

// —— 默认 Publisher（可在启动时注入） ——
var (
	defaultPublisher Publisher
)

// 在 main/startup 里调用，注入默认发布器
func UsePublisher(p Publisher)    { defaultPublisher = p }
func DefaultPublisher() Publisher { return defaultPublisher }

// —— 便捷函数（service 里直接用这些，不再 import 其他 service） ——
func BroadcastToWorkspace(workspaceID, typ string, payload any) {
	if defaultPublisher != nil {
		defaultPublisher.ToWorkspace(workspaceID, typ, payload)
	}
}
func BroadcastToProject(projectID, typ string, payload any) {
	if defaultPublisher != nil {
		defaultPublisher.ToProject(projectID, typ, payload)
	}
}
func BroadcastToWorkspaceProject(workspaceID, projectID, typ string, payload any) {
	if defaultPublisher != nil {
		defaultPublisher.ToWorkspaceProject(workspaceID, projectID, typ, payload)
	}
}
func BroadcastToUser(userID, typ string, payload any) {
	if defaultPublisher != nil {
		defaultPublisher.ToUser(userID, typ, payload)
	}
}
func BroadcastToTopics(topics []string, typ string, payload any) {
	if defaultPublisher != nil {
		defaultPublisher.ToTopics(topics, typ, payload)
	}
}
