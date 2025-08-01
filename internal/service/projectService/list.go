package projectService

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/utils/tools"
)

func GetWorkspaceProject(params *dto.ListProjectsDTO) (responseCode int, data map[string]interface{}) {
	projects, err := repository.GetProjectsByWorkspaceID(database.DB, params.WorkspaceID)
	if err != nil {
		responseCode = database.IsError(err)
		return
	}

	responseCode = message.SUCCESS
	data = map[string]interface{}{
		"projects": []map[string]interface{}{},
	}

	for _, project := range projects {
		data["projects"] = append(data["projects"].([]map[string]interface{}), tools.StructToUpdateMap(project, nil, []string{"DeletedAt", "CreatedAt", "UpdatedAt"}))
	}

	return
}
