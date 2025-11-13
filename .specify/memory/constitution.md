<!--
SYNC IMPACT REPORT
===================
Version Change: Initial → 1.0.0
Principles Created:
  - Code Quality & Architecture (Hexagonal Architecture, SOLID principles, type safety)
  - Testing Standards (TDD, test coverage requirements, test pyramid)
  - User Experience Consistency (dual-interface design, validation feedback, diff visualization)
  - Performance Requirements (response time targets, scalability, resource efficiency)

Sections Added:
  - Core Principles (4 principles)
  - Quality Gates (code review, testing, performance, security requirements)
  - Technical Decision Framework (evaluation criteria, trade-off documentation)
  - Governance (amendment process, compliance review, principle precedence)

Templates Requiring Updates:
  ✅ plan-template.md - Constitution Check section aligns with principles
  ✅ spec-template.md - User story structure supports UX consistency principle
  ✅ tasks-template.md - Task organization by story supports testing principle

Follow-up TODOs: None - all placeholders resolved
===================
-->

# MetadataVersioning Constitution

## Core Principles

### I. Code Quality & Architecture

**MUST adhere to Hexagonal Architecture** to isolate domain logic from infrastructure concerns:
- Domain layer contains business entities, value objects, and invariant enforcement
- Application layer exposes use-case ports; all external dependencies injected via interfaces
- Adapters (inbound: REST, CLI; outbound: database, schema registry) implement ports
- No framework dependencies in domain/application layers

**MUST follow SOLID principles**:
- Single Responsibility: Each class serves one purpose
- Open/Closed: Extend via composition, not modification
- Liskov Substitution: Subtypes must be substitutable for base types
- Interface Segregation: Narrow, client-specific interfaces
- Dependency Inversion: Depend on abstractions, not concrete implementations

**MUST enforce type safety**:
- Java: Leverage Java 21 features (Records, Sealed Classes, Pattern Matching)
- TypeScript: Enable strict mode; no implicit `any` types
- All public APIs MUST have explicit type signatures
- DTOs MUST use immutable Record classes (Java) or readonly types (TypeScript)

**Rationale**: Hexagonal architecture ensures testability and technology independence. SOLID 
principles prevent technical debt accumulation. Type safety catches errors at compile time 
rather than runtime, critical for a metadata platform where schema violations could corrupt 
business data.

### II. Testing Standards (NON-NEGOTIABLE)

**MUST practice Test-Driven Development (TDD)**:
- Write failing tests FIRST before any implementation code
- Obtain user/stakeholder approval of test scenarios before implementation
- Follow Red-Green-Refactor cycle: failing test → minimal implementation → refactor
- Tests serve as executable specifications and living documentation

**MUST maintain test coverage thresholds**:
- Domain layer: 95%+ coverage (business logic must be thoroughly tested)
- Application layer: 90%+ coverage (use cases must be verified)
- Adapters: 80%+ coverage (integration points require validation)
- Overall project minimum: 85% coverage

**MUST follow the test pyramid**:
- Unit tests (70%): Fast, isolated tests of domain logic and use cases
- Integration tests (20%): Test adapter contracts, database interactions, API endpoints
- E2E tests (10%): Critical user journeys (create document, compare versions, publish)

**MUST use appropriate test types**:
- **ArchUnit tests**: Enforce hexagonal boundaries (domain cannot import Spring/JPA)
- **Contract tests**: Validate API compatibility when schemas or endpoints change
- **Performance tests**: Verify response time targets before production deployment
- **TestContainers**: Use PostgreSQL containers for integration tests (no mocks for database)

**Rationale**: TDD ensures implementation matches requirements. High coverage prevents 
regressions. Test pyramid optimizes for fast feedback. Version control and metadata 
management demand reliability—untested code poses unacceptable risk.

### III. User Experience Consistency

**MUST provide dual interfaces with feature parity**:
- REST API: Programmatic access for developers and integrations
- Web UI: Guided interface for non-technical business users
- Every feature MUST be accessible through both interfaces
- API-first development: REST endpoints designed before UI implementation

**MUST deliver clear, actionable validation feedback**:
- Schema violations MUST include field path, constraint violated, and example of valid value
- Custom property validation errors MUST explain naming/depth/type rules
- API responses MUST distinguish client errors (4xx) from server errors (5xx)
- UI forms MUST provide inline validation with contextual help text

**MUST provide intuitive diff visualization**:
- Side-by-side comparison for any two versions
- Highlight structural changes (added/removed fields) vs. value changes
- Indicate breaking changes (removed required fields) vs. additive changes
- Support both visual diff (UI) and machine-readable diff (API JSON)

**MUST maintain consistent terminology**:
- "Topic" (not "category", "type", or "domain")
- "Version" (not "revision", "snapshot", or "iteration")
- "Custom properties" (not "extensions", "attributes", or "metadata")
- "Publish" (not "activate", "deploy", or "promote")

**Rationale**: Dual interfaces ensure accessibility for all user types. Clear validation 
prevents frustration and reduces support burden. Intuitive diffs build user confidence 
before publishing changes. Consistent terminology reduces cognitive load and documentation 
complexity.

### IV. Performance Requirements

**MUST meet response time targets**:
- CRUD operations (create, read, update, delete): <500ms at p95
- Version comparison (diff generation): <3 seconds at p95
- History list (paginated): <1 second at p95
- Schema validation: <200ms at p95

**MUST design for scalability**:
- Stateless services: All backend services must support horizontal scaling
- Database connection pooling: HikariCP configured with appropriate pool size
- Caching strategy: Schema definitions cached with TTL; version data cache-aside pattern
- Pagination: All list endpoints MUST support cursor-based pagination

**MUST enforce resource efficiency**:
- Database queries MUST use prepared statements to prevent SQL injection and improve performance
- Indexes MUST exist on frequently queried columns (topic_id, version_number, created_at)
- JSON documents MUST be stored in JSONB format with GIN indexes for custom property queries
- API rate limiting MUST prevent resource exhaustion (per-user quotas)

**MUST instrument for observability**:
- Structured JSON logging with correlation IDs for request tracing
- Metrics: Request rates, error rates, latency histograms (p50, p95, p99)
- Distributed tracing: Instrument across adapters and external dependencies
- Health checks: Liveness and readiness endpoints for orchestration platforms

**Rationale**: Sub-second response times ensure productive user experience. Horizontal 
scalability supports growth without architecture redesign. Resource efficiency controls 
costs. Observability enables proactive issue detection and rapid troubleshooting.

## Quality Gates

All code changes MUST pass these gates before merge:

**Code Review**:
- At least one approval from a team member familiar with the affected layer (domain/application/adapter)
- Reviewer MUST verify adherence to Hexagonal Architecture boundaries
- Reviewer MUST confirm test coverage meets thresholds
- Reviewer MUST validate performance implications for data-intensive operations

**Testing**:
- All tests MUST pass (unit, integration, E2E)
- New features MUST include tests written before implementation (TDD evidence)
- Coverage report MUST meet layer-specific thresholds
- ArchUnit tests MUST confirm no architectural violations

**Performance**:
- Automated performance tests MUST pass for API endpoints
- Database migration scripts MUST be reviewed for index creation and query performance
- Large JSON document handling (>100KB) MUST be profiled for memory efficiency

**Security**:
- Static analysis MUST pass (no critical or high-severity vulnerabilities)
- Dependency scanning MUST pass (no known CVEs in dependencies)
- Authentication/authorization logic MUST be reviewed by security-aware team member
- Sensitive data (credentials, tokens) MUST NOT be logged or exposed in errors

## Technical Decision Framework

When evaluating implementation approaches, prioritize:

1. **Alignment with Core Principles**: Does it honor Hexagonal Architecture? Does it enable testing?
2. **User Impact**: Does it improve UX consistency or performance for end users?
3. **Maintainability**: Does it reduce complexity or technical debt?
4. **Scalability**: Does it support growth in users, data volume, or feature scope?
5. **Time-to-Market**: Does it deliver user value incrementally vs. big-bang release?

**MUST document trade-offs**:
- When choosing between competing principles (e.g., performance vs. simplicity), document rationale
- Record architectural decision records (ADRs) for significant design choices
- Link ADRs to relevant constitution principles that guided the decision

**MUST justify exceptions**:
- If a principle cannot be followed (e.g., coverage threshold unmet due to legacy code), document reason
- Create technical debt ticket with remediation plan
- Obtain explicit approval from tech lead or architect

## Governance

**Amendment Process**:
- Amendments require pull request with rationale and impact analysis
- Breaking changes (principle removal/redefinition) require team consensus vote
- Version bumps follow semantic versioning (MAJOR.MINOR.PATCH)
- All amendments MUST propagate to dependent templates (plan, spec, tasks)

**Compliance Review**:
- Quarterly architecture reviews verify adherence to Hexagonal boundaries
- Monthly coverage reports track testing standard compliance
- Performance benchmarks run weekly; regressions trigger investigation
- Annual constitution relevance review ensures principles evolve with project maturity

**Principle Precedence**:
- Core Principles supersede all other development practices
- When principles conflict, Testing Standards and Code Quality take precedence
- Quality Gates are NON-NEGOTIABLE; no bypassing for deadlines
- Technical Decision Framework guides resolution of ambiguities

**Version**: 1.0.0 | **Ratified**: 2025-11-12 | **Last Amended**: 2025-11-12
