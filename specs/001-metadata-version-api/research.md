# Phase 0: Research & Technical Decisions

**Feature**: Metadata Versioning Service  
**Date**: November 14, 2025  
**Status**: Complete

## Research Areas

### 1. Hexagonal Architecture with Spring Boot

**Decision**: Use package-by-layer organization with strict dependency enforcement via ArchUnit

**Rationale**:
- Hexagonal architecture (Ports & Adapters) ensures domain logic independence from infrastructure
- Spring Boot framework isolated to adapter layer only
- Enables switching persistence (PostgreSQL → MongoDB) or API style (REST → GraphQL) without touching business logic
- ArchUnit tests automatically verify no violations of layer boundaries

**Alternatives Considered**:
- **Traditional layered architecture**: Rejected - Creates tight coupling between layers, makes testing harder
- **Package-by-feature**: Rejected - While good for modularity, harder to enforce hexagonal boundaries
- **Clean Architecture variant**: Considered - Very similar to hexagonal; chose hexagonal for clearer port/adapter terminology

**Implementation Details**:
- `domain` package: Pure Java POJOs, no annotations, contains invariants
- `application.port.in`: Inbound port interfaces (use cases)
- `application.port.out`: Outbound port interfaces (repositories)
- `application.service`: Use case implementations
- `adapter.in.rest`: Spring Web controllers
- `adapter.out.persistence`: Spring Data JPA repositories

**Best Practices**:
- Use `@Component` only in adapter layer
- Domain entities use constructor validation, not bean validation
- DTOs use Java Records for immutability
- Mappers convert between domain and persistence/API models

### 2. PostgreSQL JSONB Storage Strategy

**Decision**: Use hybrid model with structured columns + JSONB for flexible content

**Rationale**:
- Structured columns (type, name, version_number, created_at) enable efficient indexing and queries
- JSONB column stores metadata content with GIN index for custom property queries
- Native PostgreSQL JSONB operators support validation and diff operations
- Maintains ACID properties while providing schema flexibility

**Alternatives Considered**:
- **Pure document store (MongoDB)**: Rejected - Loses transactional guarantees needed for version immutability
- **Pure relational (normalized JSON to columns)**: Rejected - Cannot handle flexible schemas with custom properties
- **TEXT column with JSON parsing**: Rejected - No indexing, no validation, poor query performance

**Implementation Details**:
```sql
CREATE TABLE versions (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL,
    version_number INT NOT NULL,
    content JSONB NOT NULL,
    author VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    publishing_state VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    schema_warning BOOLEAN DEFAULT FALSE,
    schema_warning_timestamp TIMESTAMP,
    UNIQUE(document_id, version_number)
);

CREATE INDEX idx_versions_content_gin ON versions USING GIN (content);
CREATE INDEX idx_versions_active ON versions (document_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_versions_publishing_state ON versions (publishing_state);
```

**Best Practices**:
- Use `@Type(JsonBinaryType.class)` with Hibernate for JSONB mapping
- Validate JSON structure before insert using Jackson
- Query JSONB using PostgreSQL operators: `content @> '{"key": "value"}'`
- Limit JSON depth to 10 levels to prevent circular references

### 3. Version Comparison Algorithm

**Decision**: Use JSON Patch (RFC 6902) for diff generation with custom breaking change detection

**Rationale**:
- JSON Patch standard provides interoperable format for expressing differences
- Generates operations (add, remove, replace) that map to user-facing diff
- Custom logic classifies breaking vs additive based on schema required fields
- Efficient for large documents (only computes changes, not full document comparison)

**Alternatives Considered**:
- **String-based diff (Myers algorithm)**: Rejected - Doesn't understand JSON structure
- **Property-by-property comparison**: Considered - Works but reinvents JSON Patch
- **Database-level diff (pg_jsondiff)**: Rejected - Ties diff logic to PostgreSQL

**Implementation Details**:
```java
public VersionComparison compareVersions(Version v1, Version v2, SchemaDefinition schema) {
    JsonNode node1 = objectMapper.readTree(v1.getContent());
    JsonNode node2 = objectMapper.readTree(v2.getContent());
    
    JsonPatch patch = JsonDiff.asJsonPatch(node1, node2);
    
    List<Change> changes = patch.getOperations().stream()
        .map(op -> classifyChange(op, schema))
        .toList();
    
    boolean hasBreakingChanges = changes.stream()
        .anyMatch(Change::isBreaking);
    
    return new VersionComparison(v1, v2, changes, hasBreakingChanges);
}

private Change classifyChange(JsonPatchOperation op, SchemaDefinition schema) {
    if (op instanceof RemoveOperation) {
        String fieldPath = op.getPath().toString();
        if (schema.isRequired(fieldPath)) {
            return new Change(op, ChangeType.BREAKING_REMOVE);
        }
    }
    // Additional classification logic...
}
```

**Best Practices**:
- Cache schema definitions to avoid repeated database lookups
- Limit comparison to versions of same metadata document (enforce at API level)
- Provide human-readable summary alongside JSON Patch for UI display

### 4. Schema Validation with Jackson

**Decision**: Use JSON Schema Draft 2020-12 with custom validators for extension properties

**Rationale**:
- JSON Schema provides declarative validation rules
- Jackson's json-schema-validator library integrates with existing JSON processing
- Custom validators handle business rules (naming conventions, depth limits)
- Schema evolution supported by storing schema versions with metadata

**Alternatives Considered**:
- **Javax Validation (JSR 380)**: Rejected - Requires Java bean structure, doesn't work with dynamic JSON
- **Custom validation logic**: Rejected - Duplicates JSON Schema standardization effort
- **Everit JSON Schema**: Considered - Excellent library but heavier dependency

**Implementation Details**:
```java
@Service
public class SchemaValidator {
    private final Map<String, JsonSchema> schemaCache = new ConcurrentHashMap<>();
    
    public ValidationResult validate(JsonNode content, SchemaDefinition definition) {
        JsonSchema schema = schemaCache.computeIfAbsent(
            definition.getId(),
            id -> loadSchema(definition)
        );
        
        Set<ValidationMessage> errors = schema.validate(content);
        
        // Additional validation for custom properties
        if (definition.allowsExtensions()) {
            errors.addAll(validateExtensions(content, definition.getExtensionRules()));
        }
        
        return new ValidationResult(errors.isEmpty(), errors);
    }
    
    private Set<ValidationMessage> validateExtensions(JsonNode node, ExtensionRules rules) {
        // Validate naming: camelCase, no reserved words
        // Validate depth: max 10 levels
        // Validate types: only allowed JSON types
    }
}
```

**Best Practices**:
- Store schemas in database, cache in application memory with TTL
- Version schemas alongside metadata (schema_version column)
- Provide detailed error messages with JSON path and constraint violated
- Pre-compile schemas at application startup for validation performance

### 5. Authentication & Authorization Strategy

**Decision**: Public read access, Spring Security with custom AuthenticationProvider for write operations

**Rationale**:
- Public read access enables easy integration for downstream consumers
- Write operations require authentication to establish audit trail
- Custom AuthenticationProvider allows flexible integration (basic auth, JWT, API keys)
- Spring Security handles cross-cutting concerns (CORS, CSRF, rate limiting)

**Alternatives Considered**:
- **No security (fully public)**: Rejected - Cannot establish audit trail without authentication
- **OAuth2 with full RBAC**: Rejected - Over-engineered for current requirements; adds external dependency
- **API key only**: Considered - Simple but less flexible for future user-based permissions

**Implementation Details**:
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/api/v1/metadata/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/versions/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
                .anyRequest().authenticated()
            )
            .httpBasic(Customizer.withDefaults())
            .csrf().disable() // Stateless API
            .build();
    }
    
    @Bean
    public AuthenticationProvider authenticationProvider() {
        // Custom implementation - could be database-backed,
        // LDAP, or delegate to external service
        return new CustomAuthenticationProvider();
    }
}
```

**Best Practices**:
- Use `SecurityContextHolder.getContext().getAuthentication().getName()` to capture author
- Apply rate limiting with Spring's `@RateLimiter` annotation
- Enable CORS for cross-origin frontend access
- Document authentication requirements in OpenAPI spec

### 6. Performance Optimization Strategies

**Decision**: Multi-layered caching with Redis for active versions, Caffeine for schemas

**Rationale**:
- Active versions accessed frequently by downstream systems - cache with Redis for distributed access
- Schema definitions rarely change - cache in-memory with Caffeine for low latency
- Pagination with cursor-based approach scales better than offset-based
- Database indexes optimize query patterns (type+name+active, version_number)

**Alternatives Considered**:
- **No caching**: Rejected - Violates p95 latency requirements under load
- **Cache-only (Redis)**: Rejected - Single point of failure, network latency for every request
- **Offset-based pagination**: Rejected - Poor performance for large datasets (skip N rows)

**Implementation Details**:
```java
@Service
@CacheConfig(cacheNames = "activeVersions")
public class MetadataQueryService {
    @Cacheable(key = "#type + ':' + #name")
    public Optional<Version> getActiveVersion(String type, String name) {
        return versionRepository.findByTypeAndNameAndActiveTrue(type, name);
    }
    
    @CacheEvict(key = "#type + ':' + #name")
    public void activateVersion(String type, String name, int versionNumber) {
        // Activation logic...
    }
}

@Configuration
public class CacheConfig {
    @Bean
    public CacheManager cacheManager() {
        return RedisCacheManager.builder(redisConnectionFactory())
            .cacheDefaults(RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(15))
                .serializeValuesWith(/* Jackson serializer */))
            .build();
    }
    
    @Bean
    public CacheManager schemaCacheManager() {
        return new CaffeineCacheManager("schemas");
    }
}
```

**Best Practices**:
- Use cache-aside pattern (check cache, fallback to DB, populate cache)
- Implement cache warming for frequently accessed metadata on startup
- Monitor cache hit rates with Micrometer metrics
- Use Redis cluster for high availability in production

### 7. Observability & Monitoring

**Decision**: Spring Boot Actuator + Micrometer + structured JSON logging

**Rationale**:
- Spring Boot Actuator provides out-of-the-box health and metrics endpoints
- Micrometer abstracts metrics collection (Prometheus, Datadog, CloudWatch compatible)
- Structured JSON logging with correlation IDs enables distributed tracing
- Minimal code changes required - mostly configuration

**Alternatives Considered**:
- **OpenTelemetry**: Considered - More comprehensive but requires agent setup
- **Custom metrics**: Rejected - Reinvents existing standards
- **Splunk/ELK directly**: Rejected - Tightly couples to specific logging platform

**Implementation Details**:
```yaml
# application.yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    tags:
      application: metadata-versioning
      environment: ${ENVIRONMENT:dev}
  health:
    db:
      enabled: true
    redis:
      enabled: true

logging:
  pattern:
    console: '{"timestamp":"%d{ISO8601}","level":"%p","thread":"%t","logger":"%c{1}","traceId":"%X{traceId}","message":"%m"}%n'
```

```java
@RestController
public class MetadataController {
    private final MeterRegistry meterRegistry;
    
    @PostMapping("/api/v1/metadata")
    public ResponseEntity<VersionResponse> createVersion(@RequestBody CreateMetadataRequest request) {
        Timer.Sample sample = Timer.start(meterRegistry);
        try {
            Version version = createVersionUseCase.execute(request);
            return ResponseEntity.ok(mapper.toResponse(version));
        } finally {
            sample.stop(meterRegistry.timer("metadata.create.duration",
                "type", request.getType()));
        }
    }
}
```

**Best Practices**:
- Add correlation IDs to MDC for request tracing
- Record custom metrics for business events (versions created, activations)
- Configure health checks with reasonable timeouts
- Export metrics to Prometheus for visualization in Grafana

## Dependencies Summary

**Core Dependencies**:
```xml
<dependencies>
    <!-- Spring Boot -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
        <version>3.3.0</version>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
        <version>3.3.0</version>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
        <version>3.3.0</version>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-cache</artifactId>
        <version>3.3.0</version>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
        <version>3.3.0</version>
    </dependency>
    
    <!-- Database -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <version>42.7.0</version>
    </dependency>
    <dependency>
        <groupId>org.flywaydb</groupId>
        <artifactId>flyway-core</artifactId>
        <version>10.0.0</version>
    </dependency>
    <dependency>
        <groupId>com.vladmihalcea</groupId>
        <artifactId>hibernate-types-60</artifactId>
        <version>2.21.1</version>
    </dependency>
    
    <!-- JSON Processing -->
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
        <version>2.16.0</version>
    </dependency>
    <dependency>
        <groupId>com.networknt</groupId>
        <artifactId>json-schema-validator</artifactId>
        <version>1.0.87</version>
    </dependency>
    <dependency>
        <groupId>com.flipkart.zjsonpatch</groupId>
        <artifactId>zjsonpatch</artifactId>
        <version>0.4.14</version>
    </dependency>
    
    <!-- Caching -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
        <version>3.3.0</version>
    </dependency>
    <dependency>
        <groupId>com.github.ben-manes.caffeine</groupId>
        <artifactId>caffeine</artifactId>
        <version>3.1.8</version>
    </dependency>
    
    <!-- API Documentation -->
    <dependency>
        <groupId>org.springdoc</groupId>
        <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
        <version>2.3.0</version>
    </dependency>
    
    <!-- Testing -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <version>3.3.0</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>postgresql</artifactId>
        <version>1.19.3</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>junit-jupiter</artifactId>
        <version>1.19.3</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>io.rest-assured</groupId>
        <artifactId>rest-assured</artifactId>
        <version>5.4.0</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>com.tngtech.archunit</groupId>
        <artifactId>archunit-junit5</artifactId>
        <version>1.2.1</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

## Next Steps

All research complete. Proceed to Phase 1:
1. Generate data-model.md with entity designs
2. Generate contracts/openapi.yaml with API specifications
3. Generate quickstart.md with setup instructions
4. Update agent context with technology decisions
