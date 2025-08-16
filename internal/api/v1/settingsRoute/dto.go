package settingsRoute

import (
	"fmt"
	"gin-notebook/internal/model"
	"gin-notebook/pkg/utils/tools"
)

func SettingsSerializer(settings *map[string]interface{}) {
	if systemData := (*settings)["system"]; systemData != nil {
		systemDataTyped, ok := systemData.(model.SystemSetting)
		fmt.Println(11, settings)
		if ok {
			(*settings)["system"] = tools.StructToUpdateMap(systemDataTyped, nil, []string{"id", "created_at", "updated_at"})
		}
	}
}
