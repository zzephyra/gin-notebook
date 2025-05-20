package message

const (
	SUCCESS                  = 200
	ERROR_FORBIDDEN          = 403
	ERROR                    = 500
	ERROR_INVALID_PARAMS     = 501
	ERROR_DATABASE           = 502
	ERROR_INTERNAL_SERVER    = 503
	ERROR_ASSERT_TYPE_FAILED = 600

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

	// 文章模块的错误
	ERROR_ART_NOT_EXIST           = 2001
	ERROR_NOTE_CREATE             = 2002
	ERROR_NOTE_UPDATE             = 2003
	ERROR_NOTE_DELETE             = 2004
	ERROR_NOTE_NOT_EXIST          = 2005
	ERROR_NOTE_CATEGORY_NOT_EXIST = 2006
	// 分类模块的错误
	ERROR_CATENAME_USED  = 3001
	ERROR_CATE_NOT_EXIST = 3002

	// 工作区模块的错误
	ERROR_WORKSPACE_NOT_EXIST    = 4001
	ERROR_WORKSPACE_VALIDATE     = 4002
	ERROR_WORKSPACE_CREATE       = 4003
	ERROR_WORKSPACE_INVITE_EMAIL = 4004

	// 工作区笔记模块的错误
	ERROR_WORKSPACE_NOTE_VALIDATE           = 5001
	ERROR_WORKSPACE_NOTE_CREATE             = 5002
	ERROR_WORKSPACE_NOTE_UPDATE             = 5003
	ERROR_WORKSPACE_NOTE_DELETE             = 5004
	ERROR_WORKSPACE_NOTE_NOT_EXIST          = 5005
	ERROR_WORKSPACE_NOTE_CATEGORY_NOT_EXIST = 5006
	ERROR_WORKSPACE_NOTE_CATEGORY_CREATE    = 5007
	ERROR_WORKSPACE_NOTE_CATEGORY_UPDATE    = 5008
	ERROR_WORKSPACE_NOTE_CATEGORY_DELETE    = 5009

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
)

var CodeMsg = map[int]string{
	SUCCESS:                                 "OK",
	ERROR:                                   "FAIL",
	ERROR_USERNAME_USED:                     "用户名已存在！",
	ERROR_FORBIDDEN:                         "没有权限",
	ERROR_PASSWORD_WRONG:                    "密码错误",
	ERROR_USER_NOT_EXIST:                    "用户不存在",
	ERROR_INTERNAL_SERVER:                   "服务器内部错误",
	ERROR_TOKEN_EXIST:                       "TOKEN不存在,请重新登陆",
	ERROR_TOKEN_RUNTIME:                     "TOKEN已过期,请重新登陆",
	ERROR_TOKEN_WRONG:                       "TOKEN不正确,请重新登陆",
	ERROR_TOKEN_TYPE_WRONG:                  "TOKEN格式错误,请重新登陆",
	ERROR_USER_NO_RIGHT:                     "该用户无权限",
	ERROR_EMAIL_OR_PASSWORD:                 "邮箱或密码错误",
	ERROR_PASSWORD_LENGTH_INVALID:           "密码长度不符合要求",
	ERROR_VALIDATE_CODE_INVALID:             "验证码错误或已过期",
	ERROR_CREATE_USER:                       "创建用户失败",
	ERROR_GENERATE_TOKEN:                    "生成token失败",
	ERROR_ART_NOT_EXIST:                     "文章不存在",
	ERROR_INVALID_PARAMS:                    "请求参数错误",
	ERROR_CATENAME_USED:                     "该分类已存在",
	ERROR_CATE_NOT_EXIST:                    "该分类不存在",
	ERROR_SEND_CAPTCHA:                      "发送验证码失败",
	ERROR_DATABASE:                          "数据库操作失败",
	ERROR_PASSWORD_INVALID:                  "密码错误",
	ERROR_WORKSPACE_VALIDATE:                "创建工作区数据验证失败",
	ERROR_WORKSPACE_CREATE:                  "工作区创建失败",
	ERROR_WORKSPACE_NOTE_CREATE:             "工作区笔记创建失败",
	ERROR_WORKSPACE_NOTE_UPDATE:             "工作区笔记更新失败",
	ERROR_WORKSPACE_NOTE_DELETE:             "工作区笔记删除失败",
	ERROR_WORKSPACE_NOTE_NOT_EXIST:          "工作区笔记不存在",
	ERROR_WORKSPACE_INVITE_EMAIL:            "工作区邀请邮件发送失败",
	ERROR_WORKSPACE_NOTE_CATEGORY_NOT_EXIST: "工作区笔记分类不存在",
	ERROR_WORKSPACE_NOTE_CATEGORY_CREATE:    "工作区笔记分类创建失败",
	ERROR_WORKSPACE_NOTE_CATEGORY_UPDATE:    "工作区笔记分类更新失败",
	ERROR_WORKSPACE_NOTE_CATEGORY_DELETE:    "工作区笔记分类删除失败",
	ERROR_STORAGE_DRIVER_NOT_SUPPORT:        "存储驱动不支持",
	ERROR_QINIU_TOKEN:                       "获取七牛云token失败",
	ERROR_USER_VALIDATE:                     "用户数据验证失败",
}
