 # Metadata Versioning REST API Specification

## Overview

The Metadata Versioning Service is a RESTful API built with Java 21 and Spring Boot 3+ that provides comprehensive metadata management with version control capabilities. This service allows users to create, version, activate, and manage metadata entries with full audit trail and JSON storage support.

### Key Features
- **Version Control**: Automatic incremental versioning for all metadata changes
- **Active Version Management**: One active version per (type, name) combination
- **JSON Storage**: Native JSONB support for flexible metadata schemas
- **Full Audit Trail**: Complete history with timestamps for all versions
- **RESTful Design**: Clean API following REST principles

### Technology Stack
- **Language**: Java 21
- **Framework**: Spring Boot 3.3+
- **Database**: PostgreSQL 15+
- **ORM**: Spring Data JPA / Hibernate
- **Migrations**: Flyway
- **API Documentation**: OpenAPI 3.1
- **JSON Processing**: Jackson

## Data Model

### MetadataEntry Entity

```
___________________________________________________________________________________________________
       MetadataEntry             
___________________________________________________________________________________________________$
 + id: UUID                      
 + type: String                  
 + name: String                  
 + json: JSONB                   
 + version: Integer              
 + isActive: Boolean             
 + created: Timestamp            
 + updated: Timestamp            
___________________________________________________________________________________________________$
 UK: (type, name, version)       
 IDX: (type, name, isActive)     
___________________________________________________________________________________________________
```

### Field Descriptions

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | UUID | Unique identifier | Primary Key, Auto-generated |
| type | VARCHAR(100) | Metadata type/category | Required, Not null |
| name | VARCHAR(255) | Metadata name | Required, Not null |
| json | JSONB | Metadata content | Required, Valid JSON |
| version | INTEGER | Version number | Required, Min: 1, Auto-increment |
| isActive | BOOLEAN | Active flag | Required, Default: false |
| created | TIMESTAMP | Creation timestamp | Required, Auto-generated |
| updated | TIMESTAMP | Last update timestamp | Required, Auto-maintained |

## API Endpoints

### 1. Create Metadata

**Endpoint**: `POST /metadata`

**Description**: Creates a new metadata entry with version 1 and sets it as active.

**Request Body**:
```json
{
  "type": "configuration",
  "name": "app-settings",
  "json": {
    "theme": "dark",
    "language": "en"
  }
}
```

**Response**: `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "configuration",
  "name": "app-settings",
  "json": {
    "theme": "dark",
    "language": "en"
  },
  "version": 1,
  "isActive": true,
  "created": "2024-01-15T10:30:00Z",
  "updated": "2024-01-15T10:30:00Z"
}
```

**Error Responses**:
- `409 Conflict`: Metadata with same (type, name) already exists
- `400 Bad Request`: Invalid request body or JSON

### 2. Create New Version

**Endpoint**: `POST /metadata/{type}/{name}/versions`

**Description**: Creates a new version of existing metadata. The new version is created as inactive.

**Request Body**:
```json
{
  "json": {
    "theme": "light",
    "language": "en",
    "notifications": true
  }
}
```

**Response**: `201 Created`
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "type": "configuration",
  "name": "app-settings",
  "json": {
    "theme": "light",
    "language": "en",
    "notifications": true
  },
  "version": 2,
  "isActive": false,
  "created": "2024-01-15T11:00:00Z",
  "updated": "2024-01-15T11:00:00Z"
}
```

**Error Responses**:
- `404 Not Found`: Metadata (type, name) doesn't exist
- `400 Bad Request`: Invalid JSON

### 3. Activate Version

**Endpoint**: `POST /metadata/{type}/{name}/versions/{version}/activate`

**Description**: Activates a specific version and deactivates all other versions of the same (type, name).

**Response**: `200 OK`
```json
{
  "message": "Version 2 activated successfully",
  "metadata": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "type": "configuration",
    "name": "app-settings",
    "version": 2,
    "isActive": true
  }
}
```

**Error Responses**:
- `404 Not Found`: Version doesn't exist
- `409 Conflict`: Version is already active

### 4. List All Versions

**Endpoint**: `GET /metadata/{type}/{name}/versions`

**Description**: Returns all versions of a specific metadata entry, sorted by version number.

**Response**: `200 OK`
```json
{
  "type": "configuration",
  "name": "app-settings",
  "totalVersions": 3,
  "activeVersion": 2,
  "versions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "version": 1,
      "isActive": false,
      "created": "2024-01-15T10:30:00Z",
      "updated": "2024-01-15T10:30:00Z",
      "json": { "theme": "dark", "language": "en" }
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "version": 2,
      "isActive": true,
      "created": "2024-01-15T11:00:00Z",
      "updated": "2024-01-15T11:00:00Z",
      "json": { "theme": "light", "language": "en", "notifications": true }
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "version": 3,
      "isActive": false,
      "created": "2024-01-15T12:00:00Z",
      "updated": "2024-01-15T12:00:00Z",
      "json": { "theme": "auto", "language": "es", "notifications": false }
    }
  ]
}
```

**Error Responses**:
- `404 Not Found`: No metadata found for (type, name)

### 5. Get Metadata by ID

**Endpoint**: `GET /metadata/{id}`

**Description**: Retrieves a specific metadata entry by its unique ID.

**Response**: `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "configuration",
  "name": "app-settings",
  "json": {
    "theme": "dark",
    "language": "en"
  },
  "version": 1,
  "isActive": false,
  "created": "2024-01-15T10:30:00Z",
  "updated": "2024-01-15T10:30:00Z"
}
```

**Error Responses**:
- `404 Not Found`: Metadata with ID doesn't exist
- `400 Bad Request`: Invalid UUID format

### 6. List Metadata with Filters

**Endpoint**: `GET /metadata`

**Query Parameters**:
- `type` (optional): Filter by metadata type
- `name` (optional): Filter by metadata name (partial match)
- `activeOnly` (optional, boolean): Return only active versions
- `page` (optional, default: 0): Page number
- `size` (optional, default: 20): Page size
- `sort` (optional, default: "updated,desc"): Sort field and direction

**Response**: `200 OK`
```json
{
  "content": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "type": "configuration",
      "name": "app-settings",
      "version": 2,
      "isActive": true,
      "created": "2024-01-15T11:00:00Z",
      "updated": "2024-01-15T11:00:00Z",
      "json": { "theme": "light", "language": "en" }
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "type": "configuration",
      "name": "db-settings",
      "version": 1,
      "isActive": true,
      "created": "2024-01-15T13:00:00Z",
      "updated": "2024-01-15T13:00:00Z",
      "json": { "host": "localhost", "port": 5432 }
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": {
      "sorted": true,
      "ascending": false
    }
  },
  "totalElements": 2,
  "totalPages": 1,
  "first": true,
  "last": true
}
```

### 7. Delete Version (Optional)

**Endpoint**: `DELETE /metadata/{id}`

**Description**: Deletes a specific metadata version. Cannot delete active versions.

**Response**: `204 No Content`

**Error Responses**:
- `404 Not Found`: Metadata doesn't exist
- `409 Conflict`: Cannot delete active version
- `400 Bad Request`: Invalid UUID

## Versioning Rules

1. **Initial Creation**: First metadata entry always starts with version 1 and is automatically activated
2. **Version Increment**: New versions are always `previousVersion + 1`
3. **Active Version**: Only one version can be active per (type, name) combination
4. **Version Immutability**: Once created, version content cannot be modified
5. **Sequential Versioning**: Versions must be sequential without gaps
6. **Deactivation**: When activating a version, all other versions are automatically deactivated

## HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, POST (activate) |
| 201 | Created | Successful POST (create) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input, malformed JSON |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource, constraint violation |
| 422 | Unprocessable Entity | Valid JSON but semantic errors |
| 500 | Internal Server Error | Unexpected server error |

## Database Schema

### PostgreSQL Table Definition

```sql
CREATE TABLE metadata_entry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    json JSONB NOT NULL,
    version INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_metadata_entry_type_name_version UNIQUE (type, name, version),
    CONSTRAINT chk_version_positive CHECK (version > 0)
);

CREATE INDEX idx_metadata_entry_type_name_active ON metadata_entry (type, name, is_active);
CREATE INDEX idx_metadata_entry_type ON metadata_entry (type);
CREATE INDEX idx_metadata_entry_name ON metadata_entry (name);
CREATE INDEX idx_metadata_entry_active ON metadata_entry (is_active) WHERE is_active = true;
CREATE INDEX idx_metadata_entry_json ON metadata_entry USING GIN (json);
```

## Error Response Format

All error responses follow a consistent format:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "status": 409,
  "error": "Conflict",
  "message": "Metadata with type 'configuration' and name 'app-settings' already exists",
  "path": "/metadata"
}
```

## Security Considerations

1. **Input Validation**: All inputs are validated for type, length, and format
2. **JSON Validation**: JSON payloads are validated for structure and size limits
3. **SQL Injection Protection**: Use of parameterized queries via JPA
4. **UUID Generation**: Server-side UUID generation for security
5. **Rate Limiting**: Implement rate limiting per client IP
6. **CORS**: Configure appropriate CORS policies
7. **Authentication**: Implement OAuth2/JWT authentication (not covered in base spec)

## Performance Optimization

1. **Indexes**: Strategic indexes on frequently queried columns
2. **JSONB**: Native PostgreSQL JSONB for efficient JSON operations
3. **Pagination**: Default pagination for list endpoints
4. **Connection Pooling**: HikariCP for efficient database connections
5. **Caching**: Consider Redis for frequently accessed active versions
6. **Batch Operations**: Support for bulk operations (future enhancement)

## Future Enhancements

1. **Bulk Operations**: Create/update multiple metadata entries
2. **Diff Comparison**: Compare differences between versions
3. **Rollback**: Quick rollback to previous version
4. **Tags/Labels**: Add tagging system for metadata
5. **Search**: Full-text search within JSON content
6. **Webhooks**: Notifications on version changes
7. **Import/Export**: Backup and restore functionality
8. **Audit Log**: Detailed audit trail with user tracking