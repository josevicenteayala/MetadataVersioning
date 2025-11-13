# MetadataVersioning - Architecture

## Overview

MetadataVersioning follows **Hexagonal Architecture** (Ports & Adapters) to keep the core domain independent from delivery technology. This architectural style ensures that business logic remains testable, maintainable, and adaptable to changing infrastructure requirements.

## Technology Stack

### Backend

**Core Platform**
- **Java 21** (LTS) - Modern Java with virtual threads, pattern matching, and improved performance
- **Spring Boot 3.3** - Enterprise-grade framework compatible with Java 21
- **Spring Web** - RESTful API implementation
- **Spring Data JPA** - Database abstraction and ORM
- **Spring Security** - Authentication and authorization
- **Spring Validation** - Request validation with Bean Validation API

**Build & Dependencies**
- **Maven 3.9+** or **Gradle 8+** - Dependency management and build automation
- **Java 21 Features Used**:
  - Virtual Threads for improved concurrency (Project Loom)
  - Record Classes for immutable DTOs
  - Pattern Matching for enhanced readability
  - Sealed Classes for domain modeling

**Data & Persistence**
- **PostgreSQL 15+** - Primary database with JSONB support for flexible JSON storage
- **Flyway** or **Liquibase** - Database migration management
- **HikariCP** - High-performance JDBC connection pooling (default in Spring Boot)

**Validation & Schema**
- **JSON Schema Validator** - Java library for JSON Schema validation (e.g., `everit-json-schema` or `networknt/json-schema-validator`)
- **Hibernate Validator** - Bean validation implementation

**API Documentation**
- **SpringDoc OpenAPI** (Swagger) - Automated API documentation generation
- **Spring REST Docs** - Test-driven API documentation

**Testing**
- **JUnit 5** - Unit and integration testing
- **Mockito** - Mocking framework
- **TestContainers** - Integration testing with PostgreSQL containers
- **RestAssured** - REST API testing
- **ArchUnit** - Architecture testing to enforce hexagonal structure

**Observability**
- **Spring Boot Actuator** - Application metrics and health checks
- **Micrometer** - Metrics instrumentation
- **SLF4J + Logback** - Logging framework (default in Spring Boot)

### Frontend

**Core Platform**
- **React 18+** - Modern UI library with hooks and concurrent features
- **TypeScript 5+** - Type-safe JavaScript for maintainability
- **Vite** - Fast build tool and development server

**JSON Handling & Editing**
- **@monaco-editor/react** - Rich JSON editor with syntax highlighting (VSCode-based)
- **jsoneditor-react** - Alternative: user-friendly JSON editor with tree/code views
- **json-schema-form** - Generate forms from JSON schemas
- **ajv** - Fast JSON schema validator for client-side validation

**State Management**
- **React Query (TanStack Query)** - Server state management and caching
- **Zustand** or **Redux Toolkit** - Client state management (if needed)

**UI Components**
- **Material-UI (MUI)** or **Ant Design** - Component library with rich controls
- **React Hook Form** - Performant form handling
- **React Diff Viewer** - Side-by-side diff visualization

**API Integration**
- **Axios** or **Fetch API** - HTTP client
- **OpenAPI TypeScript Codegen** - Generate TypeScript clients from OpenAPI spec

**Build & Development**
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** or **Jest** - Unit testing
- **React Testing Library** - Component testing
- **Cypress** or **Playwright** - E2E testing

### Rationale

**Why Java 21 + Spring Boot 3.3?**
- **Enterprise-ready**: Battle-tested stack with extensive ecosystem
- **Performance**: Virtual threads enable high concurrency with simple code
- **Type safety**: Strong typing reduces runtime errors
- **JSON support**: Excellent libraries for JSON processing and validation
- **Community**: Large developer community and extensive documentation
- **Spring Boot 3.3**: First version with full Java 21 support, including compatibility with virtual threads and modern Java features

**Why React + TypeScript for Frontend?**
- **JSON-first**: React's component model naturally handles JSON data structures
- **Rich ecosystem**: Excellent JSON editor libraries (Monaco, JSONEditor)
- **Type safety**: TypeScript prevents common errors when working with complex JSON
- **Developer experience**: Fast iteration with Vite, great tooling
- **Schema forms**: Libraries like `react-jsonschema-form` can auto-generate UIs from JSON schemas

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
  - **Technology**: Spring Boot 3.3 with Spring Web MVC
  - **Annotations**: `@RestController`, `@RequestMapping`, `@Valid`
  - **Features**: Content negotiation, exception handling with `@ControllerAdvice`, HATEOAS support
  - **Responsibilities**: Request mapping, DTO transformation, error handling, OpenAPI documentation
  
- **CLI Tools**: Command-line interface for power users
  - **Technology**: Spring Shell or Picocli
  - **Use cases**: Bulk operations, CI/CD integration, admin tasks

- **GraphQL Gateway** (Future)
  - **Technology**: Spring for GraphQL (official Spring integration)
  - **Benefits**: Flexible queries, reduced over-fetching

- **Background Jobs**: Scheduled tasks and async processing
  - **Technology**: Spring Scheduled (`@Scheduled`), Spring Async (`@Async`), or Quartz Scheduler
  - **Use cases**: Archive old versions, sync to search index, generate reports

#### Outbound Adapters (Driven)

**Persistence Adapters**
- **SQL Repository**: PostgreSQL 15+ with JSONB columns
  - **Implementation**: Spring Data JPA with custom repositories
  - **Entity classes**: JPA entities with `@Entity`, `@Table` annotations
  - **JSONB handling**: Hibernate custom types or native queries for JSON operations
  - Tables: topics, documents, versions, audit_log
  - Indexes: documentId, topicId, timestamp, state
  - Benefits: ACID transactions, rich querying on JSONB, type-safe queries with JPA

- **Alternative Repository** (Future): MongoDB with Spring Data MongoDB
  - Collections: documents with embedded versions
  - Benefits: Natural JSON storage, horizontal scaling
  - Implementation: `@Document` entities with MongoRepository

**Schema Registry Adapter**
- Centralized store for topic schemas with versioning
- **Implementation**: Custom Spring service backed by database or external registry
- **Options**: Schema Registry (Confluent), JSON files in classpath, database table

**Search Index Adapter** (Future)
- Full-text search across document content
- **Technology**: Elasticsearch with Spring Data Elasticsearch
- **Implementation**: `@Document` annotated entities, ElasticsearchRepository
- Indexed fields: content, author, tags, timestamps

**Notification Adapter**
- Email / Slack / Webhook notifications
- **Technology**: Spring Mail, WebClient for HTTP webhooks, Spring Integration for complex workflows
- **Implementation**: Event listeners with `@EventListener` or `@TransactionalEventListener`
- Events: Version created, published, approval required

**Authentication Adapter**
- **Technology**: Spring Security with OAuth2/JWT
- **Integration**: Spring Security OAuth2 Resource Server
- **Providers**: Auth0, Okta, Azure AD, Keycloak
- **Implementation**: SecurityFilterChain, JWT decoder, custom UserDetailsService

### Infrastructure Layer

Supporting services and configuration.

- **Application Server**: Embedded Tomcat (default in Spring Boot) or Undertow
- **Database**: PostgreSQL 15+ (primary data store)
- **Cache**: Redis for schema and frequently accessed documents (Spring Cache with Redis)
- **Message Bus** (Optional): Kafka / RabbitMQ / AWS SNS with Spring Kafka or Spring AMQP
- **Authentication Provider**: OAuth2/OIDC provider (Auth0, Okta, Azure AD, Keycloak)
- **Observability Stack**: 
  - Spring Boot Actuator for metrics endpoints
  - Prometheus for metrics collection
  - Grafana for visualization
  - ELK Stack (Elasticsearch, Logback, Kibana) for log aggregation
  - Zipkin or Jaeger for distributed tracing (Spring Cloud Sleuth)
- **Containerization**: Docker for packaging, Kubernetes for orchestration
- **CI/CD**: GitHub Actions, GitLab CI, or Jenkins with Maven/Gradle integration

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

## Spring Boot Implementation Examples

### REST Controller Example

```java
@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {
    
    private final CreateDocumentUseCase createDocumentUseCase;
    private final UpdateDocumentUseCase updateDocumentUseCase;
    
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentResponse createDocument(
            @Valid @RequestBody CreateDocumentRequest request,
            @AuthenticationPrincipal User currentUser) {
        
        var command = new CreateDocumentCommand(
            request.topicId(),
            request.content(),
            currentUser.getUsername()
        );
        
        var result = createDocumentUseCase.execute(command);
        return DocumentResponse.from(result);
    }
    
    @PutMapping("/{documentId}")
    public DocumentResponse updateDocument(
            @PathVariable UUID documentId,
            @Valid @RequestBody UpdateDocumentRequest request,
            @AuthenticationPrincipal User currentUser) {
        
        var command = new UpdateDocumentCommand(
            documentId,
            request.content(),
            currentUser.getUsername(),
            request.comment()
        );
        
        var result = updateDocumentUseCase.execute(command);
        return DocumentResponse.from(result);
    }
    
    @ExceptionHandler(ValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidationException(ValidationException ex) {
        return new ErrorResponse(ex.getErrors());
    }
}
```

### Repository Implementation with Spring Data JPA

```java
@Entity
@Table(name = "versions")
@NoArgsConstructor
@AllArgsConstructor
@Getter
public class VersionEntity {
    
    @Id
    @GeneratedValue
    private UUID versionId;
    
    @Column(nullable = false)
    private UUID documentId;
    
    @Column(nullable = false)
    private Integer versionNumber;
    
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> content;
    
    @Column(nullable = false)
    private String author;
    
    @Column(nullable = false)
    private Instant timestamp;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PublishingState state;
    
    @Column
    private String diffSummary;
}

@Repository
public interface VersionJpaRepository extends JpaRepository<VersionEntity, UUID> {
    
    @Query("SELECT v FROM VersionEntity v WHERE v.documentId = :documentId ORDER BY v.versionNumber DESC")
    Page<VersionEntity> findByDocumentIdOrderByVersionNumberDesc(
        @Param("documentId") UUID documentId, 
        Pageable pageable
    );
    
    Optional<VersionEntity> findByDocumentIdAndVersionNumber(UUID documentId, Integer versionNumber);
}

@Component
@RequiredArgsConstructor
public class DocumentRepositoryImpl implements DocumentRepository {
    
    private final VersionJpaRepository jpaRepository;
    private final VersionMapper versionMapper;
    
    @Override
    public Version saveVersion(Version version) {
        var entity = versionMapper.toEntity(version);
        var saved = jpaRepository.save(entity);
        return versionMapper.toDomain(saved);
    }
    
    @Override
    public List<Version> findVersions(DocumentId documentId, Page pagination) {
        var pageable = PageRequest.of(
            pagination.getNumber(), 
            pagination.getSize()
        );
        return jpaRepository
            .findByDocumentIdOrderByVersionNumberDesc(documentId.getValue(), pageable)
            .stream()
            .map(versionMapper::toDomain)
            .toList();
    }
}
```

### Use Case with Transaction Management

```java
@Service
@Transactional
@RequiredArgsConstructor
public class UpdateDocumentUseCase {
    
    private final DocumentRepository documentRepository;
    private final ValidationOrchestrator validationOrchestrator;
    private final VersioningService versioningService;
    private final ApplicationEventPublisher eventPublisher;
    
    public DocumentResult execute(UpdateDocumentCommand command) {
        // Load existing document
        var document = documentRepository.findById(command.documentId())
            .orElseThrow(() -> new DocumentNotFoundException(command.documentId()));
        
        // Validate new content
        var validationResult = validationOrchestrator.validate(
            document.getTopicId(), 
            command.content()
        );
        
        if (!validationResult.isValid()) {
            throw new ValidationException(validationResult.getErrors());
        }
        
        // Create new version
        var newVersion = versioningService.createVersion(
            document,
            command.content(),
            command.author(),
            command.comment()
        );
        
        documentRepository.saveVersion(newVersion);
        
        // Publish domain event
        eventPublisher.publishEvent(
            new VersionCreatedEvent(newVersion.getVersionId(), command.author())
        );
        
        return new DocumentResult(document.getId(), newVersion.getVersionId());
    }
}
```

### Configuration Classes

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/public/**").permitAll()
                .requestMatchers("/api/v1/documents/**").hasRole("USER")
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            )
            .csrf(csrf -> csrf.disable());
        
        return http.build();
    }
    
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        var converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(new CustomJwtGrantedAuthoritiesConverter());
        return converter;
    }
}

@Configuration
@EnableCaching
public class CacheConfig {
    
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        var config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    new GenericJackson2JsonRedisSerializer()
                )
            );
        
        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(config)
            .build();
    }
}
```

### Testing Example with TestContainers

```java
@SpringBootTest
@Testcontainers
class DocumentRepositoryIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");
    
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
    
    @Autowired
    private DocumentRepository documentRepository;
    
    @Test
    void shouldSaveAndRetrieveVersion() {
        var version = new Version(/* ... */);
        var saved = documentRepository.saveVersion(version);
        
        assertThat(saved.getVersionId()).isNotNull();
        assertThat(saved.getContent()).isEqualTo(version.getContent());
    }
}
```

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
