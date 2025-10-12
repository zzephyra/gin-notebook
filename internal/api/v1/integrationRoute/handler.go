package integrationRoute

import (
	"fmt"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/service/integrationService"
	"gin-notebook/pkg/utils/tools"
	"gin-notebook/pkg/utils/validator"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateIntegrationAppApi(c *gin.Context) {
	rolse := c.MustGet("role").([]string)
	if !tools.Contains(rolse, model.UserRole.Admin) {
		c.JSON(http.StatusForbidden, response.Response(message.ERROR_NO_PROMISSION_TO_MODIFY_INTEGRATION_ACCOUNT, "only admin can create integration app"))
		return
	}

	params := &dto.IntegrationAppCreateDTO{}

	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode, data := integrationService.CreateIntegrationApp(c.Request.Context(), params)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func GetIntegrationAppListApi(c *gin.Context) {
	rolse := c.MustGet("role").([]string)
	if !tools.Contains(rolse, model.UserRole.Admin) {
		c.JSON(http.StatusForbidden, response.Response(message.ERROR_NO_PROMISSION_TO_MODIFY_INTEGRATION_ACCOUNT, "only admin can get integration app list"))
		return
	}

	params := &dto.IntegrationAppQueryDTO{}

	if err := c.ShouldBindQuery(params); err != nil {
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode, data := integrationService.GetIntegrationAppList(c.Request.Context(), params)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func FeishuOAuthCallbackApi(c *gin.Context) {
	params := &dto.FeishuOAuthCallbackDTO{
		UserID: c.MustGet("userID").(int64),
	}

	if err := c.ShouldBindQuery(params); err != nil {
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode, _ := integrationService.HandleFeishuOAuthCallback(c.Request.Context(), params)
	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(makeAuthResultHTML(true, responseCode, params.Origin)))
}

func makeAuthResultHTML(ok bool, responseCode int, targetOrigin *string) string {
	var errMsg string
	if responseCode != message.SUCCESS {
		errMsg = message.CodeMsg[responseCode]
	}

	msg := fmt.Sprintf(`{provider:"feishu", ok:%v, error:%q}`, ok, errMsg)
	return fmt.Sprintf(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Feishu Auth</title></head>
<body>
<script>
(function(){
  try{
    if(window.opener){
      window.opener.postMessage(%s, "*");
    }
  }catch(e){}
  setTimeout(function() {
  window.close();
}, 3000); // 延迟 3 秒关闭
})();
</script>
<p>绑定%s，窗口即将关闭...</p>
</body></html>`, msg, map[bool]string{true: "成功", false: "失败"}[ok])
}

func GetIntegrationAccountListApi(c *gin.Context) {
	userID := c.MustGet("userID").(int64)

	params := &dto.IntegrationAccountQueryDTO{
		UserID: userID,
	}

	if err := c.ShouldBindQuery(params); err != nil {
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode, data := integrationService.GetIntegrationAccountList(c.Request.Context(), params)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func UnlinkIntegrationAccountApi(c *gin.Context) {
	userID := c.MustGet("userID").(int64)

	params := &dto.IntegrationAccountDeleteDTO{
		UserID: userID,
	}

	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode := integrationService.UnlinkIntegrationAccount(c.Request.Context(), params)
	c.JSON(http.StatusOK, response.Response(responseCode, nil))
}
