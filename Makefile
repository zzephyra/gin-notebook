# 定义常量
BINARY_NAME=Mamoes
GO_PATH=$(shell go env GOPATH)
GO_FILES=$(shell find . -name '*.go' -not -path "./vendor/*")
VERSION=$(shell git describe --tags --always)
BUILD_TIME=$(shell date +%FT%T%z)
LDFLAGS=-ldflags "-X main.Version=$(VERSION) -X main.BuildTime=$(BUILD_TIME)"

# 默认目标
.PHONY: all
all: build

# 编译项目（开发环境）
.PHONY: build
build:
	@echo "Building $(BINARY_NAME)..."
	go build -o bin/$(BINARY_NAME) $(LDFLAGS) ./cmd/server

.PHONY: dev
dev:
	$(GO_PATH)/bin/air -c .air.toml

.PHONY: install
install:
	@echo "Installing $(BINARY_NAME)..."
	go mod download

.PHONY: customer
customer:
	go run cmd/customer/main.go

.PHONY: worker
worker:
	go run cmd/worker/main.go

.PHONY: frontend
frontend:
	@echo "Building frontend..."
	cd web && npm run dev