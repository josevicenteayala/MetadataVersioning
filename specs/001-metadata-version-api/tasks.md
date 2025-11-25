# Tasks: Metadata Versioning Service

**Feature Branch**: `001-metadata-version-api`  
**Generated**: November 14, 2025  
**Input**: Design documents from `/specs/001-metadata-version-api/`

**Organization**: Tasks are grouped by user story from spec.md to enable independent implementation and testing.

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story this task belongs to (US1, US2, US3, US4, US5)
- File paths are absolute from repository root

## Dependencies Between User Stories

```
Phase 1: Setup (blocking all stories)
Phase 2: Foundational (blocking all stories)
  ↓
Phase 3: US1 - Create and Version Metadata (P1) ← MUST complete for MVP
  ↓
Phase 4: US2 - Activate and Consume Metadata (P1) ← MUST complete for MVP
  ↓
Phase 5: US3 - Compare Versions (P2) ← Independent from US4/US5
Phase 6: US4 - Manage Schema Definitions (P2) ← Independent from US3/US5
Phase 7: US5 - Track Publishing Lifecycle (P3) ← Independent from US3/US4
  ↓
Phase 8: Polish & Cross-Cutting Concerns
```

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 (US1) + Phase 4 (US2) = Minimum viable product

## Parallel Execution Opportunities

Within each phase, tasks marked `[P]` can execute in parallel:
- US1: T013-T016 (domain models)
- US2: T021-T024 (activation logic and queries)
- US3: T028-T030 (comparison algorithms)
- US4: T034-T037 (schema entities and validation)
- US5: T041-T043 (publishing state logic)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize Spring Boot 3.3 project with Java 21 in `pom.xml`
- [x] T002 Add dependencies: Spring Web, Spring Data JPA, PostgreSQL driver, Jackson, Hibernate Validator in `pom.xml`
- [x] T003 Add test dependencies: JUnit 5, TestContainers, REST Assured, ArchUnit in `pom.xml`
- [x] T004 Configure PostgreSQL datasource in `src/main/resources/application.yaml`
- [x] T005 Create Flyway migration V1__create_metadata_tables.sql with unique constraint on (type, name, version_number) in `src/main/resources/db/migration/`
- [x] T006 Create package structure: domain, application, adapter following plan.md in `src/main/java/com/metadata/versioning/`
- [x] T007 Configure Jackson for JSONB serialization in `src/main/java/com/metadata/versioning/adapter/out/config/JacksonConfig.java`
- [x] T008 Configure Spring Security for public read/authenticated write in `src/main/java/com/metadata/versioning/adapter/out/config/SecurityConfig.java`
- [x] T009 Create Docker Compose file with PostgreSQL 17 in `docker-compose.yml`
- [x] T010 Add OpenAPI/SpringDoc configuration in `src/main/java/com/metadata/versioning/adapter/out/config/OpenApiConfig.java`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure needed by all user stories

- [x] T011 [P] Create base exception hierarchy in `src/main/java/com/metadata/versioning/domain/exception/DomainException.java`
- [x] T012 [P] Create common validators for JSON structure in `src/main/java/com/metadata/versioning/domain/validator/JsonStructureValidator.java`

---

## Phase 3: User Story 1 - Create and Version Metadata Document (P1)

**Story Goal**: Enable business analysts to create metadata documents and view complete version history

**Independent Test**: Create document via POST /metadata, update it via POST /metadata/{type}/{name}/versions, retrieve history via GET /metadata/{type}/{name}/versions, verify immutability and audit trail

**Why P1**: Core value proposition - without this, platform has no purpose

### Domain Layer (US1)

- [x] T013 [P] [US1] Create MetadataDocument entity with invariants in `src/main/java/com/metadata/versioning/domain/model/MetadataDocument.java`
- [x] T014 [P] [US1] Create Version value object with immutability in `src/main/java/com/metadata/versioning/domain/model/Version.java`
- [x] T015 [P] [US1] Create VersionNotFoundException in `src/main/java/com/metadata/versioning/domain/exception/VersionNotFoundException.java`
- [x] T016 [P] [US1] Create DocumentAlreadyExistsException in `src/main/java/com/metadata/versioning/domain/exception/DocumentAlreadyExistsException.java`

### Application Layer (US1)

- [x] T017 [US1] Define CreateVersionUseCase port in `src/main/java/com/metadata/versioning/application/port/in/CreateVersionUseCase.java`
- [x] T018 [US1] Define GetVersionHistoryUseCase port in `src/main/java/com/metadata/versioning/application/port/in/GetVersionHistoryUseCase.java`
- [x] T019 [US1] Define MetadataDocumentRepository outbound port in `src/main/java/com/metadata/versioning/application/port/out/MetadataDocumentRepository.java`
- [x] T020 [US1] Implement VersionManagementService with create and history logic in `src/main/java/com/metadata/versioning/application/service/VersionManagementService.java`

### Adapter Layer (US1)

- [x] T021 [P] [US1] Create MetadataDocumentEntity JPA entity in `src/main/java/com/metadata/versioning/adapter/out/persistence/entity/MetadataDocumentEntity.java`
- [x] T022 [P] [US1] Create VersionEntity JPA entity with JSONB mapping in `src/main/java/com/metadata/versioning/adapter/out/persistence/entity/VersionEntity.java`
- [x] T023 [US1] Create JpaMetadataDocumentRepository Spring Data interface in `src/main/java/com/metadata/versioning/adapter/out/persistence/repository/JpaMetadataDocumentRepository.java`
- [x] T024 [US1] Implement MetadataDocumentPersistenceAdapter in `src/main/java/com/metadata/versioning/adapter/out/persistence/adapter/MetadataDocumentPersistenceAdapter.java`
- [x] T025 [US1] Create CreateMetadataRequest DTO using Java Record in `src/main/java/com/metadata/versioning/adapter/in/rest/dto/CreateMetadataRequest.java`
- [x] T026 [US1] Create VersionResponse DTO using Java Record in `src/main/java/com/metadata/versioning/adapter/in/rest/dto/VersionResponse.java`
- [x] T027 [US1] Create MetadataController with POST /metadata and GET /metadata/{type}/{name}/versions endpoints in `src/main/java/com/metadata/versioning/adapter/in/rest/MetadataController.java`

### Integration (US1)

- [x] T028 [US1] Write integration test for create metadata document in `src/test/java/com/metadata/versioning/adapter/in/rest/MetadataControllerTest.java`
- [x] T029 [US1] Write integration test for create new version in `src/test/java/com/metadata/versioning/adapter/in/rest/MetadataControllerTest.java`
- [x] T030 [US1] Write integration test for version history retrieval in `src/test/java/com/metadata/versioning/adapter/in/rest/MetadataControllerTest.java`
- [x] T031 [US1] Write E2E test for complete create-update-history workflow in `src/test/java/com/metadata/versioning/e2e/MetadataVersioningE2ETest.java`

---

## Phase 4: User Story 2 - Activate and Consume Metadata (P1)

**Story Goal**: Enable downstream systems to fetch active versions and business users to control activation

**Independent Test**: Create versions, activate specific version via POST /metadata/{type}/{name}/versions/{version}/activate, verify GET /metadata/{type}/{name}/active returns correct version

**Why P1**: Integration use case - makes metadata operationally consumable

**Depends On**: US1 (needs version creation)

### Domain Layer (US2)

- [ ] T032 [P] [US2] Add activate/deactivate methods to Version in `src/main/java/com/metadata/versioning/domain/model/Version.java`
- [ ] T033 [US2] Add activateVersion method to MetadataDocument with FR-023 enforcement (only published versions) in `src/main/java/com/metadata/versioning/domain/model/MetadataDocument.java` (depends on T072-T074 for PublishingState)
- [ ] T034 [P] [US2] Create InvalidActivationException in `src/main/java/com/metadata/versioning/domain/exception/InvalidActivationException.java`

### Application Layer (US2)

- [ ] T035 [US2] Define ActivateVersionUseCase port in `src/main/java/com/metadata/versioning/application/port/in/ActivateVersionUseCase.java`
- [ ] T036 [US2] Define GetActiveVersionUseCase port in `src/main/java/com/metadata/versioning/application/port/in/GetActiveVersionUseCase.java`
- [ ] T037 [US2] Implement activation logic in VersionManagementService in `src/main/java/com/metadata/versioning/application/service/VersionManagementService.java`
- [ ] T038 [US2] Implement MetadataQueryService for active version retrieval in `src/main/java/com/metadata/versioning/application/service/MetadataQueryService.java`
- [ ] T038a [US2] Implement ListMetadataDocumentsUseCase in MetadataQueryService (FR-015) in `src/main/java/com/metadata/versioning/application/service/MetadataQueryService.java`

### Adapter Layer (US2)

- [ ] T039 [P] [US2] Add activation query methods to JpaMetadataDocumentRepository in `src/main/java/com/metadata/versioning/adapter/out/persistence/repository/JpaMetadataDocumentRepository.java`
- [ ] T040 [US2] Create VersionController with activation endpoints in `src/main/java/com/metadata/versioning/adapter/in/rest/VersionController.java`
- [ ] T041 [US2] Add GET /metadata/{type}/{name}/active endpoint to MetadataController in `src/main/java/com/metadata/versioning/adapter/in/rest/MetadataController.java`
- [ ] T041a [US2] Add GET /metadata endpoint to list all documents with pagination (FR-015) in `src/main/java/com/metadata/versioning/adapter/in/rest/MetadataController.java`

### Integration (US2)

- [ ] T042 [US2] Write integration test for version activation in `src/test/java/com/metadata/versioning/adapter/in/rest/VersionControllerTest.java`
- [ ] T042a [US2] Write integration test for FR-023 enforcement (reject non-published activation) in `src/test/java/com/metadata/versioning/adapter/in/rest/VersionControllerTest.java`
- [ ] T043 [US2] Write integration test for active version retrieval in `src/test/java/com/metadata/versioning/adapter/in/rest/MetadataControllerTest.java`
- [ ] T043a [US2] Write integration test for listing metadata documents with pagination (FR-015) in `src/test/java/com/metadata/versioning/adapter/in/rest/MetadataControllerTest.java`
- [ ] T044 [US2] Write E2E test for activation workflow in `src/test/java/com/metadata/versioning/e2e/MetadataVersioningE2ETest.java`

---

## Phase 5: User Story 3 - Compare Versions Before Activation (P2)

**Story Goal**: Provide safety through diff visualization before promoting versions

**Independent Test**: Create two versions with known differences, request comparison via GET /metadata/{type}/{name}/compare?from=v1&to=v2, verify all changes identified

**Why P2**: Safety feature - reduces errors but not required for basic functionality

**Depends On**: US1 (needs version creation)

### Domain Layer (US3)

- [ ] T045 [P] [US3] Create VersionComparison value object in `src/main/java/com/metadata/versioning/domain/model/VersionComparison.java`
- [ ] T046 [P] [US3] Create ChangeType sealed class hierarchy in `src/main/java/com/metadata/versioning/domain/model/ChangeType.java`
- [ ] T047 [P] [US3] Create DiffEngine for JSON comparison in `src/main/java/com/metadata/versioning/domain/service/DiffEngine.java`

### Application Layer (US3)

- [ ] T048 [US3] Define CompareVersionsUseCase port in `src/main/java/com/metadata/versioning/application/port/in/CompareVersionsUseCase.java`
- [ ] T049 [US3] Implement VersionComparisonService using JSON Patch in `src/main/java/com/metadata/versioning/application/service/VersionComparisonService.java`

### Adapter Layer (US3)

- [ ] T050 [P] [US3] Create ComparisonResponse DTO using Java Record in `src/main/java/com/metadata/versioning/adapter/in/rest/dto/ComparisonResponse.java`
- [ ] T051 [US3] Add GET /metadata/{type}/{name}/compare endpoint to VersionController in `src/main/java/com/metadata/versioning/adapter/in/rest/VersionController.java`

### Integration (US3)

- [ ] T052 [US3] Write integration test for version comparison with field changes in `src/test/java/com/metadata/versioning/adapter/in/rest/VersionControllerTest.java`
- [ ] T053 [US3] Write integration test for identifying breaking vs additive changes in `src/test/java/com/metadata/versioning/adapter/in/rest/VersionControllerTest.java`
- [ ] T054 [US3] Write E2E test for comparison workflow in `src/test/java/com/metadata/versioning/e2e/MetadataVersioningE2ETest.java`

---

## Phase 6: User Story 4 - Manage Schema Definitions (P2)

**Story Goal**: Enable administrators to define schemas for validation and governance

**Independent Test**: Define schema with required fields, create metadata that validates, attempt invalid creation

**Why P2**: Governance feature - essential for scaling but basic functionality works without schemas

**Depends On**: US1 (needs version creation to validate against)

### Domain Layer (US4)

- [ ] T055 [P] [US4] Create SchemaDefinition entity in `src/main/java/com/metadata/versioning/domain/model/SchemaDefinition.java`
- [ ] T056 [P] [US4] Create SchemaValidator for JSON Schema validation in `src/main/java/com/metadata/versioning/domain/validator/SchemaValidator.java`
- [ ] T057 [P] [US4] Create SchemaViolationException in `src/main/java/com/metadata/versioning/domain/exception/SchemaViolationException.java`

### Application Layer (US4)

- [ ] T058 [US4] Define ManageSchemaUseCase port in `src/main/java/com/metadata/versioning/application/port/in/ManageSchemaUseCase.java`
- [ ] T059 [US4] Define SchemaDefinitionRepository outbound port in `src/main/java/com/metadata/versioning/application/port/out/SchemaDefinitionRepository.java`
- [ ] T060 [US4] Implement SchemaManagementService in `src/main/java/com/metadata/versioning/application/service/SchemaManagementService.java`
- [ ] T061 [US4] Integrate schema validation into VersionManagementService in `src/main/java/com/metadata/versioning/application/service/VersionManagementService.java`

### Adapter Layer (US4)

- [ ] T062 [P] [US4] Create Flyway migration V2__create_schema_tables.sql in `src/main/resources/db/migration/`
- [ ] T063 [P] [US4] Create SchemaDefinitionEntity JPA entity in `src/main/java/com/metadata/versioning/adapter/out/persistence/entity/SchemaDefinitionEntity.java`
- [ ] T064 [US4] Create JpaSchemaRepository Spring Data interface in `src/main/java/com/metadata/versioning/adapter/out/persistence/repository/JpaSchemaRepository.java`
- [ ] T065 [US4] Implement SchemaDefinitionPersistenceAdapter in `src/main/java/com/metadata/versioning/adapter/out/persistence/adapter/SchemaDefinitionPersistenceAdapter.java`
- [ ] T066 [US4] Create SchemaDefinitionRequest DTO using Java Record in `src/main/java/com/metadata/versioning/adapter/in/rest/dto/SchemaDefinitionRequest.java`
- [ ] T067 [US4] Create SchemaController with POST /schemas and PUT /schemas/{type} endpoints in `src/main/java/com/metadata/versioning/adapter/in/rest/SchemaController.java`

### Integration (US4)

- [ ] T068 [US4] Write integration test for schema definition creation in `src/test/java/com/metadata/versioning/adapter/in/rest/SchemaControllerTest.java`
- [ ] T069 [US4] Write integration test for schema validation on version creation in `src/test/java/com/metadata/versioning/adapter/in/rest/MetadataControllerTest.java`
- [ ] T070 [US4] Write integration test for schema update with compliance warnings in `src/test/java/com/metadata/versioning/adapter/in/rest/SchemaControllerTest.java`
- [ ] T071 [US4] Write E2E test for schema management workflow in `src/test/java/com/metadata/versioning/e2e/SchemaManagementE2ETest.java`

---

## Phase 7: User Story 5 - Track Publishing Lifecycle (P3)

**Story Goal**: Add workflow governance with publishing states (draft → approved → published → archived)

**Independent Test**: Create version in draft, transition to approved, publish, verify state transitions and activation rules

**Why P3**: Enterprise workflow feature - basic functionality works without states

**Depends On**: US2 (needs activation logic to enforce publishing rules)

### Domain Layer (US5)

- [ ] T072 [P] [US5] Create PublishingState sealed class with allowed transitions in `src/main/java/com/metadata/versioning/domain/model/PublishingState.java`
- [ ] T073 [P] [US5] Create InvalidStateTransitionException in `src/main/java/com/metadata/versioning/domain/exception/InvalidStateTransitionException.java`
- [ ] T074 [US5] Add publishing state and transition methods to Version in `src/main/java/com/metadata/versioning/domain/model/Version.java`
- [ ] T075 [US5] Enforce published state requirement in activation logic in `src/main/java/com/metadata/versioning/domain/model/MetadataDocument.java`

### Application Layer (US5)

- [ ] T076 [US5] Add state transition methods to VersionManagementService in `src/main/java/com/metadata/versioning/application/service/VersionManagementService.java`

### Adapter Layer (US5)

- [ ] T077 [P] [US5] Add publishing_state column to versions table via migration in `src/main/resources/db/migration/V4__add_publishing_state.sql`
- [ ] T078 [US5] Add state transition endpoints to VersionController in `src/main/java/com/metadata/versioning/adapter/in/rest/VersionController.java`
- [ ] T079 [US5] Add state filtering to version list queries in `src/main/java/com/metadata/versioning/adapter/in/rest/MetadataController.java`

### Integration (US5)

- [ ] T080 [US5] Write integration test for state transitions in `src/test/java/com/metadata/versioning/adapter/in/rest/VersionControllerTest.java`
- [ ] T081 [US5] Write integration test for activation of non-published version rejection in `src/test/java/com/metadata/versioning/adapter/in/rest/VersionControllerTest.java`
- [ ] T082 [US5] Write E2E test for publishing workflow in `src/test/java/com/metadata/versioning/e2e/MetadataVersioningE2ETest.java`

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Performance, observability, security, and documentation

- [ ] T083 [P] Create Flyway migration V3__create_audit_tables.sql for audit trail in `src/main/resources/db/migration/`
- [ ] T084 [P] Create AuditEntryEntity JPA entity in `src/main/java/com/metadata/versioning/adapter/out/persistence/entity/AuditEntryEntity.java`
- [ ] T085 [P] Implement AuditPersistenceAdapter with async logging in `src/main/java/com/metadata/versioning/adapter/out/persistence/adapter/AuditPersistenceAdapter.java`
- [ ] T086 [P] Add GIN indexes for JSONB queries in migration in `src/main/resources/db/migration/V5__add_performance_indexes.sql`
- [ ] T087 [P] Configure correlation ID filter for request tracing in `src/main/java/com/metadata/versioning/adapter/in/rest/filter/CorrelationIdFilter.java`
- [ ] T088 [P] Configure Micrometer metrics for use case timing in `src/main/java/com/metadata/versioning/adapter/out/config/MetricsConfig.java`
- [ ] T089 [P] Add Spring Boot Actuator health checks in `src/main/resources/application.yaml`
- [ ] T090 Write ArchUnit test to enforce hexagonal boundaries in `src/test/java/com/metadata/versioning/architecture/HexagonalArchitectureTest.java`
- [ ] T091 Write performance test for version creation (<500ms) in `src/test/java/com/metadata/versioning/performance/VersionCreationPerformanceTest.java`
- [ ] T092 Write performance test for active version retrieval (<200ms) in `src/test/java/com/metadata/versioning/performance/ActiveVersionQueryPerformanceTest.java`
- [ ] T093 Write performance test for version comparison (<3s) in `src/test/java/com/metadata/versioning/performance/VersionComparisonPerformanceTest.java`
- [ ] T093a Write concurrency test for 50 concurrent requests (SC-005) in `src/test/java/com/metadata/versioning/performance/ConcurrencyPerformanceTest.java`
- [ ] T094 Add custom error responses with field paths in `src/main/java/com/metadata/versioning/adapter/in/rest/exception/GlobalExceptionHandler.java`
- [ ] T095 Update OpenAPI specification with all endpoints in `specs/001-metadata-version-api/contracts/openapi.yaml`
- [ ] T096 Add API examples to OpenAPI spec in `specs/001-metadata-version-api/contracts/openapi.yaml`
- [ ] T097 Create README with quickstart instructions in `README.md`

---

## Summary

**Total Tasks**: 102

**Task Count by User Story**:
- Setup: 10 tasks
- Foundational: 2 tasks
- US1 (Create and Version): 19 tasks (including 4 tests)
- US2 (Activate and Consume): 17 tasks (including 5 tests) - added T038a, T041a, T042a, T043a
- US3 (Compare Versions): 10 tasks (including 3 tests)
- US4 (Manage Schemas): 17 tasks (including 4 tests)
- US5 (Publishing Lifecycle): 11 tasks (including 3 tests)
- Polish: 16 tasks (added T093a)

**Parallel Opportunities**: 32 tasks marked [P] can execute in parallel within their phase

**MVP Scope**: Setup (T001-T010) + Foundational (T011-T012) + US1 (T013-T031) + US2 (T032-T044, T038a, T041a, T042a, T043a) = 48 tasks

**Note on Dependencies**: T033 (activation logic) has a soft dependency on T072-T074 (PublishingState) to enforce FR-023. Consider implementing basic activation first, then add publishing state enforcement when US5 is implemented.

**Independent Test Criteria**:
- **US1**: Can create documents, make updates, retrieve history independently
- **US2**: Can activate versions and query active state independently after US1
- **US3**: Can compare versions independently after US1
- **US4**: Can define schemas and validate independently after US1
- **US5**: Can manage publishing states independently after US2

**Implementation Strategy**: 
1. Complete Setup + Foundational (enables all development)
2. Implement US1 + US2 for MVP (core CRUD + activation)
3. Deliver US3, US4, US5 incrementally based on customer priority
4. Add Polish features as capacity allows

**Format Validation**: ✅ All tasks follow required checklist format with Task ID, [P] marker where applicable, [Story] label for user story tasks, and file paths
