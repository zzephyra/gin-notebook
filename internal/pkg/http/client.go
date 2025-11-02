// ai/httpclient/httpclient.go
package http

import (
	"net"
	"net/http"
	"sync"
	"time"
)

var (
	clientOnce sync.Once
	client     *http.Client

	sseOnce   sync.Once
	sseClient *http.Client
)

func GetClient() *http.Client {
	clientOnce.Do(func() {
		tr := &http.Transport{
			Proxy:                 http.ProxyFromEnvironment,
			ForceAttemptHTTP2:     true,
			DisableCompression:    false, // 允许压缩，小体积 JSON 更快
			MaxIdleConns:          200,
			MaxIdleConnsPerHost:   100,
			IdleConnTimeout:       90 * time.Second,
			TLSHandshakeTimeout:   5 * time.Second,
			ExpectContinueTimeout: 1 * time.Second,
			DialContext: (&net.Dialer{
				Timeout:   3 * time.Second,
				KeepAlive: 60 * time.Second,
			}).DialContext,
		}
		client = &http.Client{
			Transport: tr,
			Timeout:   1 * time.Minute, // 上游硬超时
		}
	})
	return client
}

func GetStreamClient() *http.Client {
	sseOnce.Do(func() {
		sseClient = &http.Client{
			Transport: &http.Transport{
				Proxy:                 http.ProxyFromEnvironment,
				ForceAttemptHTTP2:     true,
				DisableCompression:    false,
				MaxConnsPerHost:       64,
				MaxIdleConns:          256,
				MaxIdleConnsPerHost:   64,
				IdleConnTimeout:       90 * time.Second,
				ResponseHeaderTimeout: 15 * time.Second, // 等首包
				TLSHandshakeTimeout:   5 * time.Second,
				ExpectContinueTimeout: 1 * time.Second,
				DialContext: (&net.Dialer{
					Timeout:   5 * time.Second,
					KeepAlive: 60 * time.Second,
				}).DialContext,
			},
			Timeout: 0, // 关键：流式不能用整体超时
		}
	})
	return sseClient
}
