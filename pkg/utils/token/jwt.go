package token

import (
	"gin-notebook/pkg/logger"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtKey = []byte("secret")

type UserClaims struct {
	UserID   int64    `json:"user_id"`
	Role     []string `json:"role"`
	Avatar   string   `json:"avatar"`
	Nickname *string  `json:"username"`
	Email    string   `json:"email"`
	jwt.RegisteredClaims
}

// 生成访问令牌和刷新令牌
func GenerateTokens(userID int64, role []string, Nickname *string, Email string, Avatar string) (accessToken string, err error) {
	// 访问令牌 - 短期有效 (例如15分钟)

	if Nickname == nil {
		Nickname = new(string)
		*Nickname = ""
	}

	accessExpiration := time.Now().Add(600 * time.Minute)
	accessClaims := &UserClaims{
		UserID:   userID,
		Role:     role,
		Nickname: Nickname,
		Email:    Email,
		Avatar:   Avatar,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(accessExpiration),
			Issuer:    "mameos",
		},
	}
	logger.LogInfo("jwt", map[string]interface{}{
		"UserID": userID,
		"Role":   role,
	})
	accessToken, err = jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString(jwtKey)
	if err != nil {
		return "", err
	}

	return accessToken, err
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
