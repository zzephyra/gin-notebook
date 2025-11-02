package message

const (
	SUCCESS                  = 200
	ERROR_FORBIDDEN          = 403
	ERROR                    = 500
	ERROR_INVALID_PARAMS     = 501
	ERROR_DATABASE           = 502
	ERROR_INTERNAL_SERVER    = 503
	ERROR_REQUEST_BODY       = 504
	ERROR_ASSERT_TYPE_FAILED = 600
	ERROR_IP_NOT_FOUND       = 601

	// 用户模块的错误
	ERROR_USERNAME_USED           = 1001
	ERROR_PASSWORD_WRONG          = 1002
	ERROR_USER_NOT_EXIST          = 1003
	ERROR_TOKEN_EXIST             = 1004
	ERROR_TOKEN_RUNTIME           = 1005
	ERROR_TOKEN_WRONG             = 1006
	ERROR_TOKEN_TYPE_WRONG        = 1007
	ERROR_USER_NO_RIGHT           = 1008
	ERROR_EMAIL_OR_PASSWORD       = 1009
	ERROR_PASSWORD_LENGTH_INVALID = 1010
	ERROR_VALIDATE_CODE_INVALID   = 1011
	ERROR_CREATE_USER             = 1012
	ERROR_GENERATE_TOKEN          = 1013
	ERROR_SEND_CAPTCHA            = 1014
	ERROR_PASSWORD_INVALID        = 1015
	ERROR_USER_VALIDATE           = 1016
	ERROR_USER_UPDATE             = 1017
	ERROR_USER_EMAIL_EXIST        = 1018
	ERROR_CREATE_USER_DEVICE      = 1019
	ERROR_GET_USER_DEVICE_LIST    = 1020
	ERROR_CREATE_GOOGLE_USER      = 1021

	// 文章模块的错误
	ERROR_ART_NOT_EXIST           = 2001
	ERROR_NOTE_CREATE             = 2002
	ERROR_NOTE_UPDATE             = 2003
	ERROR_NOTE_DELETE             = 2004
	ERROR_NOTE_NOT_EXIST          = 2005
	ERROR_NOTE_CATEGORY_NOT_EXIST = 2006
	ERROR_NOTE_NOT_FOUND          = 2007
	ERROR_INVALID_NOTE_INDEX      = 2008
	ERROR_NOTE_UPDATE_CONFLICT    = 2009
	ERROR_NOTE_SYNC_NOT_FOUND     = 2010
	// 分类模块的错误
	ERROR_CATENAME_USED  = 3001
	ERROR_CATE_NOT_EXIST = 3002

	// 工作区模块的错误
	ERROR_WORKSPACE_NOT_EXIST    = 4001
	ERROR_WORKSPACE_VALIDATE     = 4002
	ERROR_WORKSPACE_CREATE       = 4003
	ERROR_WORKSPACE_INVITE_EMAIL = 4004
	ERROR_WORKSPACE_ID           = 4005
	ERROR_EMPTY_WORKSPACE_ID     = 4006

	// 工作区笔记模块的错误
	ERROR_WORKSPACE_NOTE_VALIDATE                    = 5001
	ERROR_WORKSPACE_NOTE_CREATE                      = 5002
	ERROR_WORKSPACE_NOTE_UPDATE                      = 5003
	ERROR_WORKSPACE_NOTE_DELETE                      = 5004
	ERROR_WORKSPACE_NOTE_NOT_EXIST                   = 5005
	ERROR_WORKSPACE_NOTE_CATEGORY_NOT_EXIST          = 5006
	ERROR_WORKSPACE_NOTE_CATEGORY_CREATE             = 5007
	ERROR_WORKSPACE_NOTE_CATEGORY_UPDATE             = 5008
	ERROR_WORKSPACE_NOTE_CATEGORY_DELETE             = 5009
	ERROR_NO_PERMISSION_TO_UPDATE_AND_VIEW_WORKSPACE = 5010
	ERROR_WORKSPACE_INVITE_LINK_NOT_EXIST            = 5011
	ERROR_WORKSPACE_INVITE_LINK_EXPIRED              = 5012
	ERROR_WORKSPACE_MEMBER_NOT_EXIST                 = 5013
	ERROR_WORKSPACE_MEMBER_EXIST                     = 5014
	ERROR_WORKSPACE_INVITE_LINK_NOT_ALLOW_JOIN       = 5015
	ERROR_WORKSPACE_INVITE_LINK_NOT_MATCH            = 5016

	// 设置模块的错误
	ERROR_USER_SETTING_NOT_EXIST    = 6001
	ERROR_USER_SETTING_UPDATE       = 6002
	ERROR_USER_SETTING_CREATE       = 6003
	ERROR_SYSTEM_SETTINGS_NOT_EXIST = 6004
	ERROR_SYSTEM_SETTINGS_UPDATE    = 6005
	ERROR_SYSTEM_SETTINGS_CREATE    = 6006
	ERROR_SYSTEM_SETTINGS_GET       = 6007

	// 上传模块的错误
	ERROR_STORAGE_DRIVER_NOT_SUPPORT = 7001

	// 七牛云模块的错误
	ERROR_QINIU_TOKEN = 8001

	// 登录模块的错误
	ERROR_INVALID_CHANNEL = 9001
	ERROR_GOOGLE_OAUTH    = 9002 // Google OAuth 认证失败

	// AI 模块的错误
	ERROR_AI_SESSION_CREATE    = 10001
	ERROR_AI_SESSION_NOT_EXIST = 10002
	ERROR_AI_MESSAGE_CREATE    = 10003
	ERROR_AI_MESSAGE_NOT_EXIST = 10004
	ERROR_AI_SESSION_UPDATE    = 10005
	ERROR_AI_SESSION_DELETE    = 10006
	ERROR_AI_MESSAGE_INDEX     = 10007 // AI 消息索引错误
	ERROR_AI_MESSAGE_NOT_FOUND = 10008 // AI 消息未找到
	ERROR_AI_MESSAGE_UPDATE    = 10009 // AI 消息更新失败
	ERROR_AI_EMBEDDING         = 10010 // AI 消息嵌入失败

	// Event模块的错误
	ERROR_EVENT_CREATE                  = 11001 // 创建事件失败
	ERROR_NO_PERMISSION_TO_VIEW_EVENTS  = 11002 // 无权查看事件
	ERROR_NO_PERMISSION_TO_MODIFY_EVENT = 11003 // 无权修改事件

	// Project模块的错误
	ERROR_PROJECT_CREATE                    = 12001 // 创建项目失败
	ERROR_PROJECT_NOT_EXIST                 = 12002 // 项目不存在
	ERROR_PROJECT_UPDATE                    = 12003 // 更新项目失败
	ERROR_PROJECT_DELETE                    = 12004 // 删除项目失败
	ERROR_GET_ORDER_INDEX                   = 12005 // 获取项目任务顺序索引失败
	ERROR_COLUMN_NOT_EXIST                  = 12006 // 列不存在
	ERROR_COLUMN_CREATE                     = 12007 // 创建列失败
	ERROR_COLUMN_UPDATE                     = 12008 // 更新列失败
	ERROR_EMPTY_PROJECT_ID                  = 12009 // 项目ID不能为空
	ERROR_INVALID_PROJECT_ID                = 12010 // 无效的项目ID
	ERROR_INVALID_TASK_ID                   = 12011 // 无效的任务ID
	ERROR_EMPTY_COMMENT_ID                  = 12012 // 评论ID不能为空
	ERROR_INVALID_COMMENT_ID                = 12013 // 无效的评论ID
	ERROR_MENTION_CREATE_FAILED             = 12014 // 创建评论提及失败
	ERROR_TASK_UPDATE                       = 12015 // 任务更新失败
	ERROR_TASK_CREATE                       = 12016 // 任务创建失败
	ERROR_TASK_UPDATE_CONFLICTED            = 12017 // 任务更新冲突
	ERROR_PROJECT_COLUMN_UPDATE_CONFLICTED  = 12018 // 项目列更新冲突
	ERROR_COMMENT_ALREADY_LIKED_OR_DISLIKED = 12019 // 重复操作点赞/点踩
	ERROR_PROJECT_UPDATE_CONFLICTED         = 12020 // 项目更新冲突

	// integration模块的错误
	ERROR_INTEGRATION_ACCOUNT_NOT_EXIST               = 13001 // 集成账号不存在
	ERROR_INTEGRATION_ACCOUNT_CREATE                  = 13002 // 创建集成账号失败
	ERROR_INTEGRATION_ACCOUNT_UPDATE                  = 13003 // 更新集成账号失败
	ERROR_INTEGRATION_ACCOUNT_DELETE                  = 13004 // 删除集成账号失败
	ERROR_NO_PROMISSION_TO_MODIFY_INTEGRATION_ACCOUNT = 13005 // 无权修改集成账号
	ERROR_INVALID_INTEGRATION_APP_CREDENTIALS         = 13006 // 无效的集成应用凭据
	ERROR_FEISHU_INTEGRATION_NOT_CONFIGURED           = 13007 // 飞书集成未配置
	ERROR_INTEGRATION_APP_NOT_FOUND                   = 13008 // 集成应用未找到
	ERROR_FEISHU_GET_APP_ACCESS_TOKEN_FAILED          = 13009 // 获取飞书应用访问令牌失败
	ERROR_FEISHU_GET_USER_ACCESS_TOKEN_FAILED         = 13010 // 获取飞书用户访问令牌失败
	ERROR_INTEGRATION_ACCOUNT_NOT_FOUND               = 13011 // 集成账号未找到
	ERROR_INTEGRATION_ACCOUNT_EXPIRED                 = 13012 // 集成账号已过期
	ERROR_FEISHU_GET_FILE_META_FAILED                 = 13013 // 获取飞书文件元信息失败
	ERROR_FEISHU_CONVERT_MARKDOWN_FAILED              = 13014 // 飞书Markdown转换失败
)

var CodeMsg = map[int]string{
	SUCCESS:                                          "OK",
	ERROR:                                            "FAIL",
	ERROR_USERNAME_USED:                              "用户名已存在！",
	ERROR_FORBIDDEN:                                  "没有权限",
	ERROR_PASSWORD_WRONG:                             "密码错误",
	ERROR_USER_NOT_EXIST:                             "用户不存在",
	ERROR_INTERNAL_SERVER:                            "服务器内部错误",
	ERROR_TOKEN_EXIST:                                "TOKEN不存在,请重新登陆",
	ERROR_TOKEN_RUNTIME:                              "TOKEN已过期,请重新登陆",
	ERROR_TOKEN_WRONG:                                "TOKEN不正确,请重新登陆",
	ERROR_TOKEN_TYPE_WRONG:                           "TOKEN格式错误,请重新登陆",
	ERROR_USER_NO_RIGHT:                              "该用户无权限",
	ERROR_EMAIL_OR_PASSWORD:                          "邮箱或密码错误",
	ERROR_PASSWORD_LENGTH_INVALID:                    "密码长度不符合要求",
	ERROR_VALIDATE_CODE_INVALID:                      "验证码错误或已过期",
	ERROR_CREATE_USER:                                "创建用户失败",
	ERROR_GENERATE_TOKEN:                             "生成token失败",
	ERROR_ART_NOT_EXIST:                              "文章不存在",
	ERROR_INVALID_PARAMS:                             "请求参数错误",
	ERROR_CATENAME_USED:                              "该分类已存在",
	ERROR_CATE_NOT_EXIST:                             "该分类不存在",
	ERROR_SEND_CAPTCHA:                               "发送验证码失败",
	ERROR_DATABASE:                                   "数据库操作失败",
	ERROR_PASSWORD_INVALID:                           "密码错误",
	ERROR_WORKSPACE_VALIDATE:                         "创建工作区数据验证失败",
	ERROR_WORKSPACE_CREATE:                           "工作区创建失败",
	ERROR_WORKSPACE_NOTE_CREATE:                      "工作区笔记创建失败",
	ERROR_WORKSPACE_NOTE_UPDATE:                      "工作区笔记更新失败",
	ERROR_WORKSPACE_NOTE_DELETE:                      "工作区笔记删除失败",
	ERROR_WORKSPACE_NOTE_NOT_EXIST:                   "工作区笔记不存在",
	ERROR_WORKSPACE_INVITE_EMAIL:                     "工作区邀请邮件发送失败",
	ERROR_WORKSPACE_NOTE_CATEGORY_NOT_EXIST:          "工作区笔记分类不存在",
	ERROR_WORKSPACE_NOTE_CATEGORY_CREATE:             "工作区笔记分类创建失败",
	ERROR_WORKSPACE_NOTE_CATEGORY_UPDATE:             "工作区笔记分类更新失败",
	ERROR_WORKSPACE_NOTE_CATEGORY_DELETE:             "工作区笔记分类删除失败",
	ERROR_STORAGE_DRIVER_NOT_SUPPORT:                 "存储驱动不支持",
	ERROR_QINIU_TOKEN:                                "获取七牛云token失败",
	ERROR_USER_VALIDATE:                              "用户数据验证失败",
	ERROR_USER_EMAIL_EXIST:                           "用户邮箱已存在",
	ERROR_IP_NOT_FOUND:                               "IP地址未找到",
	ERROR_GET_USER_DEVICE_LIST:                       "获取用户设备列表失败",
	ERROR_NO_PERMISSION_TO_UPDATE_AND_VIEW_WORKSPACE: "无权修改工作区",
	ERROR_WORKSPACE_INVITE_LINK_EXPIRED:              "工作区邀请链接已过期",
	ERROR_WORKSPACE_INVITE_LINK_NOT_EXIST:            "工作区邀请链接不存在",
	ERROR_WORKSPACE_MEMBER_NOT_EXIST:                 "工作区成员不存在",
	ERROR_WORKSPACE_MEMBER_EXIST:                     "工作区成员已存在",
	ERROR_WORKSPACE_INVITE_LINK_NOT_ALLOW_JOIN:       "工作区邀请链接不允许加入",
	ERROR_WORKSPACE_INVITE_LINK_NOT_MATCH:            "工作区邀请链接与工作区不匹配",
	ERROR_GOOGLE_OAUTH:                               "Google OAuth 认证失败",
	ERROR_INVALID_CHANNEL:                            "无效的登录渠道",
	ERROR_CREATE_GOOGLE_USER:                         "创建 Google 用户失败",
	ERROR_AI_SESSION_CREATE:                          "AI 会话创建失败",
	ERROR_AI_SESSION_NOT_EXIST:                       "AI 会话不存在",
	ERROR_AI_MESSAGE_CREATE:                          "AI 消息创建失败",
	ERROR_AI_MESSAGE_NOT_EXIST:                       "AI 消息不存在",
	ERROR_AI_SESSION_UPDATE:                          "AI 会话更新失败",
	ERROR_AI_SESSION_DELETE:                          "AI 会话删除失败",
	ERROR_AI_MESSAGE_INDEX:                           "AI 消息索引错误",
	ERROR_AI_MESSAGE_NOT_FOUND:                       "AI 消息未找到",
	ERROR_AI_MESSAGE_UPDATE:                          "AI 消息更新失败",
	ERROR_EVENT_CREATE:                               "活动创建失败",
	ERROR_NO_PERMISSION_TO_VIEW_EVENTS:               "无权查看活动",
	ERROR_NO_PERMISSION_TO_MODIFY_EVENT:              "无权修改活动",
	ERROR_WORKSPACE_ID:                               "工作区ID错误",
	ERROR_EMPTY_WORKSPACE_ID:                         "工作区ID不能为空",
	ERROR_EMPTY_PROJECT_ID:                           "项目ID不能为空",
	ERROR_INVALID_PROJECT_ID:                         "无效的项目ID",
	ERROR_PROJECT_NOT_EXIST:                          "项目不存在",
	ERROR_INVALID_TASK_ID:                            "无效的任务ID",
	ERROR_EMPTY_COMMENT_ID:                           "评论ID不能为空",
	ERROR_INVALID_COMMENT_ID:                         "无效的评论ID",
	ERROR_MENTION_CREATE_FAILED:                      "创建评论提及失败",
	ERROR_TASK_UPDATE:                                "任务更新失败",
	ERROR_TASK_UPDATE_CONFLICTED:                     "任务更新冲突，请刷新页面后重试",
	ERROR_PROJECT_COLUMN_UPDATE_CONFLICTED:           "项目列更新冲突，请刷新页面后重试",
	ERROR_COMMENT_ALREADY_LIKED_OR_DISLIKED:          "您已操作过啦，不能重复点赞/点踩",
	ERROR_PROJECT_UPDATE_CONFLICTED:                  "项目更新冲突，请刷新页面后重试",
	ERROR_INVALID_INTEGRATION_APP_CREDENTIALS:        "无效的集成应用凭据",
	ERROR_FEISHU_INTEGRATION_NOT_CONFIGURED:          "飞书集成未配置",
	ERROR_INTEGRATION_APP_NOT_FOUND:                  "集成应用未找到",
	ERROR_FEISHU_GET_APP_ACCESS_TOKEN_FAILED:         "获取飞书应用访问令牌失败",
	ERROR_FEISHU_GET_USER_ACCESS_TOKEN_FAILED:        "获取飞书用户访问令牌失败",
	ERROR_NOTE_NOT_FOUND:                             "笔记未找到",
	ERROR_INTEGRATION_ACCOUNT_EXPIRED:                "集成账号已过期，请重新绑定",
	ERROR_INTEGRATION_ACCOUNT_NOT_FOUND:              "集成账号未找到",
	ERROR_FEISHU_GET_FILE_META_FAILED:                "获取飞书文件元信息失败",
	ERROR_FEISHU_CONVERT_MARKDOWN_FAILED:             "飞书Markdown转换失败",
	ERROR_INVALID_NOTE_INDEX:                         "无效的笔记索引",
	ERROR_NOTE_UPDATE_CONFLICT:                       "笔记更新冲突，请刷新页面后重试",
	ERROR_NOTE_SYNC_NOT_FOUND:                        "笔记同步配置未找到",
	ERROR_AI_EMBEDDING:                               "AI 消息嵌入失败",
}
