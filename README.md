# NestJS Auth API

[![CI/CD Pipeline](https://github.com/yourusername/nestjs-auth-api/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/yourusername/nestjs-auth-api/actions/workflows/ci-cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Professional NestJS API with **Clean Architecture**, **Repository Pattern**, **Unit of Work**, **JWT Authentication**, **Role-based Access Control**, and **ELK Stack** for centralized logging.

## ✨ Features

- 🔐 **JWT Authentication** with Access & Refresh Tokens
- 👥 **Role-based Access Control** (USER, MODERATOR, ADMIN)
- 🏗️ **Clean Architecture** with clear separation of concerns
- 📦 **Repository Pattern** with abstractions
- 🔄 **Unit of Work** for transaction management
- 📝 **Swagger/OpenAPI** documentation
- 🐳 **Docker** & Docker Compose support
- 🚀 **CI/CD** with GitHub Actions → AWS ECR → ECS Fargate
- ✅ **Unit & E2E Tests** with Jest
- 📊 **ELK Stack** (Elasticsearch + Kibana) for centralized logging
- 📁 **Log Rotation** with daily rotating files

## 🏗️ Architecture

```
src/
├── core/                    # Domain Layer (Business Rules)
│   ├── domain/              # Entities, Value Objects, Enums
│   ├── repositories/        # Repository Interfaces
│   ├── unit-of-work/        # Unit of Work Interface
│   └── services/            # Domain Service Interfaces
│
├── application/             # Application Layer (Use Cases)
│   ├── auth/                # Auth Commands & Handlers
│   ├── users/               # User Queries & Commands
│   └── posts/               # Post CRUD Operations
│
├── infrastructure/          # Infrastructure Layer
│   ├── database/            # TypeORM Implementation
│   ├── services/            # External Services
│   └── logging/             # Winston Logger + ELK
│
├── presentation/            # Presentation Layer (API)
│   ├── controllers/         # REST Controllers
│   ├── guards/              # Auth & Role Guards
│   ├── filters/             # Exception Filters
│   └── interceptors/        # Logging, Transform
│
└── shared/                  # Shared Kernel
    ├── constants/
    └── utils/
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+ (or use Docker)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nestjs-auth-api.git
   cd nestjs-auth-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start PostgreSQL** (with Docker)
   ```bash
   docker-compose up -d postgres
   ```

5. **Run the application**
   ```bash
   npm run start:dev
   ```

6. **Access the API**
   - API: http://localhost:3000/api
   - Swagger: http://localhost:3000/api/docs

### Docker Development (Full Stack)

```bash
# Start all services (API + PostgreSQL + Elasticsearch + Kibana)
docker-compose up -d

# Or with development mode (hot reload)
docker-compose --profile dev up -d api-dev postgres elasticsearch kibana
```

## 📚 API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/auth/register` | Register new user | Public |
| POST | `/api/v1/auth/login` | Login & get tokens | Public |
| POST | `/api/v1/auth/refresh` | Refresh access token | Public |

### Users

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/users` | List all users | MODERATOR+ |
| GET | `/api/v1/users/me` | Get current user | USER+ |
| GET | `/api/v1/users/:id` | Get user by ID | MODERATOR+ |
| DELETE | `/api/v1/users/:id` | Delete user | ADMIN |

### Posts

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/posts` | Create post | USER+ |
| GET | `/api/v1/posts` | List all posts | USER+ |
| GET | `/api/v1/posts/my` | Get my posts | USER+ |
| GET | `/api/v1/posts/:id` | Get post by ID | USER+ |
| PUT | `/api/v1/posts/:id` | Update post | Owner/MODERATOR+ |
| DELETE | `/api/v1/posts/:id` | Delete post | MODERATOR+ |

## 🔐 Authentication

### Register
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "StrongP@ss123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "StrongP@ss123"
  }'
```

### Using JWT Token
```bash
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <your-access-token>"
```

## 👥 Role Hierarchy

| Role | Permissions |
|------|-------------|
| **USER** | View/create own posts |
| **MODERATOR** | USER + manage all posts, view users |
| **ADMIN** | MODERATOR + manage users, full access |

## 📊 Logging & Monitoring

### Log Architecture

```
┌─────────────┐     ┌───────────────────┐     ┌─────────────┐
│   NestJS    │────▶│  Elasticsearch    │◀────│   Kibana    │
│   API       │     │  (Log Storage)    │     │   (UI)      │
└─────────────┘     └───────────────────┘     └─────────────┘
     :3000               :9200                    :5601
        │
        ▼
   logs/
   ├── error-YYYY-MM-DD.log
   ├── combined-YYYY-MM-DD.log
   ├── exceptions-YYYY-MM-DD.log
   └── rejections-YYYY-MM-DD.log
```

### Log Features

- **Daily Rotation**: Log files rotate daily with date suffix
- **Size Limit**: Max 20MB per file
- **Retention**: 14 days (auto-cleanup)
- **Centralized**: All logs sent to Elasticsearch
- **Correlation ID**: Track requests across services

### Log Levels by Environment

| Environment | Console | File | Elasticsearch |
|-------------|---------|------|---------------|
| Development | `debug` | All | All |
| Production | `warn+` | All | All |

### Accessing Kibana

1. **Start ELK Stack**
   ```bash
   docker-compose up -d elasticsearch kibana
   ```

2. **Open Kibana**: http://localhost:5601
   - Username: `elastic`
   - Password: `changeme` (or your `ELASTIC_PASSWORD`)

3. **Create Index Pattern**
   - Go to: Stack Management → Index Patterns
   - Create: `nestjs-logs-*`
   - Timestamp: `@timestamp`

4. **View Logs**
   - Go to: Analytics → Discover
   - Select: `nestjs-logs-*`

### Kibana Query Examples

```
# All errors
level: "error"

# Specific correlation ID
correlationId: "abc-123"

# 401 errors
message: *401*

# Last 15 minutes + errors
level: "error" AND @timestamp >= now-15m

# Specific endpoint
message: */api/v1/auth/login*
```

### Log Format (Elasticsearch)

```json
{
  "@timestamp": "2025-12-03T19:15:30.123Z",
  "level": "info",
  "message": "[abc-123] → POST /api/v1/auth/login - 200 - 45ms",
  "context": "LoggingInterceptor",
  "correlationId": "abc-123",
  "service": "nestjs-auth-api",
  "environment": "development"
}
```

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| `api` | 3000 | NestJS Application |
| `postgres` | 5432 | PostgreSQL Database |
| `elasticsearch` | 9200 | Log Storage & Search |
| `kibana` | 5601 | Log Visualization |

### Commands

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d postgres elasticsearch kibana

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## 🚀 Deployment (AWS ECS Fargate)

### Prerequisites
1. AWS Account with ECR and ECS configured
2. GitHub repository secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

### Workflow Steps
1. Push to `main` branch
2. GitHub Actions runs tests
3. Docker image built & pushed to ECR
4. ECS Fargate deployment triggered

## 🧪 Testing

```bash
# Unit Tests
npm run test

# E2E Tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 📁 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_USERNAME` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `DB_NAME` | Database name | `nestjs_auth_db` |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_DAYS` | Refresh token TTL | `7` |
| `ELASTICSEARCH_NODE` | Elasticsearch URL | `http://localhost:9200` |
| `ELASTICSEARCH_INDEX_PREFIX` | Log index prefix | `nestjs-logs` |
| `ELASTICSEARCH_USERNAME` | Elasticsearch user | `elastic` |
| `ELASTICSEARCH_PASSWORD` | Elasticsearch pass | `changeme` |

## 📝 Scripts

```bash
npm run build          # Build for production
npm run start          # Start production server
npm run start:dev      # Start development server
npm run start:debug    # Start with debugger
npm run lint           # Run ESLint
npm run test           # Run unit tests
npm run test:e2e       # Run E2E tests
npm run test:cov       # Run tests with coverage
```

## 📄 License

This project is licensed under the MIT License.