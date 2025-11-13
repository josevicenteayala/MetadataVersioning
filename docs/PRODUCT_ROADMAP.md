# MetadataVersioning - Product Roadmap

## Overview

This roadmap outlines the phased delivery of MetadataVersioning, starting with core API functionality and progressing to a full-featured user interface. The approach prioritizes early value delivery to integrators while building toward a comprehensive solution for business users.

## Release Strategy

### MVP 1: API-First Delivery
**Goal**: Enable programmatic metadata management for technical integrators  
**Timeline**: TBD  
**Target Audience**: Backend developers, integration teams, DevOps

### MVP 2: UI Experience
**Goal**: Empower non-technical business users with guided editing  
**Timeline**: TBD (After MVP 1)  
**Target Audience**: Business owners, product managers, campaign managers

### Post-MVP: Enhancement Phase
**Goal**: Advanced features based on customer feedback  
**Timeline**: TBD (Iterative)  
**Target Audience**: All users plus enterprise customers

---

## MVP 1 - API-First Delivery

### Core Features

#### 1. Document Management API
**Description**: RESTful endpoints for CRUD operations on metadata documents

**Endpoints**:
- `POST /api/v1/topics/{topicId}/documents` - Create new document
- `GET /api/v1/documents/{documentId}` - Retrieve current version
- `GET /api/v1/documents/{documentId}/versions/{versionNumber}` - Get specific version
- `PUT /api/v1/documents/{documentId}` - Update document (creates new version)
- `DELETE /api/v1/documents/{documentId}` - Soft delete document

**Input Validation**:
- Schema-aware validation against topic schema
- Custom property validation (naming, depth, type)
- Required field enforcement
- Data type constraints

**Output**:
- Document ID and version ID on create/update
- Full version metadata (author, timestamp, state)
- Validation errors with field-level detail

**Priority**: P0 (Blocker)

#### 2. Version History Management
**Description**: Retrieve and navigate document version timeline

**Endpoints**:
- `GET /api/v1/documents/{documentId}/versions` - List all versions (paginated)
- `GET /api/v1/documents/{documentId}/versions/{versionNumber}` - Get specific version content
- `POST /api/v1/documents/{documentId}/versions/{versionNumber}/rollback` - Create new version from previous

**Features**:
- Pagination (default 50 versions per page)
- Filtering by date range, author, state
- Sorting by version number (asc/desc), timestamp
- Metadata includes: author, timestamp, state, comment, diff summary

**Priority**: P0 (Blocker)

#### 3. Version Comparison Service
**Description**: Generate human-friendly diffs between any two versions

**Endpoints**:
- `GET /api/v1/documents/{documentId}/compare?from={v1}&to={v2}` - Compare versions

**Diff Output**:
- Added fields (with values)
- Removed fields (with previous values)
- Modified fields (old → new values)
- Nested changes with full path
- Breaking vs. additive change categorization
- Change summary statistics (counts by type)

**Formats**:
- JSON structured diff (default)
- JSON Patch (RFC 6902) format (optional)

**Priority**: P0 (Blocker)

#### 4. Authentication & Authorization
**Description**: Secure API access with role-based permissions

**Authentication**:
- OAuth 2.0 integration with identity provider
- JWT bearer tokens for stateless authentication
- Token refresh mechanism
- API key support for service-to-service calls

**Authorization**:
- Role-based access control (RBAC)
- Permissions: read, create, update, delete, publish, admin
- Topic-level permission enforcement
- User context available in all operations

**Roles** (Initial):
- **Viewer**: Read documents and versions
- **Editor**: Create and update documents (draft state only)
- **Approver**: Publish versions to production
- **Admin**: Manage topics, schemas, and user permissions

**Priority**: P0 (Blocker)

#### 5. Topic & Schema Management
**Description**: Define and manage topic schemas

**Endpoints**:
- `GET /api/v1/topics` - List all topics
- `GET /api/v1/topics/{topicId}` - Get topic details including schema
- `POST /api/v1/topics` - Create new topic (admin only)
- `PUT /api/v1/topics/{topicId}/schema` - Update topic schema (admin only)

**Schema Features**:
- JSON Schema (Draft 7) for validation
- Required and optional field definitions
- Custom property extension points
- Schema versioning support
- Backward compatibility validation

**Priority**: P0 (Blocker)

#### 6. API Documentation
**Description**: Comprehensive documentation for integrators

**Deliverables**:
- OpenAPI 3.0 specification
- Interactive API explorer (Swagger UI / Redoc)
- Postman collection with example requests
- Authentication setup guide
- Error code reference
- Rate limiting documentation

**Examples**:
- Creating a loyalty offer document
- Comparing two campaign versions
- Publishing an approved version
- Handling validation errors

**Priority**: P1 (High)

### Implementation Technology Stack

#### Backend (Java 21 + Spring Boot 3.3)
**Framework & Core**:
- Spring Boot 3.3 (full Java 21 support)
- Spring Web (REST API implementation)
- Spring Data JPA (data persistence)
- Spring Security (OAuth2 resource server)
- Spring Validation (Bean Validation API)

**Database & Persistence**:
- PostgreSQL 15+ with JSONB support
- Flyway or Liquibase for database migrations
- HikariCP connection pooling

**Validation & JSON Processing**:
- JSON Schema Validator (everit-json-schema or networknt)
- Jackson for JSON serialization
- Hibernate Validator for bean validation

**Documentation & Testing**:
- SpringDoc OpenAPI (Swagger UI generation)
- JUnit 5 with Mockito for testing
- TestContainers for integration tests
- RestAssured for API testing

**Rationale**: 
- Virtual threads (Project Loom) for high-concurrency without complex async code
- Strong typing reduces runtime errors
- Mature ecosystem with excellent JSON/database support
- Enterprise-grade security and observability built-in

#### Technology Decisions

**Why Java 21?**
- Virtual threads enable 10,000+ concurrent requests with simple code
- Pattern matching and records improve code clarity
- Long-term support (LTS) ensures stability
- Excellent tooling and IDE support

**Why Spring Boot 3.3?**
- First version with full Java 21 compatibility
- Native virtual thread support in web layer
- Comprehensive starter dependencies reduce configuration
- Production-ready features (Actuator, Security, Data)
- Large community and extensive documentation

**Why PostgreSQL with JSONB?**
- ACID guarantees for version immutability
- Native JSONB type for efficient JSON storage and querying
- GIN indexes for fast JSON field searches
- Strong consistency for audit trail requirements

### Non-Functional Requirements

#### Performance
- API response time: <500ms for CRUD operations (p95)
- Compare operation: <3s for documents up to 1MB (p95)
- History listing: <1s for paginated results (p95)
- Concurrent users: Support 100 simultaneous API requests

#### Reliability
- API availability: 99.5% uptime SLA
- Data durability: 99.999% (no data loss)
- Transaction consistency: ACID guarantees for version creation
- Graceful degradation: Read operations available during maintenance

#### Security
- TLS 1.3 for all API communication
- Token expiry: 15 minutes (access), 7 days (refresh)
- Audit logging for all mutations
- Secrets management via environment variables / vault

#### Observability
- Structured JSON logs with correlation IDs
- Metrics: API latency, error rates, validation failures
- Distributed tracing across service boundaries
- Health check endpoint: `GET /health`

### Success Criteria

- [ ] 10 successful integrations with downstream systems
- [ ] API response times meet SLA for 95% of requests
- [ ] Zero critical security vulnerabilities
- [ ] Zero data loss incidents
- [ ] Complete API documentation with examples
- [ ] Postman collection validated by 5 external developers

### Dependencies

- Identity provider integration (Auth0 / Okta / Azure AD)
- Database provisioning (PostgreSQL / MongoDB)
- Schema registry setup
- Development environment setup
- CI/CD pipeline configuration

---

## MVP 2 - UI Experience

### Core Features

#### 1. Rich JSON Editor
**Description**: Business-friendly editor with schema-driven controls

**Components**:
- **Schema-based form renderer**: Convert JSON Schema to UI controls
  - Text inputs for strings
  - Number spinners for integers/floats
  - Dropdowns for enums
  - Checkboxes for booleans
  - Date pickers for date/datetime fields
  - Nested object editors with expand/collapse
  - Array editors with add/remove controls

- **Custom property panel**: Separate section for extension fields
  - Dynamic add/remove custom fields
  - Type selection (string, number, boolean, object)
  - Naming validation (e.g., no spaces, camelCase)
  - Depth limit enforcement

- **Inline validation**: Real-time feedback as user types
  - Required field indicators
  - Format validation (email, URL, regex patterns)
  - Range validation (min/max)
  - Human-readable error messages

- **Dual mode**: Toggle between guided form and raw JSON editor
  - Power users can edit JSON directly
  - Changes sync bidirectionally
  - Syntax highlighting and auto-completion in JSON mode

**Priority**: P0 (Blocker)

#### 2. Version Browser
**Description**: Visual timeline and history explorer

**Features**:
- **Timeline view**: Chronological list of versions
  - Version number, timestamp, author
  - Change summary (added/removed/modified counts)
  - Publishing state badge (draft, approved, published)
  - Inline comments from authors

- **Version details panel**: Expand to see full metadata
  - Complete change description
  - Approver information (if published)
  - Rollback button for reverting
  - Promote button for advancing state

- **Pagination**: Navigate through version history
  - Load more / infinite scroll
  - Jump to version number
  - Filter by author, date range, state

**Priority**: P0 (Blocker)

#### 3. Side-by-Side Diff Viewer
**Description**: Visual comparison of two versions

**Features**:
- **Split view**: Two columns showing old vs. new
  - Left: Previous version
  - Right: Current version
  - Synchronized scrolling

- **Color coding**:
  - Green: Added fields
  - Red: Removed fields
  - Yellow: Modified values
  - Gray: Unchanged fields

- **Change navigation**: Jump to next/previous change
- **Expand/collapse**: Focus on relevant sections
- **Export**: Download diff as PDF or JSON
- **Breaking change warnings**: Highlight critical differences

**Priority**: P1 (High)

#### 4. Guided Templates
**Description**: Pre-filled starting points for common topics

**Template Gallery**:
- **Loyalty Offer Template**: Pre-populated loyalty program structure
- **Retail Campaign Template**: Marketing campaign defaults
- **Coupon Template**: Discount coupon configuration
- **Custom Template**: Start from empty schema

**Features**:
- Template preview before selection
- Description and use case explanation
- Sample values and field hints
- One-click instantiation

**Priority**: P1 (High)

#### 5. Workflow Actions
**Description**: State management and approval flows

**Actions**:
- **Save as Draft**: Store without validation (soft save)
- **Validate**: Check against schema without saving
- **Submit for Approval**: Mark as ready for review
- **Approve**: Move to approved state (requires Approver role)
- **Publish**: Promote to production (requires Approver role)
- **Rollback**: Create new version from previous content
- **Archive**: Soft delete document

**UI Elements**:
- Action buttons contextual to current state
- Confirmation dialogs for destructive actions
- Progress indicators for async operations
- Success/error notifications

**Priority**: P1 (High)

#### 6. Search & Discovery
**Description**: Find documents and versions quickly

**Features**:
- **Full-text search**: Across document content
- **Filters**: By topic, author, state, date range
- **Sort options**: Recent, alphabetical, version count
- **Saved searches**: Bookmark common queries
- **Search suggestions**: Autocomplete based on history

**Priority**: P2 (Medium)

### UI/UX Principles

#### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

#### Responsiveness
- Desktop-optimized (primary)
- Tablet support (secondary)
- Mobile view (read-only, tertiary)

#### Performance
- Initial page load: <3s
- Time to interactive: <5s
- Smooth scrolling (60 fps)
- Optimistic UI updates

### Implementation Technology Stack

#### Frontend (React 18 + TypeScript)

**Core Framework**:
- **React 18+** with TypeScript 5+
- **Vite** for fast builds and HMR (Hot Module Replacement)
- **React Router** for navigation

**JSON Editing & Visualization**:
- **@monaco-editor/react** - Rich code editor (VSCode engine) for advanced JSON editing
  - Syntax highlighting, autocomplete, validation
  - Multi-cursor editing, search/replace
- **jsoneditor-react** - Alternative user-friendly editor with tree/code/preview modes
- **react-json-schema-form** - Auto-generate forms from JSON schemas
- **React Diff Viewer** - Side-by-side version comparison with syntax highlighting

**State Management**:
- **React Query (TanStack Query)** - Server state, caching, and synchronization
- **Zustand** - Lightweight client state management (if needed)

**UI Component Library**:
- **Material-UI (MUI)** or **Ant Design** - Comprehensive component library
  - Business-friendly controls (date pickers, dropdowns, checkboxes)
  - Responsive design and accessibility built-in
  - Theme customization

**Form Handling & Validation**:
- **React Hook Form** - Performant forms with minimal re-renders
- **Zod** or **Yup** - Schema validation integrated with forms
- **ajv** - Client-side JSON Schema validation

**API Integration**:
- **Axios** or native **Fetch API** with React Query
- **OpenAPI TypeScript Codegen** - Generate type-safe API clients from OpenAPI spec

**Developer Tools**:
- **ESLint** + **Prettier** - Code quality and formatting
- **Vitest** - Fast unit testing
- **React Testing Library** - Component testing
- **Cypress** or **Playwright** - E2E testing

**Rationale**:
- React's component model naturally fits JSON document editing
- TypeScript prevents common errors with complex JSON structures
- Monaco Editor provides professional-grade JSON editing experience
- React Query simplifies server state and caching without boilerplate
- Material-UI/Ant Design provide business-friendly controls out of the box
- `react-jsonschema-form` can auto-generate UIs from schemas, reducing development time

#### Why React + TypeScript?

**JSON-Centric Design**:
- Component props naturally map to JSON structures
- Rich ecosystem of JSON editor components
- Libraries like `react-jsonschema-form` auto-generate forms from schemas

**Type Safety**:
- TypeScript catches errors at compile time
- Auto-generated types from OpenAPI spec ensure API consistency
- Strong typing for complex nested JSON structures

**Developer Experience**:
- Vite provides instant feedback during development
- Hot Module Replacement preserves application state
- Extensive tooling and IDE support
- Large community with solutions to common problems

**User Experience**:
- Monaco Editor provides VSCode-quality editing in the browser
- React Query handles caching, reducing API calls
- Component libraries provide accessible, responsive controls
- Fast page loads and smooth interactions

### Success Criteria

- [ ] 20 business users successfully create/edit documents without developer help
- [ ] Average task completion time <5 minutes for simple edits
- [ ] User satisfaction score >4.0/5.0
- [ ] <3 support tickets per week related to UI confusion
- [ ] Zero critical accessibility violations
- [ ] Page load time <3s for 95% of users

---

## Post-MVP Enhancements

### Phase 3: Collaboration & Workflow

**Features**:
- Multi-stage approval workflows (configurable)
- Comments and discussions on specific versions
- @mentions and notifications
- Concurrent edit detection and conflict resolution
- Version locking during review
- Activity feed per document

**Timeline**: TBD  
**Priority**: Based on user feedback

### Phase 4: Integration & Automation

**Features**:
- Webhooks for version change notifications
- Batch import/export (CSV, Excel, JSON)
- CLI tools for CI/CD integration
- SDKs for Java, Python, Node.js, .NET
- Bidirectional sync with downstream systems
- GraphQL API as alternative to REST

**Timeline**: TBD  
**Priority**: Based on integration partner demand

### Phase 5: Intelligence & Insights

**Features**:
- AI-powered suggestions for schema extensions
- Automatic change summary generation
- Template recommendations based on usage
- Anomaly detection in metadata patterns
- Usage analytics dashboard
- Compliance reporting and audit exports

**Timeline**: TBD  
**Priority**: Based on enterprise customer requirements

### Phase 6: Enterprise Features

**Features**:
- Multi-tenancy with isolated environments
- Advanced RBAC with conditional access
- Custom SLA tiers with guaranteed performance
- Dedicated support and onboarding
- White-label UI options
- On-premises deployment option

**Timeline**: TBD  
**Priority**: Based on enterprise sales pipeline

---

## Release Checklist Template

### Pre-Release
- [ ] All P0 features implemented and tested
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] API documentation published
- [ ] Migration scripts tested (if applicable)
- [ ] Rollback plan documented
- [ ] Monitoring dashboards configured
- [ ] Runbooks created for common issues

### Release Day
- [ ] Deploy to staging and verify
- [ ] Run smoke tests
- [ ] Deploy to production (blue-green / canary)
- [ ] Monitor error rates and latency
- [ ] Verify integrations functional
- [ ] Send release announcement

### Post-Release
- [ ] Monitor for 24 hours
- [ ] Collect user feedback
- [ ] Address critical issues immediately
- [ ] Schedule retrospective
- [ ] Update documentation with lessons learned
- [ ] Plan next iteration

---

## Feedback & Iteration

### Feedback Channels
- User interviews (monthly)
- In-app feedback widget
- Support ticket analysis
- API usage analytics
- Performance monitoring
- Feature request tracking (GitHub Issues / Jira)

### Metrics to Track
- API adoption rate (unique clients per month)
- UI active users (DAU / MAU)
- Version creation rate (versions per document)
- Time to first value (account creation → first version published)
- Feature usage (which endpoints / UI features most used)
- Support ticket volume and resolution time

### Prioritization Framework
1. **Critical bugs**: Fix immediately
2. **P0 features**: Must-have for MVP success
3. **User-requested enhancements**: High vote count
4. **Technical debt**: Balance with feature work
5. **Nice-to-have features**: Backlog for future

---

_This roadmap is a living document and will be updated based on user feedback, technical discoveries, and business priorities. For architectural details, see [ARCHITECTURE.md](./ARCHITECTURE.md). For product vision, see [VISION.md](./VISION.md)._
