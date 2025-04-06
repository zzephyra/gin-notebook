package message

const (
	SUCCESS              = 200
	ERROR                = 500
	ERROR_INVALID_PARAMS = 501
	ERROR_DATABASE       = 502

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
	// 文章模块的错误
	ERROR_ART_NOT_EXIST = 2001
	// 分类模块的错误
	ERROR_CATENAME_USED  = 3001
	ERROR_CATE_NOT_EXIST = 3002
)

var CodeMsg = map[int]string{
	SUCCESS:                       "OK",
	ERROR:                         "FAIL",
	ERROR_USERNAME_USED:           "用户名已存在！",
	ERROR_PASSWORD_WRONG:          "密码错误",
	ERROR_USER_NOT_EXIST:          "用户不存在",
	ERROR_TOKEN_EXIST:             "TOKEN不存在,请重新登陆",
	ERROR_TOKEN_RUNTIME:           "TOKEN已过期,请重新登陆",
	ERROR_TOKEN_WRONG:             "TOKEN不正确,请重新登陆",
	ERROR_TOKEN_TYPE_WRONG:        "TOKEN格式错误,请重新登陆",
	ERROR_USER_NO_RIGHT:           "该用户无权限",
	ERROR_EMAIL_OR_PASSWORD:       "邮箱或密码错误",
	ERROR_PASSWORD_LENGTH_INVALID: "密码长度不符合要求",
	ERROR_VALIDATE_CODE_INVALID:   "验证码错误或已过期",
	ERROR_CREATE_USER:             "创建用户失败",
	ERROR_GENERATE_TOKEN:          "生成token失败",
	ERROR_ART_NOT_EXIST:           "文章不存在",
	ERROR_INVALID_PARAMS:          "请求参数错误",
	ERROR_CATENAME_USED:           "该分类已存在",
	ERROR_CATE_NOT_EXIST:          "该分类不存在",
	ERROR_SEND_CAPTCHA:            "发送验证码失败",
	ERROR_PASSWORD_INVALID:        "密码错误",
}
