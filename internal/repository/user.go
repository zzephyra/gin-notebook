package repository

import (
	"encoding/json"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/pkg/rbac"
	"gin-notebook/pkg/utils/algorithm"

	"github.com/jinzhu/copier"
	"gorm.io/datatypes"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func CreateUser(data dto.CreateUserDTO) (*model.User, error) {
	user := &model.User{
		Email:    data.Email,
		Password: string(algorithm.HashPassword(data.Password)),
		Nickname: data.Nickname,
		Avatar:   *data.Avatar,
	}
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(user).Error; err != nil {
			return err
		}
		rbac.SetUserRole(user.ID, rbac.USER)

		CreateUserSettings(user.ID, &model.UserSetting{
			OwnerID: user.ID,
		})
		return nil
	})

	if err != nil {
		return nil, err
	}

	return user, nil
}

func CreateUserSettings(userID int64, settings *model.UserSetting) error {
	result := database.DB.Create(settings)
	return result.Error
}

func GetUserByEmail(email string) (*model.User, error) {
	user := &model.User{}
	if err := database.DB.Where("email = ?", email).First(user).Error; err != nil {
		return nil, err
	}
	return user, nil
}

func GetUserByID(id int64) (*model.User, int) {
	user := &model.User{}
	if err := database.DB.Where("id = ?", id).First(user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, message.ERROR_USER_NOT_EXIST
		} else {
			return nil, message.ERROR_DATABASE
		}
	}
	return user, 0
}

func UpdateUser(UserID int64, data map[string]interface{}) (err error) {
	if data["password"] != nil {
		data["password"] = string(algorithm.HashPassword(data["password"].(string)))
	}

	err = database.DB.Model(&model.User{}).Where("id = ?", UserID).Updates(data).Error
	return
}

func CreateUserDevice(params *dto.UserDeviceCreateDTO) error {
	var device = model.UserDevice{}
	copier.Copy(&device, params) // 将dto参数复制到model结构体中，但是缺少country和city

	location := params.Location
	if location != nil {
		country, _ := json.Marshal(location.Country)
		city, _ := json.Marshal(location.City)

		device.Country = datatypes.JSON(country)
		device.City = datatypes.JSON(city)
	}
	return database.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "fingerprint"}}, // 冲突目标
		DoUpdates: clause.AssignmentColumns([]string{"ip", "user_agent", "country", "city", "updated_at"}),
	}).Create(&device).Error
}

func GetUserDeviceList(filter map[string]interface{}, limit int, offset int) (*[]model.UserDevice, int64, error) {
	var (
		devices []model.UserDevice
		total   int64
	)

	db := database.DB.Model(&model.UserDevice{}).Where(filter)
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := database.DB.Limit(limit).Offset(offset).Where(filter).Find(&devices).Error
	if err != nil {
		return nil, 0, err
	}
	return &devices, total, nil
}
