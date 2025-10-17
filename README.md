# 📝 Mamoes

![Go](https://camo.githubusercontent.com/ff89c51c9e5a3de2b752b37bf6ab32401b9649d7acb1633ece9a40c85ae28b95/68747470733a2f2f676f6c616e672e6f72672f646f632f676f706865722f6669766579656172732e6a7067)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Go Version](https://img.shields.io/badge/go-%3E%3D1.18-blue.svg)](https://golang.org/)
[![Gin Framework](https://img.shields.io/badge/gin-gateway-green.svg)](https://gin-gonic.com/)

**Mamoes** 是一个基于 **Go + React** 的轻量级笔记协作平台，支持多人实时协作、任务管理与 AI 智能交互。  
项目采用前后端分离架构：后端使用 **Gin + GORM**，前端使用 **React + HeroUI** 构建。

---

## ✨ 1. 功能特性

- 🧑‍🤝‍🧑 **多用户系统**：支持注册、登录、权限与个人资料管理  
- 🧭 **团队协作**：创建团队空间，多人实时协作编辑文档  
- 📤 **导出功能**：一键导出笔记为 PDF / Markdown / HTML 等格式  
- ⚙️ **RESTful API**：提供标准化接口，便于集成第三方服务  
- 🤖 **AI 集成**：支持 AI 助手对话与内容生成  
- 🗂 **看板任务**：内置任务管理系统（支持拖拽与优先级）  
- 📅 **日历活动**：创建与共享团队活动日程  

---

## 🛠️ 2. 技术栈

### 🔹 后端
- [**Gin**](https://gin-gonic.com/) — 高性能 Go Web 框架  
- [**GORM**](https://gorm.io/) — ORM 框架  
- **JWT** — 用户认证与授权  
- **Redis** — 缓存与会话管理  
- **Casbin** — 权限与角色控制  
- **Swagger** — 自动化 API 文档生成  
- **Asynq** — 异步任务队列  

### 🔹 前端
- [**React**](https://reactjs.org/) — 前端框架  
- [**HeroUI**](https://www.heroui.com/) — 现代化 UI 组件库  
- [**Axios**](https://axios-http.com/) — HTTP 客户端  
- [**Redux**](https://github.com/reduxjs/redux) — 状态管理  
- [**Semi Design**](https://semi.design/zh-CN) — UI 组件库  
- [**BlockNote**](https://www.blocknotejs.org/) — 富文本编辑器  

### 🔹 数据库
- **PostgreSQL** — 主数据库  
- **Redis** — 缓存层与消息队列  

### 🔹 开发与部署
- **Docker** — 容器化部署  
- **Git & GitHub Actions** — 版本控制与 CI/CD 自动化  

---

## 🚀 3. 快速开始

### 📋 前置要求
确保已安装以下环境：
- Go **1.18+**
- MySQL **5.7+** 或 PostgreSQL **12+**
- Redis **5.0+**

---

### 🖥️ 3.1 后端部署

#### 📦 安装依赖
```bash
go mod download
```

#### ⚙️ 配置文件
在 `configs/` 目录中，将 `config.toml.example` 重命名为 `config.toml`，并填写相应的数据库和服务配置。

#### ▶️ 编译并运行
```bash
make build && make dev
```

---

### 💻 3.2 前端部署

#### 📦 安装依赖
```bash
npm install
```

#### ⚙️ 环境变量
将以下文件修改为正式配置：
- `web/src/config/*.example` → 去除 `.example` 后缀  
- `web/.env.example` → `.env`

根据需要修改其中的环境变量（部分为可选）。

#### ▶️ 启动前端
```bash
npm run dev
```

前端将在本地开发服务器启动，可通过浏览器访问。

---

## 📚 4. 项目许可

本项目基于 [**MIT License**](LICENSE) 开源。  
欢迎 Fork、提 Issue、提交 PR 一起完善 **Mamoes** 🚀

---

## 🧭 5. 后续计划

* [ ] 支持多人实时协作
* [ ] MCP 管理体系
* [ ] 第三方数据同步 (目前正在集成飞书)