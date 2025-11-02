package aiServer

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/pkg/utils/tools"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

var (
	instance *AiServer
	once     sync.Once
)

func Init(baseURL string) {
	if !tools.IsValidURL(baseURL) {
		panic("Invalid AI Server URL")
	}

	once.Do(func() {
		instance = &AiServer{
			BaseURL: baseURL,
			Client:  &http.Client{Timeout: 30 * time.Second},
		}
	})
}

func GetInstance() *AiServer {
	if instance == nil {
		panic("AiServer not initialized — call Init() first")
	}
	return instance
}

type AiServer struct {
	mu      sync.RWMutex
	BaseURL string
	Client  *http.Client
}

func (s *AiServer) GetBaseURL() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.BaseURL
}

func (s *AiServer) SetBaseURL(url string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.BaseURL = url
}

func (s *AiServer) Embed(ctx context.Context, text string) ([]float32, error) {
	path, err := s.JoinPath("embed/")
	if err != nil {
		return nil, err
	}

	payload := map[string]string{
		"text": text,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, path, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := s.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
		return nil, fmt.Errorf("http %d: %s", resp.StatusCode, strings.TrimSpace(string(b)))
	}

	var env dto.Envelope[dto.EmbedResponse]
	if err := json.NewDecoder(resp.Body).Decode(&env); err != nil {
		return nil, err
	}

	if env.Error != nil {
		return nil, fmt.Errorf("%s", *env.Error)
	}

	if env.Data == nil {
		return nil, fmt.Errorf("no data in response")
	}

	return env.Data.Embeddings, nil
}

func (s *AiServer) JoinPath(subUrl string) (string, error) {
	full, err := url.JoinPath(s.BaseURL, subUrl)
	if err != nil {
		return "", err
	}
	return full, nil
}

func (s *AiServer) GetIntent(ctx context.Context, text string) (*dto.IntentResponse, error) {
	path, err := s.JoinPath("intent/")
	if err != nil {
		return nil, err
	}

	payload := map[string]string{
		"text": text,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, path, bytes.NewReader(body))

	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := s.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
		return nil, fmt.Errorf("http %d: %s", resp.StatusCode, strings.TrimSpace(string(b)))
	}

	var env dto.Envelope[dto.IntentResponse]
	if err := json.NewDecoder(resp.Body).Decode(&env); err != nil {
		return nil, err
	}

	if env.Error != nil {
		return nil, fmt.Errorf("%s", *env.Error)
	}

	if env.Data == nil {
		return nil, fmt.Errorf("no data in response")
	}

	return env.Data, nil
}
