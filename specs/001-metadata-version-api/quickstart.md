# Quickstart Guide - Metadata Versioning API

Get started with the Metadata Versioning API in under 10 minutes.

## Prerequisites

- **Java 21** - [Download OpenJDK 21](https://adoptium.net/)
- **Maven 3.9+** - [Install Maven](https://maven.apache.org/install.html)
- **Docker & Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)
- **Git** - Version control
- **curl** or **HTTPie** - For API testing

Verify installations:
```bash
java -version   # Should show version 21.x
mvn -version    # Should show 3.9.x or higher
docker --version
```

## Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd JsonVersionManager
git checkout 001-metadata-version-api
```

### 2. Start PostgreSQL and Redis

```bash
# Start infrastructure services
docker-compose up -d postgres redis

# Verify services are running
docker ps | grep -E 'postgres|redis'
```

### 3. Configure Application

Create `application-local.yml` (or use defaults):

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/metadata_versioning
    username: postgres
    password: postgres
  data:
    redis:
      host: localhost
      port: 6379

logging:
  level:
    com.metadata: DEBUG
```

### 4. Build and Run

```bash
# Build project
mvn clean install

# Run application
mvn spring-boot:run -Dspring-boot.run.profiles=local

# Application starts on http://localhost:8080
```

Verify startup:
```bash
curl http://localhost:8080/actuator/health
# {"status":"UP"}
```

## First API Calls

### 1. Create First Metadata Document

```bash
# Create loyalty program metadata (no authentication required for demo)
curl -X POST http://localhost:8080/api/v1/metadata \
  -H "Content-Type: application/json" \
  -u "admin:admin" \
  -d '{
    "type": "loyalty-program",
    "name": "spring-bonus",
    "content": {
      "programId": "SPRING2025",
      "startDate": "2025-03-01",
      "endDate": "2025-05-31",
      "maxReward": 500,
      "eligibleTiers": ["gold", "platinum"]
    }
  }'
```

Response shows version 1 created:
```json
{
  "id": 1,
  "versionNumber": 1,
  "type": "loyalty-program",
  "name": "spring-bonus",
  "publishingState": "DRAFT",
  "isActive": false,
  "author": "admin",
  "createdAt": "2025-11-14T10:30:00Z"
}
```

### 2. Publish and Activate Version

```bash
# Transition DRAFT → APPROVED
curl -X POST http://localhost:8080/api/v1/metadata/loyalty-program/spring-bonus/versions/1/publish \
  -H "Content-Type: application/json" \
  -u "admin:admin" \
  -d '{"state": "APPROVED"}'

# Transition APPROVED → PUBLISHED
curl -X POST http://localhost:8080/api/v1/metadata/loyalty-program/spring-bonus/versions/1/publish \
  -H "Content-Type: application/json" \
  -u "admin:admin" \
  -d '{"state": "PUBLISHED"}'

# Activate version 1
curl -X POST http://localhost:8080/api/v1/metadata/loyalty-program/spring-bonus/versions/1/activate \
  -u "admin:admin"
```

### 3. Consume Active Version

```bash
# Get active version (public access, no auth)
curl http://localhost:8080/api/v1/metadata/loyalty-program/spring-bonus/active
```

### 4. Create New Version

```bash
# Create version 2 with updated rewards
curl -X POST http://localhost:8080/api/v1/metadata/loyalty-program/spring-bonus/versions \
  -H "Content-Type: application/json" \
  -u "admin:admin" \
  -d '{
    "content": {
      "programId": "SPRING2025",
      "startDate": "2025-03-01",
      "endDate": "2025-05-31",
      "maxReward": 1000,
      "eligibleTiers": ["gold", "platinum", "diamond"]
    },
    "changeSummary": "Increased max reward and added diamond tier"
  }'
```

### 5. Compare Versions

```bash
# Compare v1 to v2
curl "http://localhost:8080/api/v1/metadata/loyalty-program/spring-bonus/compare?from=1&to=2"
```

Response shows changes:
```json
{
  "fromVersion": 1,
  "toVersion": 2,
  "changes": [
    {
      "operation": "replace",
      "path": "/maxReward",
      "oldValue": 500,
      "newValue": 1000,
      "type": "NON_BREAKING"
    },
    {
      "operation": "add",
      "path": "/eligibleTiers/2",
      "newValue": "diamond",
      "type": "ADDITIVE"
    }
  ],
  "hasBreakingChanges": false,
  "summary": "2 change(s): 0 breaking, 1 additive, 1 non-breaking"
}
```

## Common Workflows

### Define Schema for Validation

```bash
# Create schema for loyalty-program type
curl -X POST http://localhost:8080/api/v1/schemas \
  -H "Content-Type: application/json" \
  -u "admin:admin" \
  -d '{
    "type": "loyalty-program",
    "schema": {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "type": "object",
      "required": ["programId", "startDate", "endDate", "maxReward"],
      "properties": {
        "programId": {"type": "string"},
        "startDate": {"type": "string", "format": "date"},
        "endDate": {"type": "string", "format": "date"},
        "maxReward": {"type": "number", "minimum": 0},
        "eligibleTiers": {
          "type": "array",
          "items": {"type": "string"}
        }
      }
    },
    "allowsExtensions": true
  }'
```

### List All Documents

```bash
# Get all metadata documents
curl "http://localhost:8080/api/v1/metadata?limit=20"
```

### Get Version History

```bash
# List all versions of a document
curl http://localhost:8080/api/v1/metadata/loyalty-program/spring-bonus/versions
```

### Publishing Workflow

```bash
# Draft → Approved
curl -X POST http://localhost:8080/api/v1/metadata/{type}/{name}/versions/{versionNumber}/publish \
  -H "Content-Type: application/json" \
  -u "admin:admin" \
  -d '{"state": "APPROVED"}'

# Approved → Published
curl -X POST http://localhost:8080/api/v1/metadata/{type}/{name}/versions/{versionNumber}/publish \
  -H "Content-Type: application/json" \
  -u "admin:admin" \
  -d '{"state": "PUBLISHED"}'

# Published → Archived
curl -X POST http://localhost:8080/api/v1/metadata/{type}/{name}/versions/{versionNumber}/publish \
  -H "Content-Type: application/json" \
  -u "admin:admin" \
  -d '{"state": "ARCHIVED"}'
```

## Running Tests

```bash
# Run all tests
mvn test

# Run integration tests only
mvn verify -DskipUnitTests

# Run with coverage
mvn clean verify jacoco:report
open target/site/jacoco/index.html
```

## Development Tips

### Hot Reload

Enable Spring Boot DevTools for automatic restart:

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-devtools</artifactId>
  <scope>runtime</scope>
</dependency>
```

### Database Console

Access H2 console in test profile:
```bash
# Run with test profile
mvn spring-boot:run -Dspring-boot.run.profiles=test

# Open http://localhost:8080/h2-console
```

### API Documentation

Access OpenAPI documentation:
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs

### Monitoring

Check application health and metrics:
```bash
# Health check
curl http://localhost:8080/actuator/health

# Metrics
curl http://localhost:8080/actuator/metrics

# Active versions cache stats
curl http://localhost:8080/actuator/metrics/cache.gets?tag=cache:activeVersions
```

### Sample Data

Load sample data for testing:
```bash
# Execute sample data script
psql -h localhost -U postgres -d metadata_versioning -f scripts/sample-data.sql
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9
```

### PostgreSQL Connection Failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs <container-id>

# Restart container
docker-compose restart postgres
```

### Redis Connection Failed

```bash
# Check Redis is running
docker exec -it <redis-container> redis-cli ping
# Should return PONG

# Restart Redis
docker-compose restart redis
```

### Build Failures

```bash
# Clean and rebuild
mvn clean install -U

# Skip tests temporarily
mvn clean install -DskipTests
```

## Next Steps

1. **Review Architecture** - Read [ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
2. **Explore API** - Check [contracts/openapi.yaml](contracts/openapi.yaml)
3. **Study Domain Model** - See [data-model.md](data-model.md)
4. **Read Research Decisions** - Review [research.md](research.md)
5. **Start Development** - Check [tasks.md](tasks.md) for implementation tasks

## Resources

- **OpenAPI Spec**: `specs/001-metadata-version-api/contracts/openapi.yaml`
- **Feature Spec**: `specs/001-metadata-version-api/spec.md`
- **Data Model**: `specs/001-metadata-version-api/data-model.md`
- **Research Decisions**: `specs/001-metadata-version-api/research.md`

## Getting Help

- **Issues**: Check existing issues or create new ones
- **Questions**: Use GitHub Discussions
- **Contributing**: See [CONTRIBUTING.md](../../CONTRIBUTING.md)
