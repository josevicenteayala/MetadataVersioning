# Implementation Plan: Metadata Versioning Service

**Branch**: `001-metadata-version-api` | **Date**: November 14, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-metadata-version-api/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a RESTful API service that provides comprehensive metadata management with version control capabilities. The system enables business users to create, version, activate, and manage JSON-based metadata documents (loyalty programs, campaigns, offers) with full audit trails. Each save operation creates an immutable version, supporting schema validation, publishing workflows, and version comparison. The service uses hexagonal architecture with Java 21, Spring Boot 3.3+, and PostgreSQL 17+ for JSONB storage.

## Technical Context

**Language/Version**: Java 21  
**Primary Dependencies**: Spring Boot 3.3+, Spring Data JPA, Spring Web, Jackson, Hibernate Validator  
**Storage**: PostgreSQL 17+ with JSONB support for flexible JSON document storage  
**Testing**: JUnit 5, Spring Boot Test, TestContainers (PostgreSQL), ArchUnit, REST Assured  
**Target Platform**: Linux server (containerized deployment)  
**Project Type**: Web application (REST API backend + future frontend)  
**Performance Goals**: 
- CRUD operations <500ms at p95
- Version comparison <3 seconds at p95
- History list <1 second at p95
- Schema validation <200ms at p95
- Support 50 concurrent API requests
- Handle up to 500 metadata documents per type  
**Constraints**: 
- JSON documents up to 1MB
- Public read access (no auth), authenticated write operations
- One active version per (type, name) at any time
- Immutable versions after creation  
**Scale/Scope**: 
- Up to 500 metadata documents per type
- Up to 100 versions per document
- Multi-tenant support for future expansion

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality & Architecture ✅

- [x] **Hexagonal Architecture**: Domain layer will contain MetadataDocument, Version, SchemaDefinition entities with invariants. Application layer will expose use-case ports (CreateVersion, ActivateVersion, CompareVersions). Adapters include REST controllers (inbound) and JPA repositories (outbound).
- [x] **SOLID Principles**: Each use case is a single-purpose class. Domain entities enforce invariants. Interfaces define contracts between layers.
- [x] **Type Safety**: Leverage Java 21 Records for immutable DTOs, Sealed Classes for publishing state enums, Pattern Matching for version state validation.

**Status**: PASS - Architecture design aligns with hexagonal principles.

### II. Testing Standards (NON-NEGOTIABLE) ✅

- [x] **TDD Required**: Will write tests first for all use cases following Red-Green-Refactor.
- [x] **Coverage Thresholds**: Target 95%+ domain, 90%+ application, 80%+ adapters, 85%+ overall.
- [x] **Test Pyramid**: Focus on unit tests (domain logic), integration tests (JPA repositories), E2E tests (REST endpoints).
- [x] **Test Types**: 
  - ArchUnit tests to enforce layer boundaries
  - TestContainers for PostgreSQL integration tests
  - REST Assured for API contract tests
  - Performance tests for response time targets

**Status**: PASS - Test strategy comprehensive and follows constitution requirements.

### III. User Experience Consistency ✅

- [x] **Dual Interfaces**: Phase 1 delivers REST API with full feature parity. Web UI planned for Phase 2 (separate epic).
- [x] **Clear Validation Feedback**: Schema violations will include field path, constraint, and examples. HTTP status codes follow REST conventions.
- [x] **Diff Visualization**: Version comparison returns structured JSON showing added/removed fields, value changes, and breaking vs additive changes.
- [x] **Consistent Terminology**: Using "type" and "name" (not topic), "version" (not revision), "active" (not published for activation state).

**Status**: PASS - API-first approach with clear contracts. UI deferred to future phase.

### IV. Performance Requirements ✅

- [x] **Response Time Targets**: All targets specified in Technical Context align with constitution (<500ms CRUD, <3s comparison, <1s history).
- [x] **Scalability**: Stateless Spring Boot services support horizontal scaling. HikariCP for connection pooling. Caching strategy for schemas.
- [x] **Resource Efficiency**: JSONB with GIN indexes. Prepared statements via JPA. Cursor-based pagination for lists.
- [x] **Observability**: Structured logging with correlation IDs. Micrometer for metrics. Spring Boot Actuator for health checks.

**Status**: PASS - Performance targets and observability requirements clearly defined.

### Quality Gates Summary

| Gate | Status | Notes |
|------|--------|-------|
| Code Review | ✅ READY | Will verify hexagonal boundaries and test coverage |
| Testing | ✅ READY | TDD process with comprehensive coverage targets |
| Performance | ✅ READY | Automated tests for response time targets |
| Security | ✅ READY | Public read/authenticated write model; audit trail for all mutations |

**Overall Gate Status**: ✅ **PASS** - All constitution principles satisfied. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-metadata-version-api/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── openapi.yaml     # OpenAPI 3.1 specification
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── main/
│   ├── java/
│   │   └── com/
│   │       └── metadata/
│   │           └── versioning/
│   │               ├── domain/                 # Pure business logic (no framework deps)
│   │               │   ├── model/
│   │               │   │   ├── MetadataDocument.java
│   │               │   │   ├── Version.java
│   │               │   │   ├── SchemaDefinition.java
│   │               │   │   ├── PublishingState.java (sealed class)
│   │               │   │   └── VersionComparison.java
│   │               │   ├── exception/
│   │               │   │   ├── DomainException.java
│   │               │   │   ├── VersionNotFoundException.java
│   │               │   │   ├── SchemaViolationException.java
│   │               │   │   └── InvalidStateTransitionException.java
│   │               │   └── validator/
│   │               │       ├── SchemaValidator.java
│   │               │       └── JsonStructureValidator.java
│   │               ├── application/            # Use case orchestration (ports)
│   │               │   ├── port/
│   │               │   │   ├── in/            # Inbound ports (use cases)
│   │               │   │   │   ├── CreateVersionUseCase.java
│   │               │   │   │   ├── ActivateVersionUseCase.java
│   │               │   │   │   ├── GetActiveVersionUseCase.java
│   │               │   │   │   ├── GetVersionHistoryUseCase.java
│   │               │   │   │   ├── CompareVersionsUseCase.java
│   │               │   │   │   ├── ManageSchemaUseCase.java
│   │               │   │   │   └── ListMetadataDocumentsUseCase.java
│   │               │   │   └── out/           # Outbound ports (repository interfaces)
│   │               │   │       ├── MetadataDocumentRepository.java
│   │               │   │       ├── VersionRepository.java
│   │               │   │       ├── SchemaDefinitionRepository.java
│   │               │   │       └── AuditRepository.java
│   │               │   └── service/           # Use case implementations
│   │               │       ├── VersionManagementService.java
│   │               │       ├── SchemaManagementService.java
│   │               │       ├── VersionComparisonService.java
│   │               │       └── MetadataQueryService.java
│   │               └── adapter/               # Infrastructure implementation
│   │                   ├── in/
│   │                   │   └── rest/          # REST controllers
│   │                   │       ├── MetadataController.java
│   │                   │       ├── VersionController.java
│   │                   │       ├── SchemaController.java
│   │                   │       ├── dto/       # Request/Response DTOs (Records)
│   │                   │       │   ├── CreateMetadataRequest.java
│   │                   │       │   ├── ActivateVersionRequest.java
│   │                   │       │   ├── VersionResponse.java
│   │                   │       │   ├── ComparisonResponse.java
│   │                   │       │   └── SchemaDefinitionRequest.java
│   │                   │       └── mapper/    # DTO ↔ Domain mappers
│   │                   │           └── VersionMapper.java
│   │                   └── out/
│   │                       ├── persistence/   # JPA implementation
│   │                       │   ├── entity/    # JPA entities
│   │                       │   │   ├── MetadataDocumentEntity.java
│   │                       │   │   ├── VersionEntity.java
│   │                       │   │   ├── SchemaDefinitionEntity.java
│   │                       │   │   └── AuditEntryEntity.java
│   │                       │   ├── repository/ # Spring Data JPA repos
│   │                       │   │   ├── JpaMetadataDocumentRepository.java
│   │                       │   │   ├── JpaVersionRepository.java
│   │                       │   │   ├── JpaSchemaRepository.java
│   │                       │   │   └── JpaAuditRepository.java
│   │                       │   └── adapter/   # Port implementation
│   │                       │       ├── MetadataDocumentPersistenceAdapter.java
│   │                       │       ├── VersionPersistenceAdapter.java
│   │                       │       ├── SchemaDefinitionPersistenceAdapter.java
│   │                       │       └── AuditPersistenceAdapter.java
│   │                       └── config/        # Spring configuration
│   │                           ├── SecurityConfig.java
│   │                           ├── JacksonConfig.java
│   │                           ├── DataSourceConfig.java
│   │                           └── OpenApiConfig.java
│   └── resources/
│       ├── application.yaml
│       ├── application-dev.yaml
│       ├── application-prod.yaml
│       └── db/
│           └── migration/                      # Flyway migrations
│               ├── V1__create_metadata_tables.sql
│               ├── V2__create_schema_tables.sql
│               └── V3__create_audit_tables.sql
└── test/
    ├── java/
    │   └── com/
    │       └── metadata/
    │           └── versioning/
    │               ├── domain/                 # Domain unit tests
    │               │   ├── model/
    │               │   └── validator/
    │               ├── application/            # Use case tests
    │               │   └── service/
    │               ├── adapter/
    │               │   ├── in/
    │               │   │   └── rest/          # REST API integration tests
    │               │   └── out/
    │               │       └── persistence/   # Repository integration tests
    │               ├── architecture/           # ArchUnit tests
    │               │   └── HexagonalArchitectureTest.java
    │               └── e2e/                    # End-to-end tests
    │                   ├── MetadataVersioningE2ETest.java
    │                   └── SchemaManagementE2ETest.java
    └── resources/
        ├── application-test.yaml
        └── test-data/
            ├── sample-metadata.json
            └── sample-schema.json
```

**Structure Decision**: Selected **Web application (REST API backend)** structure with hexagonal architecture layering. The structure strictly enforces dependency rules: domain has no dependencies, application depends only on domain, and adapters depend on application/domain. This enables:
- Complete isolation of business logic from infrastructure
- Framework independence (Spring only in adapter layer)
- Testability without mocking infrastructure
- Future addition of frontend or CLI adapters without touching core logic

**Key Architectural Boundaries**:
- **domain**: Pure Java, no Spring/JPA annotations
- **application**: Defines ports (interfaces), no implementation details
- **adapter.in.rest**: Spring Web controllers implementing inbound ports
- **adapter.out.persistence**: Spring Data JPA implementing outbound ports

## Complexity Tracking

**No violations** - Constitution Check passed all gates. No complexity justifications required.
