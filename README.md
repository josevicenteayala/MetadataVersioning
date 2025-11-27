# Metadata Versioning Service

> A production-ready RESTful API for comprehensive metadata management with version control, schema validation, and publishing workflows — plus a coffeehouse-inspired React frontend.

[![Java](https://img.shields.io/badge/Java-21_LTS-orange.svg)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5.0-green.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## 🎯 Overview

MetadataVersioning is a platform that helps business users and developers manage versioned JSON metadata for topics such as loyalty programs, retail campaigns, offers, and coupons. Every change is versioned, validated against schemas, and traceable through a complete audit history.

### Key Features

- 📝 **Versioned JSON Storage**: Every save creates an immutable version with full change history
- 🔄 **Version Control**: Create, activate, and compare versions with built-in diff engine
- ✅ **Schema Validation**: JSON Schema validation with flexible custom property support
- 🚀 **Publishing Workflow**: Draft → Approved → Published → Archived lifecycle
- 🔍 **Version Comparison**: Side-by-side diff to understand changes before publishing
- 🔐 **Security**: Public read access, authenticated write operations
- 📊 **Observability**: Micrometer metrics, health checks, distributed tracing
- 🏗️ **Hexagonal Architecture**: Clean separation of domain, application, and adapter layers
- ☕ **Coffeehouse UI**: Modern React frontend with warm, inviting design

## 🚀 Quick Start

### Prerequisites

- **Java 21 LTS** (OpenJDK 21.0.9 or later)
- **Maven 3.9+**
- **Node.js 20+** and **pnpm 9+** (for frontend)
- **PostgreSQL 17+**
- **Docker** (optional, for running PostgreSQL)

### 1. Start PostgreSQL

Using Docker:
\`\`\`bash
docker-compose up -d
\`\`\`

Or manually:
\`\`\`bash
psql -U postgres -c "CREATE DATABASE metadata_versioning;"
\`\`\`

### 2. Build & Run the Backend

\`\`\`bash
# Build the application
mvn clean install

# Run the application
mvn spring-boot:run

# Verify health
curl http://localhost:8080/actuator/health
\`\`\`

### 3. Start the Frontend

\`\`\`bash
cd ui/coffeehouse-frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open browser at http://localhost:5173
\`\`\`

### 4. Try the API

#### Create a metadata document:
\`\`\`bash
curl -X POST http://localhost:8080/api/v1/metadata \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Basic dXNlcjpwYXNz" \\
  -d '{
    "type": "loyalty-program",
    "name": "gold-tier",
    "content": {
      "displayName": "Gold Tier Benefits",
      "pointsMultiplier": 1.5,
      "perks": ["Free shipping", "Birthday bonus", "Priority support"]
    }
  }'
\`\`\`

#### Retrieve active version:
\`\`\`bash
curl http://localhost:8080/api/v1/metadata/loyalty-program/gold-tier/active
\`\`\`

#### List all versions:
\`\`\`bash
curl http://localhost:8080/api/v1/metadata/loyalty-program/gold-tier/versions
\`\`\`

#### Compare versions:
\`\`\`bash
curl http://localhost:8080/api/v1/metadata/loyalty-program/gold-tier/versions/compare?from=1\&to=2
\`\`\`

## 📚 API Documentation

Full OpenAPI 3.1 specification available at:
- **Swagger UI**: http://localhost:8080/swagger-ui/index.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs
- **Spec**: [\`specs/001-metadata-version-api/contracts/openapi.yaml\`](specs/001-metadata-version-api/contracts/openapi.yaml)

Swagger access:
- No auth needed to load the docs UI/JSON.
- Use HTTP Basic when trying secured endpoints from the UI:
  - \`admin\` / \`admin\`
  - \`user\` / \`user\`

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/metadata\` | GET | List all metadata documents (paginated) |
| \`/metadata\` | POST | Create new metadata document (auth required) |
| \`/metadata/{type}/{name}/active\` | GET | Get currently active version |
| \`/metadata/{type}/{name}/versions\` | GET | List all versions (supports state filtering) |
| \`/metadata/{type}/{name}/versions\` | POST | Create new version (auth required) |
| \`/metadata/{type}/{name}/versions/{version}/activate\` | POST | Activate specific version (auth required) |
| \`/metadata/{type}/{name}/versions/{version}/state\` | PATCH | Transition publishing state (auth required) |
| \`/metadata/{type}/{name}/versions/compare\` | GET | Compare two versions |
| \`/schemas\` | POST | Define schema for metadata type (auth required) |

## 🏗️ Architecture

### Hexagonal Architecture (Ports & Adapters)

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                        Adapter Layer                         │
│  ┌──────────────┐     ┌────────────────┐                    │
│  │ REST API     │     │ JPA Repository │                    │
│  │ Controllers  │     │ Adapters       │                    │
│  └──────────────┘     └────────────────┘                    │
└───────────────┬────────────────┬────────────────────────────┘
                │                │
┌───────────────▼────────────────▼────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Use Case Ports (Inbound)                            │   │
│  │  - CreateVersionUseCase                              │   │
│  │  - ActivateVersionUseCase                            │   │
│  │  - CompareVersionsUseCase                            │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Repository Ports (Outbound)                         │   │
│  │  - MetadataDocumentRepository                        │   │
│  │  - SchemaDefinitionRepository                        │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                        Domain Layer                           │
│  ┌──────────────┐  ┌────────────┐  ┌──────────────────┐    │
│  │ Entities     │  │ Value      │  │ Domain Services  │    │
│  │ - Metadata   │  │ Objects    │  │ - DiffEngine     │    │
│  │   Document   │  │ - Version  │  │ - Schema         │    │
│  │ - Schema     │  │ - Change   │  │   Validator      │    │
│  │   Definition │  │   Type     │  │                  │    │
│  └──────────────┘  └────────────┘  └──────────────────┘    │
└────────────────────────────────────────────────────────────┘
\`\`\`

### Technology Stack

#### Backend
- **Java 21 LTS**: Modern Java with Records, Sealed Classes, Pattern Matching
- **Spring Boot 3.5.0**: Production-ready framework with comprehensive ecosystem
- **PostgreSQL 17+**: JSONB support for flexible JSON storage with GIN indexes
- **Flyway**: Database migration management
- **Jackson**: JSON serialization/deserialization
- **TestContainers**: Integration testing with real PostgreSQL
- **ArchUnit**: Architecture validation and hexagonal boundary enforcement
- **Micrometer**: Application metrics and monitoring
- **Spring Boot Actuator**: Health checks and observability endpoints

#### Frontend (Coffeehouse UI)
- **React 19** with **TypeScript 5.9** (strict mode)
- **Vite 7**: Fast development and optimized builds
- **React Router 7**: Client-side routing
- **TanStack Query 5**: Data fetching and caching
- **Zustand**: Session state management
- **Axios**: HTTP requests with OpenAPI-generated client
- **jsondiffpatch**: JSON diff visualization
- **Tailwind CSS**: Custom coffeehouse design tokens
- **Vitest** + **React Testing Library**: Unit tests (150 passing)
- **Playwright**: End-to-end tests

## 📊 Observability

### Health Checks
\`\`\`bash
# Liveness probe
curl http://localhost:8080/actuator/health/liveness

# Readiness probe
curl http://localhost:8080/actuator/health/readiness

# Detailed health
curl http://localhost:8080/actuator/health
\`\`\`

### Metrics
\`\`\`bash
# Prometheus metrics
curl http://localhost:8080/actuator/prometheus

# Application metrics
curl http://localhost:8080/actuator/metrics
\`\`\`

### Distributed Tracing
All requests include \`X-Correlation-ID\` header for distributed tracing:
\`\`\`bash
curl -H "X-Correlation-ID: my-trace-123" http://localhost:8080/api/v1/metadata
\`\`\`

## 🧪 Testing

### Backend Tests
\`\`\`bash
mvn clean test
\`\`\`

**Coverage**: 39 tests passing (100% pass rate)

| Feature | Tests | Status |
|---------|-------|--------|
| US1: Create & Version | 12 | ✅ PASS |
| US2: Activate & Consume | 3 | ✅ PASS |
| US3: Version Comparison | 6 | ✅ PASS |
| US4: Schema Management | 13 | ✅ PASS |
| US5: Publishing Lifecycle | 5 | ✅ PASS |

### Frontend Tests
\`\`\`bash
cd ui/coffeehouse-frontend

# Unit tests
pnpm test:ci

# E2E tests
pnpm test:e2e
\`\`\`

**Coverage**: 150 unit tests passing, 8 e2e test suites

## 🚢 Deployment

### Docker Compose (Development)
\`\`\`bash
docker-compose up -d
\`\`\`

### Production Configuration

Update \`application.yaml\` for production:
\`\`\`yaml
spring:
  datasource:
    url: \${DATABASE_URL}
    username: \${DATABASE_USERNAME}
    password: \${DATABASE_PASSWORD}
  
  jpa:
    show-sql: false
  
logging:
  level:
    root: INFO
    com.metadata.versioning: INFO
\`\`\`

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| \`DATABASE_URL\` | PostgreSQL JDBC URL | \`jdbc:postgresql://localhost:5432/metadata_versioning\` |
| \`DATABASE_USERNAME\` | Database username | \`postgres\` |
| \`DATABASE_PASSWORD\` | Database password | \`postgres\` |
| \`SERVER_PORT\` | Application port | \`8080\` |
| \`VITE_API_BASE_URL\` | Frontend API URL | \`http://localhost:8080\` |

## 📖 Documentation

- **[VISION.md](docs/VISION.md)** - Product vision and target audiences
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Technical design and patterns
- **[PRODUCT_ROADMAP.md](docs/PRODUCT_ROADMAP.md)** - MVP scope and timeline
- **[API_REFERENCE.md](docs/API_REFERENCE.md)** - Complete API documentation
- **[UI_GUIDE.md](docs/UI_GUIDE.md)** - Frontend design and components
- **[Backend Spec](specs/001-metadata-version-api/)** - Backend feature specification
- **[Frontend Spec](specs/001-coffeehouse-frontend/)** - Frontend feature specification

## 📁 Project Structure

\`\`\`
MetadataVersioning/
├── src/                              # Backend Java source
│   ├── main/java/com/metadata/versioning/
│   │   ├── adapter/                  # REST controllers, JPA repositories
│   │   ├── application/              # Use cases and ports
│   │   └── domain/                   # Entities, value objects, services
│   └── main/resources/
│       ├── application.yaml          # Configuration
│       └── db/migration/             # Flyway migrations
├── ui/coffeehouse-frontend/          # React frontend
│   ├── src/
│   │   ├── app/                      # App shell, routes, providers
│   │   ├── features/                 # Feature modules (dashboard, versions, etc.)
│   │   ├── services/                 # API client, auth, feedback
│   │   └── styles/                   # Tailwind tokens and theme
│   └── tests/                        # Unit and e2e tests
├── specs/                            # Feature specifications
│   ├── 001-metadata-version-api/     # Backend spec
│   └── 001-coffeehouse-frontend/     # Frontend spec
└── docs/                             # Documentation
\`\`\`

## 🎯 Implementation Status

### Backend: **99 of 102 tasks (97%)**

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1-2 | Setup + Foundational | ✅ Complete |
| Phase 3 | US1 - Create and Version Metadata | ✅ Complete |
| Phase 4 | US2 - Activate and Consume Metadata | ✅ Complete |
| Phase 5 | US3 - Compare Versions | ✅ Complete |
| Phase 6 | US4 - Manage Schema Definitions | ✅ Complete |
| Phase 7 | US5 - Track Publishing Lifecycle | ✅ Complete |
| Phase 8 | Polish & Cross-Cutting | ✅ Complete |

### Frontend: **69 of 69 tasks (100%)**

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Setup (Shared Infrastructure) | ✅ Complete |
| Phase 2 | Foundational | ✅ Complete |
| Phase 3 | US1 - Dashboard & Document List | ✅ Complete |
| Phase 4 | US2 - Version History | ✅ Complete |
| Phase 5 | US3 - Version Lifecycle | ✅ Complete |
| Phase 6 | US4 - Version Comparison | ✅ Complete |
| Phase 7 | US5 - Auth Settings | ✅ Complete |
| Phase 8 | Polish & Cross-Cutting | ✅ Complete |
| Phase 9 | Release Readiness | ✅ Complete |

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'feat: add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

### Development Guidelines

- Follow hexagonal architecture principles
- Write tests before implementation (TDD)
- Maintain 85%+ test coverage
- Use conventional commits
- Update documentation for API changes

## 📝 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/josevicenteayala/MetadataVersioning/issues)
- **Documentation**: [docs/](docs/)

---

Built with ❤️ using Java 21 LTS, Spring Boot 3.5, React 19, and PostgreSQL 17
