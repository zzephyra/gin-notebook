package token

import (
	"gin-notebook/pkg/logger"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtKey = []byte("secret")

type UserClaims struct {
	UserID string   `json:"user_id"`
	Role   []string `json:"role"`
	jwt.RegisteredClaims
}

// 生成访问令牌和刷新令牌
func GenerateTokens(userID int64, role []string) (accessToken, refreshToken string, err error) {
	// 访问令牌 - 短期有效 (例如15分钟)
	accessExpiration := time.Now().Add(15 * time.Minute)
	accessClaims := &UserClaims{
		UserID: strconv.FormatInt(userID, 10),
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(accessExpiration),
			Issuer:    "memoas",
		},
	}
	logger.LogInfo("jwt", map[string]interface{}{
		"UserID": userID,
		"Role":   role,
	})
	accessToken, err = jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString(jwtKey)
	if err != nil {
		return "", "", err
	}

	// 刷新令牌 - 长期有效 (例如7天)
	refreshExpiration := time.Now().Add(7 * 24 * time.Hour)
	refreshClaims := &jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(refreshExpiration),
		Issuer:    "your-app-name",
	}
	refreshToken, err = jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).SignedString(jwtKey)

	return accessToken, refreshToken, err
}

func ParseToken(tokenString string) (*UserClaims, error) {
	claims := &UserClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})
	if err != nil {
		return nil, err
	}
	if !token.Valid {
		return nil, jwt.ErrSignatureInvalid
	}
	return claims, nil
}
