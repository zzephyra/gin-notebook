package configs

import (
	"os"

	"github.com/BurntSushi/toml"
)

type Config struct {
	Database struct {
		Port     string `toml:"port"` // 对应 toml 的 database.dsn
		Host     string `toml:"host"`
		User     string `toml:"user"`
		Password string `toml:"password"`
		Database string `toml:"database"`
		Engine   string `toml:"engine"`
	} `toml:"db"`
	Server struct {
		Debug bool `toml:"debug"`
	} `toml:"server"`
	Cache struct {
		Host string `toml:"host"`
		Port string `toml:"port"`
		DB   int    `toml:"db"`
	}
}

var Configs *Config

func Load() *Config {
	Configs = &Config{}
	_, err := toml.DecodeFile("configs/config.toml", Configs)
	if err != nil {
		os.Exit(1)
	}

	return Configs
}
