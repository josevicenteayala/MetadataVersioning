# JsonVersionManager - API Reference

## Overview

The JsonVersionManager REST API provides programmatic access to metadata document management, versioning, and comparison capabilities. All endpoints follow RESTful conventions and return JSON responses.

**Base URL**: `https://api.jsonversionmanager.com/v1` (TBD)

**API Version**: v1 (Current)

**Content Type**: `application/json`

**Rate Limits**: TBD (likely 1000 requests/hour per user)

---

## Authentication

### OAuth 2.0 Flow

JsonVersionManager uses OAuth 2.0 for authentication with JWT bearer tokens.

#### 1. Obtain Access Token

**Endpoint**: `POST /auth/token`

**Request**:
```http
POST /auth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&scope=documents:read documents:write
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "fdb8fdbecf1d03ce5e6125c067733c0d51de209c",
  "scope": "documents:read documents:write"
}
```

#### 2. Use Access Token

Include the access token in the `Authorization` header for all API requests:

```http
GET /api/v1/documents/123
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 3. Refresh Token

**Endpoint**: `POST /auth/token`

**Request**:
```http
POST /auth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=fdb8fdbecf1d03ce5e6125c067733c0d51de209c
```

**Response**: Same as initial token response with new tokens.

### API Keys (Alternative)

For service-to-service integration, API keys can be used:

```http
GET /api/v1/documents/123
X-API-Key: your_api_key_here
```

**Note**: API keys have longer expiration but should be rotated regularly.

---

## Topics

### List Topics

Retrieve all available topics.

**Endpoint**: `GET /api/v1/topics`

**Query Parameters**:
- `page` (integer, optional): Page number (default: 1)
- `per_page` (integer, optional): Results per page (default: 50, max: 100)

**Request**:
```http
GET /api/v1/topics?page=1&per_page=20
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "loyalty",
      "name": "Loyalty Programs",
      "description": "Metadata for customer loyalty offers and rewards",
      "schema_version": "2.1.0",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2025-03-20T14:30:00Z"
    },
    {
      "id": "retail",
      "name": "Retail Campaigns",
      "description": "Marketing campaign configurations",
      "schema_version": "1.5.2",
      "created_at": "2024-02-01T09:00:00Z",
      "updated_at": "2025-02-10T11:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 4,
    "total_pages": 1
  }
}
```

### Get Topic Details

Retrieve details for a specific topic including its schema.

**Endpoint**: `GET /api/v1/topics/{topicId}`

**Path Parameters**:
- `topicId` (string, required): Topic identifier

**Request**:
```http
GET /api/v1/topics/loyalty
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "id": "loyalty",
  "name": "Loyalty Programs",
  "description": "Metadata for customer loyalty offers and rewards",
  "schema_version": "2.1.0",
  "schema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "required": ["offerName", "discount"],
    "properties": {
      "offerName": {
        "type": "string",
        "minLength": 1,
        "maxLength": 100
      },
      "description": {
        "type": "string"
      },
      "discount": {
        "type": "object",
        "required": ["type", "value"],
        "properties": {
          "type": {
            "type": "string",
            "enum": ["percentage", "fixed"]
          },
          "value": {
            "type": "number",
            "minimum": 0
          }
        }
      },
      "validFrom": {
        "type": "string",
        "format": "date"
      },
      "validTo": {
        "type": "string",
        "format": "date"
      },
      "active": {
        "type": "boolean",
        "default": true
      },
      "customProperties": {
        "type": "object"
      }
    }
  },
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2025-03-20T14:30:00Z"
}
```

**Error Responses**:
- `404 Not Found`: Topic does not exist

---

## Documents

### Create Document

Create a new metadata document for a topic.

**Endpoint**: `POST /api/v1/topics/{topicId}/documents`

**Path Parameters**:
- `topicId` (string, required): Topic identifier

**Request Body**:
```json
{
  "content": {
    "offerName": "Black Friday Special",
    "description": "Limited time offer for Black Friday",
    "discount": {
      "type": "percentage",
      "value": 25
    },
    "validFrom": "2025-11-28",
    "validTo": "2025-11-30",
    "active": true,
    "customProperties": {
      "campaignId": "BF2025",
      "internalCode": "PROMO-BF-001"
    }
  },
  "comment": "Initial version for Black Friday promotion"
}
```

**Request**:
```http
POST /api/v1/topics/loyalty/documents
Authorization: Bearer {token}
Content-Type: application/json

{...}
```

**Response** (201 Created):
```json
{
  "document_id": "doc_a1b2c3d4e5f6",
  "version_id": "ver_123456789",
  "version_number": 1,
  "topic_id": "loyalty",
  "state": "DRAFT",
  "created_at": "2025-11-11T10:00:00Z",
  "created_by": "user@example.com",
  "message": "Document created successfully"
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors
- `404 Not Found`: Topic does not exist
- `403 Forbidden`: User lacks permission to create documents

**Validation Error Example**:
```json
{
  "error": "ValidationError",
  "message": "Document validation failed",
  "details": [
    {
      "field": "discount.value",
      "message": "must be a number",
      "value": "twenty-five"
    },
    {
      "field": "offerName",
      "message": "is required"
    }
  ]
}
```

### Get Document (Current Version)

Retrieve the latest version of a document.

**Endpoint**: `GET /api/v1/documents/{documentId}`

**Path Parameters**:
- `documentId` (string, required): Document identifier

**Request**:
```http
GET /api/v1/documents/doc_a1b2c3d4e5f6
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "document_id": "doc_a1b2c3d4e5f6",
  "topic_id": "loyalty",
  "current_version": 3,
  "content": {
    "offerName": "Black Friday Special",
    "description": "Limited time offer for Black Friday",
    "discount": {
      "type": "percentage",
      "value": 25
    },
    "validFrom": "2025-11-28",
    "validTo": "2025-11-30",
    "active": true,
    "customProperties": {
      "campaignId": "BF2025",
      "internalCode": "PROMO-BF-001"
    }
  },
  "version_metadata": {
    "version_id": "ver_123456791",
    "version_number": 3,
    "state": "PUBLISHED",
    "created_at": "2025-11-11T14:30:00Z",
    "created_by": "user@example.com",
    "comment": "Final adjustments before launch"
  },
  "created_at": "2025-11-11T10:00:00Z"
}
```

**Error Responses**:
- `404 Not Found`: Document does not exist
- `403 Forbidden`: User lacks permission to view document

### Update Document

Create a new version of an existing document.

**Endpoint**: `PUT /api/v1/documents/{documentId}`

**Path Parameters**:
- `documentId` (string, required): Document identifier

**Request Body**:
```json
{
  "content": {
    "offerName": "Black Friday Special - Extended",
    "description": "Extended Black Friday offer",
    "discount": {
      "type": "percentage",
      "value": 30
    },
    "validFrom": "2025-11-28",
    "validTo": "2025-12-02",
    "active": true,
    "customProperties": {
      "campaignId": "BF2025_EXT",
      "internalCode": "PROMO-BF-001"
    }
  },
  "comment": "Extended date and increased discount",
  "expected_version": 3
}
```

**Request**:
```http
PUT /api/v1/documents/doc_a1b2c3d4e5f6
Authorization: Bearer {token}
Content-Type: application/json

{...}
```

**Response** (200 OK):
```json
{
  "document_id": "doc_a1b2c3d4e5f6",
  "version_id": "ver_123456792",
  "version_number": 4,
  "state": "DRAFT",
  "created_at": "2025-11-12T09:00:00Z",
  "created_by": "user@example.com",
  "diff_summary": {
    "added": 0,
    "modified": 3,
    "removed": 0
  },
  "message": "Version created successfully"
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors
- `404 Not Found`: Document does not exist
- `409 Conflict`: Version conflict (expected_version doesn't match current)
- `403 Forbidden`: User lacks permission to update document

### Delete Document

Soft delete a document (marks as archived).

**Endpoint**: `DELETE /api/v1/documents/{documentId}`

**Path Parameters**:
- `documentId` (string, required): Document identifier

**Request**:
```http
DELETE /api/v1/documents/doc_a1b2c3d4e5f6
Authorization: Bearer {token}
```

**Response** (204 No Content)

**Error Responses**:
- `404 Not Found`: Document does not exist
- `403 Forbidden`: User lacks permission to delete document

---

## Versions

### List Document Versions

Retrieve version history for a document.

**Endpoint**: `GET /api/v1/documents/{documentId}/versions`

**Path Parameters**:
- `documentId` (string, required): Document identifier

**Query Parameters**:
- `page` (integer, optional): Page number (default: 1)
- `per_page` (integer, optional): Results per page (default: 50, max: 100)
- `state` (string, optional): Filter by state (DRAFT, APPROVED, PUBLISHED, ARCHIVED)
- `author` (string, optional): Filter by author email
- `from_date` (string, optional): Filter versions created after date (ISO 8601)
- `to_date` (string, optional): Filter versions created before date (ISO 8601)

**Request**:
```http
GET /api/v1/documents/doc_a1b2c3d4e5f6/versions?page=1&per_page=10&state=PUBLISHED
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "document_id": "doc_a1b2c3d4e5f6",
  "versions": [
    {
      "version_id": "ver_123456792",
      "version_number": 4,
      "state": "PUBLISHED",
      "created_at": "2025-11-12T09:00:00Z",
      "created_by": "user@example.com",
      "comment": "Extended date and increased discount",
      "diff_summary": {
        "added": 0,
        "modified": 3,
        "removed": 0
      }
    },
    {
      "version_id": "ver_123456791",
      "version_number": 3,
      "state": "PUBLISHED",
      "created_at": "2025-11-11T14:30:00Z",
      "created_by": "user@example.com",
      "comment": "Final adjustments before launch",
      "diff_summary": {
        "added": 1,
        "modified": 2,
        "removed": 0
      }
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 4,
    "total_pages": 1
  }
}
```

### Get Specific Version

Retrieve a specific version of a document.

**Endpoint**: `GET /api/v1/documents/{documentId}/versions/{versionNumber}`

**Path Parameters**:
- `documentId` (string, required): Document identifier
- `versionNumber` (integer, required): Version number

**Request**:
```http
GET /api/v1/documents/doc_a1b2c3d4e5f6/versions/2
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "version_id": "ver_123456790",
  "version_number": 2,
  "document_id": "doc_a1b2c3d4e5f6",
  "topic_id": "loyalty",
  "state": "APPROVED",
  "content": {
    "offerName": "Black Friday Special",
    "description": "Limited time offer for Black Friday",
    "discount": {
      "type": "percentage",
      "value": 20
    },
    "validFrom": "2025-11-28",
    "validTo": "2025-11-30",
    "active": true
  },
  "created_at": "2025-11-11T12:00:00Z",
  "created_by": "user@example.com",
  "comment": "Increased discount percentage",
  "approved_at": "2025-11-11T13:00:00Z",
  "approved_by": "approver@example.com"
}
```

**Error Responses**:
- `404 Not Found`: Document or version does not exist
- `403 Forbidden`: User lacks permission to view version

### Compare Versions

Generate a diff between two versions.

**Endpoint**: `GET /api/v1/documents/{documentId}/compare`

**Path Parameters**:
- `documentId` (string, required): Document identifier

**Query Parameters**:
- `from` (integer, required): Source version number
- `to` (integer, required): Target version number
- `format` (string, optional): Response format (`structured` or `json-patch`, default: `structured`)

**Request**:
```http
GET /api/v1/documents/doc_a1b2c3d4e5f6/compare?from=2&to=4
Authorization: Bearer {token}
```

**Response** (200 OK) - Structured Format:
```json
{
  "document_id": "doc_a1b2c3d4e5f6",
  "from_version": 2,
  "to_version": 4,
  "comparison": {
    "added": [
      {
        "path": "customProperties.campaignId",
        "value": "BF2025_EXT"
      }
    ],
    "removed": [],
    "modified": [
      {
        "path": "offerName",
        "old_value": "Black Friday Special",
        "new_value": "Black Friday Special - Extended"
      },
      {
        "path": "discount.value",
        "old_value": 20,
        "new_value": 30
      },
      {
        "path": "validTo",
        "old_value": "2025-11-30",
        "new_value": "2025-12-02"
      }
    ],
    "unchanged": [
      "description",
      "discount.type",
      "validFrom",
      "active",
      "customProperties.internalCode"
    ]
  },
  "summary": {
    "added": 1,
    "removed": 0,
    "modified": 3,
    "unchanged": 5,
    "breaking_changes": 0
  },
  "breaking_changes": []
}
```

**Response** (200 OK) - JSON Patch Format (RFC 6902):
```json
{
  "document_id": "doc_a1b2c3d4e5f6",
  "from_version": 2,
  "to_version": 4,
  "patch": [
    {
      "op": "replace",
      "path": "/offerName",
      "value": "Black Friday Special - Extended"
    },
    {
      "op": "replace",
      "path": "/discount/value",
      "value": 30
    },
    {
      "op": "replace",
      "path": "/validTo",
      "value": "2025-12-02"
    },
    {
      "op": "add",
      "path": "/customProperties/campaignId",
      "value": "BF2025_EXT"
    }
  ]
}
```

**Error Responses**:
- `404 Not Found`: Document or versions do not exist
- `400 Bad Request`: Invalid version numbers or from >= to

### Rollback to Version

Create a new version with content from a previous version.

**Endpoint**: `POST /api/v1/documents/{documentId}/versions/{versionNumber}/rollback`

**Path Parameters**:
- `documentId` (string, required): Document identifier
- `versionNumber` (integer, required): Version number to rollback to

**Request Body**:
```json
{
  "comment": "Rolling back to version 2 due to issues with version 4"
}
```

**Request**:
```http
POST /api/v1/documents/doc_a1b2c3d4e5f6/versions/2/rollback
Authorization: Bearer {token}
Content-Type: application/json

{...}
```

**Response** (201 Created):
```json
{
  "document_id": "doc_a1b2c3d4e5f6",
  "version_id": "ver_123456793",
  "version_number": 5,
  "state": "DRAFT",
  "rollback_from_version": 2,
  "created_at": "2025-11-12T15:00:00Z",
  "created_by": "user@example.com",
  "message": "Version created from rollback"
}
```

**Error Responses**:
- `404 Not Found`: Document or target version does not exist
- `403 Forbidden`: User lacks permission to rollback

---

## Publishing & State Management

### Publish Version

Promote a version to published state.

**Endpoint**: `POST /api/v1/documents/{documentId}/versions/{versionNumber}/publish`

**Path Parameters**:
- `documentId` (string, required): Document identifier
- `versionNumber` (integer, required): Version number to publish

**Request Body**:
```json
{
  "comment": "Approved for production deployment"
}
```

**Request**:
```http
POST /api/v1/documents/doc_a1b2c3d4e5f6/versions/4/publish
Authorization: Bearer {token}
Content-Type: application/json

{...}
```

**Response** (200 OK):
```json
{
  "document_id": "doc_a1b2c3d4e5f6",
  "version_id": "ver_123456792",
  "version_number": 4,
  "state": "PUBLISHED",
  "published_at": "2025-11-12T16:00:00Z",
  "published_by": "approver@example.com",
  "message": "Version published successfully"
}
```

**Error Responses**:
- `404 Not Found`: Document or version does not exist
- `403 Forbidden`: User lacks Approver role
- `409 Conflict`: Version is not in APPROVED state

---

## Error Codes

### Standard HTTP Status Codes

| Code | Description | Use Case |
|------|-------------|----------|
| 200 | OK | Successful GET, PUT, or POST (non-creation) |
| 201 | Created | Successful POST (resource creation) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors, malformed request |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Version conflict, concurrent modification |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Temporary outage or maintenance |

### Error Response Format

All errors return a consistent JSON structure:

```json
{
  "error": "ErrorType",
  "message": "Human-readable error description",
  "details": {
    "field": "Optional field-specific details",
    "code": "ERROR_CODE"
  },
  "timestamp": "2025-11-12T16:00:00Z",
  "request_id": "req_xyz789"
}
```

**Example - Validation Error**:
```json
{
  "error": "ValidationError",
  "message": "Document validation failed",
  "details": [
    {
      "field": "discount.value",
      "message": "must be greater than or equal to 0",
      "value": -10
    }
  ],
  "timestamp": "2025-11-12T16:00:00Z",
  "request_id": "req_xyz789"
}
```

**Example - Permission Error**:
```json
{
  "error": "ForbiddenError",
  "message": "You do not have permission to publish versions",
  "details": {
    "required_role": "Approver",
    "user_role": "Editor"
  },
  "timestamp": "2025-11-12T16:00:00Z",
  "request_id": "req_xyz789"
}
```

---

## Rate Limiting

**Rate Limits**:
- 1000 requests per hour per user
- 100 requests per minute per user
- 10 concurrent requests per user

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1699876800
```

**Rate Limit Exceeded Response** (429):
```json
{
  "error": "RateLimitExceeded",
  "message": "You have exceeded the rate limit",
  "details": {
    "limit": 1000,
    "remaining": 0,
    "reset_at": "2025-11-12T17:00:00Z"
  },
  "timestamp": "2025-11-12T16:45:00Z",
  "request_id": "req_abc123"
}
```

---

## Webhooks (Future)

**Event Types** (Coming Soon):
- `document.created`
- `document.updated`
- `document.deleted`
- `version.published`
- `version.approved`

**Webhook Payload Example**:
```json
{
  "event": "version.published",
  "timestamp": "2025-11-12T16:00:00Z",
  "data": {
    "document_id": "doc_a1b2c3d4e5f6",
    "version_number": 4,
    "topic_id": "loyalty",
    "published_by": "approver@example.com"
  }
}
```

---

## Code Examples

### cURL

**Create Document**:
```bash
curl -X POST https://api.jsonversionmanager.com/v1/topics/loyalty/documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "offerName": "Summer Sale",
      "discount": {"type": "percentage", "value": 15}
    },
    "comment": "Initial version"
  }'
```

### Python

**Get Document**:
```python
import requests

url = "https://api.jsonversionmanager.com/v1/documents/doc_a1b2c3d4e5f6"
headers = {
    "Authorization": "Bearer YOUR_TOKEN"
}

response = requests.get(url, headers=headers)
document = response.json()

print(f"Document: {document['content']['offerName']}")
print(f"Version: {document['current_version']}")
```

### JavaScript (Node.js)

**Compare Versions**:
```javascript
const axios = require('axios');

async function compareVersions(docId, fromVer, toVer) {
  const url = `https://api.jsonversionmanager.com/v1/documents/${docId}/compare`;
  const params = { from: fromVer, to: toVer };
  const headers = { Authorization: `Bearer ${process.env.API_TOKEN}` };
  
  const response = await axios.get(url, { params, headers });
  return response.data;
}

compareVersions('doc_a1b2c3d4e5f6', 2, 4)
  .then(diff => {
    console.log(`Added: ${diff.summary.added}`);
    console.log(`Modified: ${diff.summary.modified}`);
    console.log(`Removed: ${diff.summary.removed}`);
  });
```

### Java

**Update Document**:
```java
import java.net.http.*;
import java.net.URI;

public class JsonVersionManagerClient {
    private static final String BASE_URL = "https://api.jsonversionmanager.com/v1";
    private final String token;
    
    public JsonVersionManagerClient(String token) {
        this.token = token;
    }
    
    public HttpResponse<String> updateDocument(String docId, String content, String comment) 
            throws Exception {
        String json = String.format(
            "{\"content\": %s, \"comment\": \"%s\"}", 
            content, comment
        );
        
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(BASE_URL + "/documents/" + docId))
            .header("Authorization", "Bearer " + token)
            .header("Content-Type", "application/json")
            .PUT(HttpRequest.BodyPublishers.ofString(json))
            .build();
        
        return HttpClient.newHttpClient().send(
            request, 
            HttpResponse.BodyHandlers.ofString()
        );
    }
}
```

---

## Postman Collection

A complete Postman collection with all endpoints and examples is available:

**Download**: [JsonVersionManager.postman_collection.json](#) (TBD)

**Collection includes**:
- All API endpoints
- Authentication setup
- Environment variables
- Example requests and responses
- Test scripts for validation

---

## OpenAPI Specification

Full OpenAPI 3.0 specification available at:

**URL**: `https://api.jsonversionmanager.com/v1/openapi.json` (TBD)

**Interactive Explorer**: `https://api.jsonversionmanager.com/docs` (TBD)

---

_For UI usage, see [UI_GUIDE.md](./UI_GUIDE.md). For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md)._
