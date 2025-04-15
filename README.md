# Gin-Notebook 📝
![alt golang](https://camo.githubusercontent.com/ff89c51c9e5a3de2b752b37bf6ab32401b9649d7acb1633ece9a40c85ae28b95/68747470733a2f2f676f6c616e672e6f72672f646f632f676f706865722f6669766579656172732e6a7067)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Go Version](https://img.shields.io/badge/go-%3E%3D1.18-blue.svg)](https://golang.org/)
[![Gin Framework](https://img.shields.io/badge/gin-gateway-green.svg)](https://gin-gonic.com/)

**Gin-Notebook** 是一个基于 Go 语言的轻量级笔记协作平台，支持多人协作编辑和个人笔记管理。项目使用 Gin 框架构建后端服务，提供高效的笔记存储、分享和团队协作功能。

## ✨ 功能特性

- **多用户系统**：支持用户注册、登录和个人资料管理
- **Markdown 支持**：完美支持 Markdown 语法编辑和实时预览
- **团队协作**：创建团队空间，多人实时协作编辑文档
- **版本控制**：文档修改历史记录，支持版本回滚
- **标签分类**：为笔记添加标签，方便分类和检索
- **全文搜索**：快速查找所需笔记内容
- **导出功能**：支持将笔记导出为 PDF/Markdown/HTML 等格式
- **RESTful API**：提供标准化的接口，方便与其他系统集成

## 🛠 技术栈

### 后端
- **Gin** - 高性能 Go Web 框架
- **GORM** - ORM 框架，用于数据库操作
- **JWT** - 用户认证和授权
- **Redis** - 缓存和会话管理
- **MySQL/PostgreSQL** - 数据持久化存储
- **Swagger** - API 文档生成

### 前端
- **React** - 前端框架
- **HeroUI** - UI 组件库
- **Axios** - HTTP 请求处理
- **WebSocket** - 实时协作功能

### 数据库
- **Postgresql** - 数据库
- 

### 其他工具
- **Docker** - 容器化部署
- **Git** - 版本控制
- **GitHub Actions** - CI/CD 自动化

## 🚀 快速开始

### 前置要求
- Go 1.18+
- MySQL 5.7+ 或 PostgreSQL 12+
- Redis 5.0+

### 安装步骤

1. 克隆仓库：
   ```bash
   git clone https://github.com/your-username/gin-notebook.git
   cd gin-notebook