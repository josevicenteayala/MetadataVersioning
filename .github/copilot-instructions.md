# JsonVersionManager - AI Agent Instructions

## Project Overview

JsonVersionManager is a **versioned metadata management platform** enabling business users to create/evolve JSON metadata for loyalty programs, retail campaigns, offers, and coupons. Every change creates an immutable version with full audit history and side-by-side diff comparison.

**Dual Audience**: REST API for developers + guided UI for non-technical business users.

## Architecture: Hexagonal (Ports & Adapters)

**Critical**: Domain layer MUST remain technology-agnostic. Enforce via ArchUnit tests.

```
Domain Layer (core business logic)
├── entities: Topic, MetadataDocument, Version (value objects, invariants)
├── services: ValidationOrchestrator, VersioningService, DiffEngine
└── ports: Repository interfaces, SchemaProvider, NotificationPort

Application Layer (use cases)
├── CreateDocument, UpdateDocument, CompareVersions, ListHistory
└── Exposes ports, coordinates domain services, orchestrates transactions

Adapters (inbound: REST/GraphQL/CLI | outbound: PostgreSQL/Redis/Auth)
├── REST controllers: Map HTTP → use cases, handle errors, return DTOs
├── Persistence: Spring Data JPA with JSONB columns, TestContainers for tests
├── Schema registry: Centralized JSON Schema store with versioning
└── Authentication: Spring Security OAuth2 with JWT
```

**Rule**: Domain/Application layers NEVER import Spring, JPA, or infrastructure. Use dependency injection.

## Technology Stack

**Backend**: Java 21 + Spring Boot 3.3 (virtual threads, Records, Sealed Classes, Pattern Matching)  
**Frontend**: React 18 + TypeScript 5 (strict mode) + Vite  
**Database**: PostgreSQL 15+ with JSONB + GIN indexes  
**Testing**: JUnit 5, Mockito, TestContainers, RestAssured, ArchUnit  
**Validation**: JSON Schema Validator (everit-json-schema or networknt)

## Mandatory Development Practices

### 1. Test-Driven Development (NON-NEGOTIABLE)

**Workflow**: Write failing test → Get approval → Implement minimal code → Refactor

```java
// Example: TDD for document creation
@Test
void shouldCreateDocumentWithSchemaValidation() {
    // Given: Valid loyalty offer JSON matching schema
    var document = new MetadataDocument(topicId, validJson);
    
    // When: Creating document
    var version = createDocumentUseCase.execute(document);
    
    // Then: Version 1 created with metadata
    assertThat(version.getVersionNumber()).isEqualTo(1);
    assertThat(version.getState()).isEqualTo(DRAFT);
}
```

**Coverage Requirements** (enforced in CI):
- Domain: 95%+ | Application: 90%+ | Adapters: 80%+ | Overall: 85%+

**Test Pyramid**: 70% unit, 20% integration, 10% E2E

### 2. Type Safety & Immutability

**Java**: Use Record classes for DTOs, Sealed Classes for domain modeling
```java
// Immutable DTO with Java 21 Record
public record DocumentDTO(
    UUID id,
    String topicId,
    JsonNode content,
    VersionMetadata version
) {}

// Sealed class for state modeling
public sealed interface PublishingState 
    permits Draft, Approved, Published, Archived {}
```

**TypeScript**: Enable `strict: true`, no implicit `any`
```typescript
// Type-safe API client response
interface DocumentResponse {
  readonly id: string;
  readonly topicId: string;
  readonly content: JsonValue;
  readonly version: VersionMetadata;
}
```

### 3. Validation Feedback (API & UI Consistency)

**API Errors** MUST include:
- Field path (JSONPath format)
- Constraint violated
- Example of valid value

```json
{
  "status": 400,
  "errors": [
    {
      "field": "$.offer.discountValue",
      "constraint": "must be between 0 and 100",
      "providedValue": 150,
      "exampleValidValue": 25
    }
  ]
}
```

**UI**: Inline validation with contextual tooltips mirroring API error structure.

### 4. API Endpoint Conventions

**Base URL**: `/api/v1`  
**Pattern**: `/topics/{topicId}/documents` (collection), `/documents/{id}` (resource)

```
POST   /api/v1/topics/{topicId}/documents          # Create
GET    /api/v1/documents/{id}                       # Get current
GET    /api/v1/documents/{id}/versions/{version}   # Get specific version
PUT    /api/v1/documents/{id}                       # Update (creates new version)
GET    /api/v1/documents/{id}/versions              # List versions (paginated)
GET    /api/v1/documents/{id}/compare?from=v1&to=v2 # Diff versions
```

**Always**: Cursor-based pagination, HATEOAS links, ETag for caching.

## Critical Terminology (Enforce Consistency)

| ✅ Use This | ❌ Never Use |
|------------|-------------|
| Topic | Category, Type, Domain |
| Version | Revision, Snapshot, Iteration |
| Custom properties | Extensions, Attributes, Metadata |
| Publish | Activate, Deploy, Promote |

## Performance Targets (p95)

- CRUD operations: <500ms
- Diff generation: <3s
- History listing: <1s
- Schema validation: <200ms

**Optimization**: HikariCP pooling, Redis for schema caching, JSONB GIN indexes on `topic_id`, `version_number`, `created_at`.

## Development Workflow

**Branch Naming**: `feature/{issue-number}-{brief-description}` (e.g., `feature/123-diff-api`)

**Build**: `./mvnw clean install` (backend), `npm run build` (frontend)  
**Tests**: `./mvnw test` (unit+integration), `npm test` (frontend)  
**Local DB**: Docker Compose with PostgreSQL 15 + Redis

**Code Review Gates**:
1. All tests pass (including ArchUnit boundaries)
2. Coverage meets thresholds (JaCoCo report)
3. No Checkstyle violations
4. SpringDoc OpenAPI spec updated

## Special Project Patterns

### Version Immutability

**Once created, versions are NEVER modified**. Updates create new versions. Implement using:
- Database: `version_id` as immutable UUID, `version_number` auto-incremented
- Domain: `Version` entity with no setters, only constructor
- Audit: Separate `audit_log` table tracks all operations

### Schema Evolution with Custom Properties

**Base schema** defines required/optional fields. **Custom properties** stored in same JSONB column but validated separately:
```java
// Custom property validation rules
- Naming: alphanumeric + underscore, max 50 chars
- Depth: max 3 levels nested
- Types: string, number, boolean, object, array (no functions)
```

### Diff Algorithm (Structural vs. Value Changes)

```java
public sealed interface ChangeType 
    permits FieldAdded, FieldRemoved, ValueChanged, StructuralChange {}

// Breaking change: Required field removed
// Additive change: Optional field added or value modified
```

## Quick Reference Files

- **Constitution**: `.specify/memory/constitution.md` (principles, quality gates)
- **Architecture**: `docs/ARCHITECTURE.md` (layer responsibilities, tech decisions)
- **API Reference**: `docs/API_REFERENCE.md` (endpoint specs, examples)
- **Roadmap**: `docs/PRODUCT_ROADMAP.md` (MVP scope, feature priorities)
- **Agent Specs**: `.github/agents/*.agent.md` (role definitions for multi-agent collaboration)

## When Making Changes

1. **Check Constitution First**: `.specify/memory/constitution.md` defines non-negotiable principles
2. **Write Tests Before Code**: TDD is mandatory, not optional
3. **Verify Hexagonal Boundaries**: Use ArchUnit to prevent domain layer contamination
4. **Update OpenAPI Spec**: SpringDoc annotations on all REST controllers
5. **Dual Interface Parity**: If adding feature, implement in both API and UI

## Common Pitfalls to Avoid

❌ Domain entities importing Spring annotations  
❌ Mocking database in integration tests (use TestContainers)  
❌ Skipping test coverage because "it's simple code"  
❌ Using different terminology than documented (e.g., "revision" instead of "version")  
❌ Forgetting to update OpenAPI spec after endpoint changes  
❌ Implementing UI feature without corresponding REST API endpoint

## Questions to Ask Before Implementing

1. Does this maintain hexagonal architecture boundaries?
2. Are there TDD tests demonstrating the requirement?
3. Does validation feedback include field path + example?
4. Is terminology consistent with project glossary?
5. Will this work in both API and UI interfaces?
6. Does it meet performance targets (<500ms for CRUD)?
