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
		Https bool `toml:"https"`
	} `toml:"server"`
	Cache struct {
		Host     string `toml:"host"`
		Port     string `toml:"port"`
		DB       int    `toml:"db"`
		Password string `toml:"password"`
	} `toml:"cache"`
	Email struct {
		Host     string `toml:"host"`
		Port     int    `toml:"port"`
		User     string `toml:"user"`
		Password string `toml:"password"`
		Ssl      bool   `toml:"ssl"`
	} `toml:"email"`
	Worker struct {
		Brokers   string `toml:"brokers"`
		Topic     string `toml:"topic"`
		MaxWorker int    `toml:"max_worker"`
		MaxReties int    `toml:"max_retries"`
	}
	GeoIP struct {
		DBPath string `toml:"db_path"`
	}
	Google struct {
		ClientID string `toml:"client_id"`
	}
	AIServer struct {
		Url string `toml:"url"`
	}
	Github struct {
		Token string `toml:"token"`
		Repo  string `toml:"repo"`
		Owner string `toml:"owner"`
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
