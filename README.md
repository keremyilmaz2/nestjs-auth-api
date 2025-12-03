# NestJS Auth API

[![CI/CD Pipeline](https://github.com/yourusername/nestjs-auth-api/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/yourusername/nestjs-auth-api/actions/workflows/ci-cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Professional NestJS API with **Clean Architecture**, **Repository Pattern**, **Unit of Work**, **JWT Authentication**, and **Role-based Access Control**.

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
│   └── logging/             # Winston Logger
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
- 📊 **Comprehensive Logging** with Winston

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Docker & Docker Compose (optional)

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

### Docker Development

```bash
# Start all services (API + PostgreSQL)
docker-compose up -d

# Or with development mode (hot reload)
docker-compose --profile dev up -d api-dev postgres
```

## 📚 API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login & get tokens | Public |
| POST | `/api/auth/refresh` | Refresh access token | Public |

### Users

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users` | List all users | MODERATOR+ |
| GET | `/api/users/me` | Get current user | USER+ |
| GET | `/api/users/:id` | Get user by ID | MODERATOR+ |
| DELETE | `/api/users/:id` | Delete user | ADMIN |

### Posts

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/posts` | Create post | USER+ |
| GET | `/api/posts` | List all posts | USER+ |
| GET | `/api/posts/my` | Get my posts | USER+ |
| GET | `/api/posts/:id` | Get post by ID | USER+ |
| PUT | `/api/posts/:id` | Update post | Owner/MODERATOR+ |
| DELETE | `/api/posts/:id` | Delete post | MODERATOR+ |

## 🔐 Authentication

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "StrongP@ss123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "StrongP@ss123"
  }'
```

### Response
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
    "accessTokenExpiresAt": "2024-01-15T10:45:00.000Z",
    "refreshTokenExpiresAt": "2024-01-22T10:30:00.000Z",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "USER"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Using JWT Token
```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <your-access-token>"
```

### Refresh Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

## 👥 Role Hierarchy

| Role | Permissions |
|------|-------------|
| **USER** | View/create own posts |
| **MODERATOR** | USER + manage all posts, view users |
| **ADMIN** | MODERATOR + manage users, full access |

## 🐳 Docker Compose

### Production
```bash
docker-compose up -d
```

### Development (with hot reload)
```bash
docker-compose --profile dev up -d api-dev postgres
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f api
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

### Manual Deployment
```bash
# Build image
docker build -t nestjs-auth-api .

# Tag for ECR
docker tag nestjs-auth-api:latest <aws-account-id>.dkr.ecr.<region>.amazonaws.com/nestjs-auth-api:latest

# Push to ECR
docker push <aws-account-id>.dkr.ecr.<region>.amazonaws.com/nestjs-auth-api:latest
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage
```bash
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
| `CORS_ORIGIN` | CORS allowed origins | `*` |

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
