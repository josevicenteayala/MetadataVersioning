# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JsonVersionManager is a Spring Boot 3.3 application that provides metadata versioning capabilities with REST APIs. It manages JSON metadata documents with automatic version control, allowing only one active version per (type, name) combination.

## Technology Stack

- **Backend**: Java 21, Spring Boot 3.3.5, Spring Data JPA
- **Database**: PostgreSQL 15+ with JSONB support
- **Build**: Gradle 8+ with Java 21 toolchain
- **Migration**: Flyway for database migrations
- **API Docs**: SpringDoc OpenAPI (Swagger)
- **Container**: Docker Compose for PostgreSQL

## Development Commands

### Building and Running
```bash
# Build the project
./gradlew build

# Run the application
./gradlew bootRun

# Run tests
./gradlew test

# Clean build
./gradlew clean build
```

### Database Setup
```bash
# Start PostgreSQL with Docker
docker-compose up -d

# Stop PostgreSQL
docker-compose down
```

### API Documentation
- Swagger UI: http://localhost:8081/swagger-ui.html
- OpenAPI spec: http://localhost:8081/api-docs

## Code Architecture

The application follows Spring Boot patterns with clear separation of concerns:

### Package Structure
```
com.starbucks.metadata/
├── controller/          # REST controllers
├── service/            # Business logic layer
├── repository/         # Data access layer
├── entity/             # JPA entities
├── dto/               # Data transfer objects
├── exception/         # Custom exceptions and handlers
└── config/           # Configuration classes
```

### Key Components

- **MetadataController**: REST API endpoints for CRUD operations
- **MetadataService**: Business logic for versioning and activation
- **MetadataRepository**: JPA repository for database operations
- **MetadataEntry**: JPA entity with JSONB content field
- **GlobalExceptionHandler**: Centralized error handling

### Core Versioning Logic
- New metadata starts at version 1 and is automatically active
- Creating new versions increments version number and sets inactive
- Only one version can be active per (type, name) combination
- Activation deactivates all other versions of the same metadata

## Database Configuration

### Connection Details
- **URL**: jdbc:postgresql://localhost:5433/metadata_db
- **User**: postgres
- **Password**: postgres
- **Port**: 5433 (to avoid conflicts with local PostgreSQL)

### Key Tables
- **metadata_entry**: Main table with UUID id, type, name, JSONB content, version, is_active flags
- **Unique constraint**: (type, name, version)
- **Index**: (type, name, is_active) for efficient active version lookups

### Migration Files
Located in `src/main/resources/db/migration/` and managed by Flyway.

## Development Patterns

### Error Handling
- Custom exceptions extend RuntimeException
- GlobalExceptionHandler provides consistent error responses
- Standard HTTP status codes (409 for conflicts, 404 for not found)

### Validation
- Bean validation with `@Valid` annotations
- JSON content validated as valid JSON structure
- Business rule validation in service layer

### Logging
- SLF4J with Logback
- DEBUG level for application package
- SQL logging enabled for development

### Testing
- JUnit 5 for unit tests
- Spring Boot Test for integration tests
- Use TestContainers for database integration tests

## API Endpoints

### Core Operations
- `POST /metadata` - Create new metadata (version 1, active)
- `POST /metadata/{type}/{name}/versions` - Create new version (inactive)
- `POST /metadata/{type}/{name}/versions/{version}/activate` - Activate version
- `GET /metadata/{type}/{name}/versions` - List all versions
- `GET /metadata/{id}` - Get specific version by ID
- `GET /metadata` - List with filters and pagination
- `DELETE /metadata/{id}` - Delete version (not active ones)

### Response Format
All responses use DTOs with consistent structure including id, type, name, json content, version, isActive, and timestamps.

## Important Notes

### Version Management
- Version numbers are auto-incremented and immutable
- Cannot delete active versions (returns 409 Conflict)
- Activation is atomic - deactivates others in same transaction

### JSON Handling
- Uses PostgreSQL JSONB for efficient JSON storage and querying
- Jackson configuration includes non_null inclusion and proper date handling
- No schema validation - accepts any valid JSON structure

### Development Database
- Uses port 5433 to avoid conflicts
- Docker Compose provides PostgreSQL 15-alpine
- Database is created automatically on first run

## Configuration

### Application Properties
- Server runs on port 8081
- JPA validation mode (ddl-auto: validate)
- Flyway baseline on migrate enabled
- Connection pool configured with HikariCP

### Profiles
Currently uses single configuration. Add profile-specific application-{profile}.yml files for different environments.