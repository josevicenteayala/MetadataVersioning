# Data Model Design

**Feature**: Metadata Versioning Service  
**Date**: November 14, 2025  
**Architecture**: Hexagonal (Domain-driven)

## Overview

The data model follows Domain-Driven Design principles with clear separation between:
- **Domain Models**: Pure business logic entities (no framework dependencies)
- **Persistence Models**: JPA entities for database mapping
- **API Models**: DTOs for REST API contracts

## Domain Entities

### 1. MetadataDocument

**Purpose**: Aggregate root representing a named configuration (e.g., loyalty program, campaign)

**Attributes**:
- `id`: Long - Unique identifier (surrogate key)
- `type`: String - Category of metadata (e.g., "loyalty-program", "campaign", "offer")
- `name`: String - Unique name within type (e.g., "spring-bonus", "summer-campaign")
- `versions`: List<Version> - All versions of this document (ordered by version number)
- `createdAt`: Instant - When first version was created
- `updatedAt`: Instant - When last version was created

**Invariants**:
- Type and name together must be unique
- Must have at least one version
- At most one version can be active
- Type must match pattern: `[a-z]+(-[a-z]+)*` (kebab-case)
- Name must match pattern: `[a-z0-9]+(-[a-z0-9]+)*` (kebab-case with numbers)

**Relationships**:
- One-to-many with Version (aggregate)
- Optional one-to-one with SchemaDefinition (via type)

```java
public class MetadataDocument {
    private final Long id;
    private final String type;
    private final String name;
    private final List<Version> versions;
    private final Instant createdAt;
    private Instant updatedAt;
    
    public MetadataDocument(String type, String name) {
        validateType(type);
        validateName(name);
        this.id = null; // Assigned by persistence
        this.type = type;
        this.name = name;
        this.versions = new ArrayList<>();
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }
    
    public Version createNewVersion(JsonNode content, String author) {
        int nextVersionNumber = versions.size() + 1;
        Version version = new Version(this.id, nextVersionNumber, content, author);
        versions.add(version);
        this.updatedAt = Instant.now();
        return version;
    }
    
    public void activateVersion(int versionNumber) {
        Version toActivate = findVersion(versionNumber)
            .orElseThrow(() -> new VersionNotFoundException(versionNumber));
            
        if (toActivate.getPublishingState() != PublishingState.PUBLISHED) {
            throw new InvalidStateTransitionException(
                "Only published versions can be activated"
            );
        }
        
        // Deactivate current active version
        versions.stream()
            .filter(Version::isActive)
            .forEach(v -> v.deactivate());
            
        toActivate.activate();
    }
    
    public Optional<Version> getActiveVersion() {
        return versions.stream()
            .filter(Version::isActive)
            .findFirst();
    }
    
    private void validateType(String type) {
        if (!type.matches("[a-z]+(-[a-z]+)*")) {
            throw new IllegalArgumentException(
                "Type must be kebab-case: " + type
            );
        }
    }
    
    private void validateName(String name) {
        if (!name.matches("[a-z0-9]+(-[a-z0-9]+)*")) {
            throw new IllegalArgumentException(
                "Name must be kebab-case with numbers: " + name
            );
        }
    }
}
```

### 2. Version

**Purpose**: Value object representing immutable snapshot of metadata content

**Attributes**:
- `id`: Long - Unique identifier
- `documentId`: Long - Foreign key to MetadataDocument
- `versionNumber`: Integer - Sequential version (v1=1, v2=2, etc.)
- `content`: JsonNode - The actual metadata as JSON
- `author`: String - Who created this version (from auth system)
- `createdAt`: Instant - Timestamp of version creation
- `changeSummary`: String - Human-readable description of changes
- `publishingState`: PublishingState - Current lifecycle state
- `isActive`: Boolean - Whether this is the active version
- `schemaWarning`: Boolean - Whether this version violates current schema
- `schemaWarningTimestamp`: Instant - When schema warning was applied

**Invariants**:
- Content must be valid JSON
- Version number must be positive and sequential within document
- Author must not be null or empty
- Once created, content/author/createdAt are immutable
- Publishing state transitions must follow allowed paths
- Only published versions can be activated

**State Transitions**:
```
DRAFT → APPROVED → PUBLISHED → ARCHIVED
        ↓           ↓
        DRAFT       ARCHIVED
```

**Relationships**:
- Many-to-one with MetadataDocument (belongs to aggregate)

```java
public class Version {
    private final Long id;
    private final Long documentId;
    private final int versionNumber;
    private final JsonNode content;
    private final String author;
    private final Instant createdAt;
    private String changeSummary;
    private PublishingState publishingState;
    private boolean isActive;
    private boolean schemaWarning;
    private Instant schemaWarningTimestamp;
    
    public Version(Long documentId, int versionNumber, JsonNode content, String author) {
        validateVersionNumber(versionNumber);
        validateContent(content);
        validateAuthor(author);
        
        this.id = null; // Assigned by persistence
        this.documentId = documentId;
        this.versionNumber = versionNumber;
        this.content = content;
        this.author = author;
        this.createdAt = Instant.now();
        this.changeSummary = ""; // Computed after comparison
        this.publishingState = PublishingState.DRAFT;
        this.isActive = false;
        this.schemaWarning = false;
    }
    
    public void transitionTo(PublishingState newState) {
        if (!publishingState.canTransitionTo(newState)) {
            throw new InvalidStateTransitionException(
                String.format("Cannot transition from %s to %s", 
                    publishingState, newState)
            );
        }
        this.publishingState = newState;
    }
    
    public void activate() {
        if (publishingState != PublishingState.PUBLISHED) {
            throw new InvalidStateTransitionException(
                "Only published versions can be activated"
            );
        }
        this.isActive = true;
    }
    
    public void deactivate() {
        this.isActive = false;
    }
    
    public void markSchemaWarning() {
        this.schemaWarning = true;
        this.schemaWarningTimestamp = Instant.now();
    }
    
    public void clearSchemaWarning() {
        this.schemaWarning = false;
        this.schemaWarningTimestamp = null;
    }
    
    // Immutable getters...
}
```

### 3. PublishingState (Sealed Class)

**Purpose**: Type-safe enumeration of version lifecycle states

```java
public sealed interface PublishingState 
    permits Draft, Approved, Published, Archived {
    
    String name();
    boolean canTransitionTo(PublishingState target);
    
    record Draft() implements PublishingState {
        @Override
        public String name() { return "DRAFT"; }
        
        @Override
        public boolean canTransitionTo(PublishingState target) {
            return target instanceof Approved;
        }
    }
    
    record Approved() implements PublishingState {
        @Override
        public String name() { return "APPROVED"; }
        
        @Override
        public boolean canTransitionTo(PublishingState target) {
            return target instanceof Published || target instanceof Draft;
        }
    }
    
    record Published() implements PublishingState {
        @Override
        public String name() { return "PUBLISHED"; }
        
        @Override
        public boolean canTransitionTo(PublishingState target) {
            return target instanceof Archived;
        }
    }
    
    record Archived() implements PublishingState {
        @Override
        public String name() { return "ARCHIVED"; }
        
        @Override
        public boolean canTransitionTo(PublishingState target) {
            return false; // Terminal state
        }
    }
}
```

### 4. SchemaDefinition

**Purpose**: Defines structure and validation rules for a metadata type

**Attributes**:
- `id`: Long - Unique identifier
- `type`: String - Metadata type this schema applies to
- `schemaContent`: JsonNode - JSON Schema (Draft 2020-12)
- `version`: Integer - Schema version number
- `allowsExtensions`: Boolean - Whether custom properties are allowed
- `extensionRules`: ExtensionRules - Validation rules for custom properties
- `createdAt`: Instant - When schema was defined
- `createdBy`: String - Who created the schema

**Invariants**:
- Type must be unique per schema version
- Schema content must be valid JSON Schema
- Extension rules must be defined if allowsExtensions is true

**Relationships**:
- One-to-many with MetadataDocument (via type)

```java
public class SchemaDefinition {
    private final Long id;
    private final String type;
    private final JsonNode schemaContent;
    private final int version;
    private final boolean allowsExtensions;
    private final ExtensionRules extensionRules;
    private final Instant createdAt;
    private final String createdBy;
    
    public SchemaDefinition(String type, JsonNode schemaContent, 
                           boolean allowsExtensions, ExtensionRules extensionRules,
                           String createdBy) {
        validateSchemaContent(schemaContent);
        
        this.id = null;
        this.type = type;
        this.schemaContent = schemaContent;
        this.version = 1; // Incremented on updates
        this.allowsExtensions = allowsExtensions;
        this.extensionRules = extensionRules;
        this.createdAt = Instant.now();
        this.createdBy = createdBy;
    }
    
    public boolean isRequired(String fieldPath) {
        // Parse schema to check if fieldPath is in required array
        JsonNode required = schemaContent.at("/required");
        return required.isArray() && 
               StreamSupport.stream(required.spliterator(), false)
                   .anyMatch(node -> node.asText().equals(fieldPath));
    }
    
    public ValidationResult validate(JsonNode content) {
        // Delegate to SchemaValidator service
    }
}
```

### 5. ExtensionRules (Value Object)

**Purpose**: Encapsulates validation rules for custom properties

```java
public record ExtensionRules(
    int maxDepth,
    Set<String> allowedTypes,
    Pattern namingPattern,
    Set<String> reservedWords
) {
    public static final ExtensionRules DEFAULT = new ExtensionRules(
        10, // Max depth
        Set.of("string", "number", "boolean", "object", "array"),
        Pattern.compile("[a-zA-Z][a-zA-Z0-9]*"), // camelCase
        Set.of("id", "type", "version", "schema")
    );
    
    public ValidationResult validate(String propertyName, JsonNode value, int depth) {
        List<String> errors = new ArrayList<>();
        
        if (depth > maxDepth) {
            errors.add("Property nesting exceeds maximum depth of " + maxDepth);
        }
        
        if (!namingPattern.matcher(propertyName).matches()) {
            errors.add("Property name must match pattern: " + namingPattern);
        }
        
        if (reservedWords.contains(propertyName.toLowerCase())) {
            errors.add("Property name is reserved: " + propertyName);
        }
        
        String nodeType = getJsonType(value);
        if (!allowedTypes.contains(nodeType)) {
            errors.add("Property type not allowed: " + nodeType);
        }
        
        return new ValidationResult(errors.isEmpty(), errors);
    }
}
```

### 6. VersionComparison (Value Object)

**Purpose**: Result of comparing two versions

```java
public record VersionComparison(
    Version fromVersion,
    Version toVersion,
    List<Change> changes,
    boolean hasBreakingChanges,
    Instant comparedAt
) {
    public record Change(
        String operation, // "add", "remove", "replace"
        String path,      // JSON path
        Object oldValue,  // null for add
        Object newValue,  // null for remove
        ChangeType type   // BREAKING_REMOVE, BREAKING_MODIFY, ADDITIVE, NON_BREAKING
    ) {}
    
    public enum ChangeType {
        BREAKING_REMOVE,    // Removed required field
        BREAKING_MODIFY,    // Changed required field type
        ADDITIVE,           // Added new field
        NON_BREAKING        // Modified optional field
    }
    
    public String getSummary() {
        return String.format(
            "%d change(s): %d breaking, %d additive, %d non-breaking",
            changes.size(),
            countByType(ChangeType.BREAKING_REMOVE, ChangeType.BREAKING_MODIFY),
            countByType(ChangeType.ADDITIVE),
            countByType(ChangeType.NON_BREAKING)
        );
    }
}
```

### 7. AuditEntry (Value Object)

**Purpose**: Immutable record of significant system events

```java
public record AuditEntry(
    Long id,
    String eventType,      // "VERSION_CREATED", "VERSION_ACTIVATED", etc.
    String actor,          // Who performed the action
    Instant timestamp,     // When it occurred
    String resourceType,   // "MetadataDocument", "Version", "Schema"
    Long resourceId,       // ID of affected resource
    JsonNode metadata      // Additional context (old/new values)
) {
    public static AuditEntry versionCreated(Version version, String actor) {
        return new AuditEntry(
            null,
            "VERSION_CREATED",
            actor,
            Instant.now(),
            "Version",
            version.getId(),
            createMetadata("versionNumber", version.getVersionNumber())
        );
    }
    
    public static AuditEntry versionActivated(Version version, String actor) {
        return new AuditEntry(
            null,
            "VERSION_ACTIVATED",
            actor,
            Instant.now(),
            "Version",
            version.getId(),
            createMetadata("versionNumber", version.getVersionNumber())
        );
    }
    
    // Additional factory methods for other event types...
}
```

## Database Schema

### Tables

```sql
-- Metadata documents (aggregate roots)
CREATE TABLE metadata_documents (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    UNIQUE(type, name)
);

CREATE INDEX idx_metadata_documents_type ON metadata_documents(type);

-- Versions (owned by metadata documents)
CREATE TABLE versions (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES metadata_documents(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    content JSONB NOT NULL,
    author VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    change_summary TEXT,
    publishing_state VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    schema_warning BOOLEAN NOT NULL DEFAULT FALSE,
    schema_warning_timestamp TIMESTAMP,
    UNIQUE(document_id, version_number),
    CHECK (version_number > 0),
    CHECK (publishing_state IN ('DRAFT', 'APPROVED', 'PUBLISHED', 'ARCHIVED'))
);

CREATE INDEX idx_versions_document ON versions(document_id);
CREATE INDEX idx_versions_active ON versions(document_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_versions_state ON versions(publishing_state);
CREATE INDEX idx_versions_content_gin ON versions USING GIN (content);

-- Schema definitions
CREATE TABLE schema_definitions (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    schema_content JSONB NOT NULL,
    version INT NOT NULL DEFAULT 1,
    allows_extensions BOOLEAN NOT NULL DEFAULT TRUE,
    extension_max_depth INT NOT NULL DEFAULT 10,
    extension_allowed_types TEXT[] NOT NULL,
    extension_naming_pattern VARCHAR(255) NOT NULL,
    extension_reserved_words TEXT[],
    created_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    UNIQUE(type, version)
);

CREATE INDEX idx_schema_definitions_type ON schema_definitions(type);

-- Audit entries
CREATE TABLE audit_entries (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id BIGINT NOT NULL,
    metadata JSONB
);

CREATE INDEX idx_audit_entries_actor ON audit_entries(actor);
CREATE INDEX idx_audit_entries_timestamp ON audit_entries(timestamp DESC);
CREATE INDEX idx_audit_entries_resource ON audit_entries(resource_type, resource_id);
```

### Constraints & Invariants

1. **One Active Version per Document**: Enforced by partial unique index
2. **Sequential Version Numbers**: Enforced by application logic + optimistic locking
3. **Immutable Versions**: No UPDATE statements on content/author/created_at columns
4. **Publishing State Transitions**: Enforced by application logic
5. **Schema Compliance**: Warnings tracked but don't block operations

## Entity Relationships

```
MetadataDocument (1) ───< (N) Version
       │                      │
       │                      └─ has PublishingState (sealed class)
       │
       └─ validates against (0..1) SchemaDefinition
                                   │
                                   └─ has ExtensionRules

AuditEntry references any entity type via (resource_type, resource_id)
```

## Migration Strategy

Flyway scripts will create schema incrementally:

1. **V1__create_metadata_tables.sql**: metadata_documents + versions tables
2. **V2__create_schema_tables.sql**: schema_definitions table  
3. **V3__create_audit_tables.sql**: audit_entries table
4. **V4__add_indexes.sql**: Performance indexes (GIN, partial, etc.)
5. **V5__seed_data.sql**: Default schema definitions for common types

## Summary

The data model provides:
- **Strong invariants** enforced in domain layer
- **Flexible storage** via JSONB for metadata content
- **Complete audit trail** for compliance
- **Schema evolution** support with warning flags
- **Performance optimization** through strategic indexing
- **Clear separation** between domain and persistence concerns
