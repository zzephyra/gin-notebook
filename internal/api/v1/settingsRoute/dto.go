package settingsRoute

import (
	"fmt"
	"gin-notebook/internal/model"
	"gin-notebook/pkg/utils/tools"
)

func SettingsSerializer(settings *map[string]interface{}) {
	// 这里可以根据需要对设置进行序列化
	// 例如，将某些字段转换为特定格式
	// 这里只是一个示例，实际实现可能会更复杂
	if systemData := (*settings)["system"]; systemData != nil {
		systemDataTyped, ok := systemData.(model.SystemSetting)
		fmt.Println(11, settings)
		if ok {
			(*settings)["system"] = tools.StructToUpdateMap(systemDataTyped, nil, []string{"id", "created_at", "updated_at"})
		}
	}
}
