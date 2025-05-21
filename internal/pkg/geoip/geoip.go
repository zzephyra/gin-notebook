package geoip

import (
	"gin-notebook/pkg/logger"
	"net"

	"github.com/oschwald/geoip2-golang"
)

var db *geoip2.Reader

func InitGeoIP(dbPath string) {
	var err error
	db, err = geoip2.Open(dbPath)
	if err == nil {
		logger.LogInfo("Database connect success", nil)
	} else {
		logger.LogError(err, "geoip init error")
		panic(err)
	}
}

func Lookup(ip string) (*geoip2.City, error) {
	parsed := net.ParseIP(ip)
	if parsed == nil {
		return nil, ErrInvalidIP
	}
	return db.City(parsed)
}

var ErrInvalidIP = &net.AddrError{Err: "invalid IP", Addr: ""}
