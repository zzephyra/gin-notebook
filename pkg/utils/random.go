package utils

import (
	"crypto/rand"
	"math/big"
	"strconv"
)

func RandomCaptcha() string {
	n, err := rand.Int(rand.Reader, big.NewInt(900000))
	if err != nil {
		panic(err)
	}
	randomNumber := n.Int64() + 100000
	return strconv.FormatInt(randomNumber, 10)
}
