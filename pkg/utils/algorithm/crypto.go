package algorithm

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"

	"golang.org/x/crypto/argon2"
)

const (
	saltLength = 16
	time       = 1
	memory     = 64 * 1024
	threads    = 4
	keyLength  = 32
)

func HashString(str string, salt []byte) []byte {
	hashedStr := argon2.IDKey([]byte(str), salt, time, memory, threads, keyLength)

	b := make([]byte, 0, saltLength+keyLength)
	b = append(b, salt...)
	b = append(b, hashedStr...)
	return b
}

func HashPassword(password string) string {
	salt := make([]byte, 16)
	_, err := rand.Read(salt)
	if err != nil {
		panic(err)
	}
	return base64.RawStdEncoding.EncodeToString(HashString(password, salt))
}

func VerifyPassword(password string, hashedPassword string) bool {
	decoded, err := base64.RawStdEncoding.DecodeString(hashedPassword)
	if err != nil {
		return false
	}

	if len(decoded) < saltLength+keyLength {
		return false
	}
	salt := decoded[:saltLength]
	storedHash := decoded[saltLength : saltLength+keyLength]

	computedHash := argon2.IDKey([]byte(password), salt, time, memory, threads, keyLength)
	return subtle.ConstantTimeCompare(computedHash, storedHash) == 1
}
