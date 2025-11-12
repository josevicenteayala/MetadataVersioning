# JsonVersionManager - Architecture

## Overview

JsonVersionManager follows **Hexagonal Architecture** (Ports & Adapters) to keep the core domain independent from delivery technology. This architectural style ensures that business logic remains testable, maintainable, and adaptable to changing infrastructure requirements.

## Architecture Layers

### Domain Layer (Core)

The heart of the application containing pure business logic with no infrastructure dependencies.

#### Entities
- **`Topic`**: Represents a logical domain area (loyalty, retail, offers, coupons)
  - Properties: topicId, name, schemaVersion, baseSchema, metadata
  - Invariants: Topic names must be unique, schemas must be valid JSON Schema
  
- **`MetadataDocument`**: Represents a configuration document for a specific topic
  - Properties: documentId, topicId, currentVersion, createdAt, createdBy
  - Invariants: Must belong to a valid topic, must have at least one version
  
- **`Version`**: Immutable snapshot of a document at a point in time
  - Properties: versionId, versionNumber, content (JSON), timestamp, author, state, diffSummary
  - Invariants: Version numbers are sequential, content is immutable after creation

#### Value Objects
- **`CustomAttribute`**: User-defined field with name, value, and type
- **`DiffResult`**: Comparison output showing additions, removals, and modifications
- **`ValidationResult`**: Outcome of schema and business rule validation
- **`PublishingState`**: Enum (DRAFT, APPROVED, PUBLISHED, ARCHIVED)

#### Domain Services
- **`VersioningService`**: Orchestrates version creation, numbering, and lineage
- **`ValidationOrchestrator`**: Coordinates schema validation and custom rule checks
- **`DiffEngine`**: Computes structural and value differences between versions
- **`SchemaValidator`**: Applies JSON Schema validation to documents

### Application Layer (Use Cases)

Services that implement business workflows by orchestrating domain entities and external dependencies through ports.

#### Core Use Cases
- **`CreateDocument`**: Initialize a new metadata document for a topic
  - Input: topicId, initialContent, author
  - Output: documentId, versionId
  - Validation: Topic exists, content matches schema, author has permission

- **`UpdateDocument`**: Create a new version of an existing document
  - Input: documentId, updatedContent, author, comment
  - Output: new versionId
  - Validation: Document exists, content valid, no concurrent modification conflicts

- **`CompareVersions`**: Generate diff between two versions
  - Input: documentId, fromVersion, toVersion
  - Output: DiffResult with categorized changes
  - Processing: Structural diff, value diff, breaking change detection

- **`ListHistory`**: Retrieve version timeline for a document
  - Input: documentId, pagination params
  - Output: List of version summaries with metadata
  - Optimization: Index by timestamp, cache recent history

- **`PublishVersion`**: Promote a version to published state
  - Input: versionId, approver
  - Output: Updated version state
  - Validation: Version is approved, approver has permission

- **`RollbackVersion`**: Revert to a previous version
  - Input: documentId, targetVersionNumber
  - Output: New version with content from target
  - Processing: Create new version (not true rollback) to preserve history

#### Ports (Interfaces)

**Inbound Ports** (Driving)
- `DocumentCommandHandler`: Interface for document modifications
- `DocumentQueryHandler`: Interface for document retrieval
- `VersionComparator`: Interface for version comparison operations

**Outbound Ports** (Driven)
- `DocumentRepository`: Persistence operations for documents and versions
- `SchemaProvider`: Retrieval of topic schemas
- `NotificationService`: Alerting on document changes
- `SearchIndexer`: Full-text search capabilities
- `AuditLogger`: Recording of user actions
- `AuthorizationService`: Permission checks

### Adapter Layer

Implementations of ports that connect the core to external systems.

#### Inbound Adapters (Driving)
- **REST Controllers**: HTTP API endpoints
  - Technology: Spring Boot / Express / ASP.NET / FastAPI (TBD)
  - Responsibilities: Request mapping, DTO transformation, error handling
  
- **CLI Tools**: Command-line interface for power users
  - Technology: Click / Cobra / Commander (TBD)
  - Use cases: Bulk operations, CI/CD integration, admin tasks

- **GraphQL Gateway** (Future)
  - Technology: Apollo Server / Hot Chocolate (TBD)
  - Benefits: Flexible queries, reduced over-fetching

- **Background Jobs**: Scheduled tasks and async processing
  - Technology: Quartz / Celery / Hangfire (TBD)
  - Use cases: Archive old versions, sync to search index, generate reports

#### Outbound Adapters (Driven)

**Persistence Adapters**
- **SQL Repository**: PostgreSQL with JSONB columns
  - Tables: topics, documents, versions, audit_log
  - Indexes: documentId, topicId, timestamp, state
  - Benefits: ACID transactions, rich querying on JSONB

- **NoSQL Repository** (Alternative): MongoDB / DynamoDB
  - Collections: documents with embedded versions
  - Benefits: Natural JSON storage, horizontal scaling

**Schema Registry Adapter**
- Centralized store for topic schemas
- Version-controlled schema evolution
- Implementation: Schema Registry / Consul / Database

**Search Index Adapter**
- Full-text search across document content
- Technology: Elasticsearch / OpenSearch / Algolia (TBD)
- Indexed fields: content, author, tags, timestamps

**Notification Adapter**
- Email / Slack / Webhook notifications
- Technology: SendGrid / SMTP / Custom webhooks
- Events: Version created, published, approval required

### Infrastructure Layer

Supporting services and configuration.

- **Database**: Primary data store (PostgreSQL / MongoDB)
- **Cache**: Schema and frequently accessed documents (Redis / Memcached)
- **Message Bus** (Optional): Event streaming (Kafka / RabbitMQ / AWS SNS)
- **Authentication Provider**: Identity management (Auth0 / Okta / Azure AD)
- **Observability Stack**: Logging, metrics, tracing (ELK / Prometheus / Datadog)

## Design Principles Applied

### SOLID Principles

**Single Responsibility Principle (SRP)**
- Each domain entity has one reason to change
- Use cases focus on a single business operation
- Adapters handle only one integration concern

**Open/Closed Principle (OCP)**
- Core domain is closed for modification, open for extension via strategies
- New validation rules added without changing existing validators
- New adapters added without modifying use cases

**Liskov Substitution Principle (LSP)**
- Repository implementations are interchangeable
- Notification adapters can be swapped without affecting business logic
- Schema providers follow consistent contracts

**Interface Segregation Principle (ISP)**
- Repositories expose focused methods per use case
- Clients depend only on the port methods they need
- No fat interfaces forcing unnecessary dependencies

**Dependency Inversion Principle (DIP)**
- High-level use cases depend on abstractions (ports), not implementations
- Infrastructure details injected via dependency injection
- Domain layer has zero dependencies on outer layers

### DRY (Don't Repeat Yourself)

- **Shared validation logic**: `ValidationOrchestrator` reused by API and UI adapters
- **Versioning helpers**: `VersioningService` encapsulates increment logic
- **Diff computation**: `DiffEngine` used by compare API and UI side-by-side view
- **Common DTOs**: Shared data transfer objects across REST and GraphQL

### KISS (Keep It Simple, Stupid)

- MVP limits scope to essential workflows: CRUD + diff + validation + UI editor
- Avoid premature optimization (caching only where proven necessary)
- Simple state machine for version publishing (no complex workflow engine initially)
- Direct database queries before introducing CQRS or event sourcing

### YAGNI (You Aren't Gonna Need It)

- No multi-tenant billing until customer demand justifies it
- No AI-powered features in MVP (manual validation sufficient)
- No advanced workflow engine (simple approval state adequate)
- No real-time collaboration features (async editing sufficient)

## Patterns & Considerations

### Repository Pattern
**Purpose**: Abstract persistence details from domain logic

**Implementation**:
```
interface DocumentRepository {
  save(document: MetadataDocument): DocumentId
  findById(id: DocumentId): MetadataDocument?
  findVersions(id: DocumentId, pagination: Page): List<Version>
  saveVersion(version: Version): VersionId
}
```

**Benefits**: Testable with in-memory implementations, swappable database backends

### Factory / Builder Pattern
**Purpose**: Assemble complex domain objects with defaults and validation

**Use Cases**:
- `DocumentFactory.create(topic, initialContent)`: Apply defaults from schema
- `VersionBuilder.build()`: Construct immutable version with computed metadata

**Benefits**: Encapsulates construction logic, ensures invariants

### Strategy Pattern
**Purpose**: Vary behavior without modifying core logic

**Use Cases**:
- **Diff Rendering**: `PlainTextDiffStrategy` vs. `HighlightedDiffStrategy`
- **Validation Rules**: `StandardValidator` vs. `StrictValidator` per topic
- **Notification Delivery**: `EmailStrategy` vs. `WebhookStrategy`

**Benefits**: Runtime selection, easy to add new strategies

### Observer / Event Sourcing Hooks
**Purpose**: Decouple version changes from downstream reactions

**Implementation**:
- Domain events: `VersionCreatedEvent`, `VersionPublishedEvent`
- Event handlers registered via dependency injection
- Handlers publish to message bus for external consumers

**Benefits**: Loose coupling, enables async processing, audit trail

### Command Pattern
**Purpose**: Encapsulate user actions for execution and auditing

**Use Cases**:
- `CreateDocumentCommand`, `UpdateDocumentCommand`, `PublishVersionCommand`
- Commands logged before execution for audit trail
- Support for undo/redo in future

**Benefits**: Consistent audit logging, potential for command replay

## Data Model

### Entity Relationship

```
Topic (1) ──── (N) MetadataDocument (1) ──── (N) Version
  │
  └─ Schema Definition
```

### Version Storage Strategy

**Option 1: Immutable Version Rows** (Recommended for MVP)
```sql
CREATE TABLE versions (
  version_id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  author VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  state VARCHAR(50) NOT NULL,
  diff_summary TEXT,
  parent_version_id UUID REFERENCES versions(version_id),
  UNIQUE(document_id, version_number)
);
```

**Benefits**:
- Simple to query and compare
- Immutability enforced at database level
- Easy to implement pagination

**Trade-offs**:
- Storage grows with version count (mitigated by retention policies)
- Retrieving current version requires index on version_number

**Option 2: Event Sourcing** (Future Consideration)
- Store only deltas/patches as events
- Reconstruct current state by replaying events
- Benefits: Minimal storage, complete audit trail
- Trade-offs: Complexity in reconstruction, performance for deep histories

### Diff Computation

**Approach**: Structural JSON diff using tree comparison
1. Parse both versions into object trees
2. Recursively compare nodes (breadth-first or depth-first)
3. Categorize changes:
   - **Added**: New keys in target not in source
   - **Removed**: Keys in source not in target
   - **Modified**: Same key, different value
   - **Nested Changes**: Recurse into objects/arrays
4. Tag breaking changes (removed required fields, type changes)

**Performance**: Cache recent diffs, pre-compute for published versions

### Audit Trail

All mutations logged to `audit_log` table:
```sql
CREATE TABLE audit_log (
  log_id UUID PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  details JSONB,
  ip_address VARCHAR(45)
);
```

## Scalability Considerations

### Horizontal Scaling
- **Stateless services**: All state in database/cache, no server-side sessions
- **Load balancing**: Round-robin across API instances
- **Database read replicas**: Route queries to replicas, writes to primary

### Caching Strategy
- **Schema cache**: In-memory cache (Redis) for topic schemas (low change frequency)
- **Document cache**: Cache current version for frequently accessed documents
- **Diff cache**: Cache recent comparisons (LRU eviction)
- **TTL policies**: Schemas (1 hour), documents (5 minutes), diffs (10 minutes)

### Performance Optimization
- **Pagination**: Limit history queries to 50 versions per page
- **Lazy loading**: Load version content on-demand, not in list views
- **Indexing**: Compound indexes on (documentId, versionNumber), (documentId, timestamp)
- **Background processing**: Async diff computation for large documents

## Security Architecture

### Authentication
- **JWT tokens**: Stateless authentication with short expiry (15 minutes)
- **Refresh tokens**: Secure storage, longer expiry (7 days), rotation on use
- **Integration**: Delegate to identity provider (Auth0, Okta, Azure AD)

### Authorization
- **RBAC Model**: Users assigned roles (Viewer, Editor, Approver, Admin)
- **Permissions per role**:
  - Viewer: Read documents, view history
  - Editor: Create, update documents (drafts only)
  - Approver: Publish versions
  - Admin: Manage topics, schemas, users
- **Topic-level permissions**: Fine-grained access control per topic

### Data Protection
- **Encryption at rest**: Database encryption enabled
- **Encryption in transit**: TLS 1.3 for all API communication
- **PII handling**: Audit logs exclude sensitive content, store only references
- **Secret management**: Externalized configuration (Vault, AWS Secrets Manager)

## Testing Strategy

### Unit Tests
- Domain entities and value objects (pure logic, no mocks)
- Domain services with mocked ports
- Target: >80% coverage for domain layer

### Integration Tests
- Use cases with real adapter implementations
- In-memory database for repository tests
- Test doubles for external services

### Contract Tests
- API contract validation (OpenAPI spec)
- Port contract verification (ensure adapters honor interfaces)

### End-to-End Tests
- Critical user journeys (create → update → compare → publish)
- Run against staging environment
- Automated in CI/CD pipeline

## Deployment Architecture

### Containerization
- Docker images for API service, background jobs
- Multi-stage builds for optimized image size
- Health check endpoints for orchestrator

### Orchestration
- Kubernetes deployment (recommended) or Docker Compose (dev)
- Separate deployments for API and workers
- Auto-scaling based on CPU/memory metrics

### CI/CD Pipeline
1. **Build**: Compile, run unit tests
2. **Test**: Integration tests, contract tests
3. **Scan**: Security vulnerability scanning, code quality
4. **Package**: Build Docker image, push to registry
5. **Deploy**: Rolling update to staging, then production
6. **Verify**: Smoke tests, monitoring checks

## Observability

### Logging
- **Structured JSON logs**: Include correlationId, userId, operation, duration
- **Log levels**: ERROR (exceptions), WARN (validation failures), INFO (operations), DEBUG (diagnostics)
- **Centralized**: Stream to ELK stack or CloudWatch Logs

### Metrics
- **Performance**: API latency (p50, p95, p99), operation duration
- **Business**: Documents created, versions published, comparisons run
- **System**: CPU, memory, database connections, cache hit rate

### Tracing
- **Distributed tracing**: OpenTelemetry or Jaeger
- **Trace spans**: API request → use case → repository → database
- **Correlation**: Link traces to logs via correlation ID

### Alerting
- **Critical**: API downtime, database connection failures, high error rate (>5%)
- **Warning**: High latency (>2s), low cache hit rate (<70%), disk space low
- **Notification channels**: PagerDuty, Slack, email

---

_This architecture document describes the technical design. For product vision, see [VISION.md](./VISION.md). For implementation timeline, see [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md)._
