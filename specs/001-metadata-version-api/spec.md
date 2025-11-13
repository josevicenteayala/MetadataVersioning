# Feature Specification: Metadata Versioning Service

**Feature Branch**: `001-metadata-version-api`  
**Created**: November 13, 2025  
**Status**: Draft  
**Input**: User description: "Metadata Versioning Service - RESTful API for comprehensive metadata management with version control, JSON storage, audit trails, and active version management"

## Clarifications

### Session 2025-11-13

- Q: How should the API authenticate and authorize users and systems? → A: No authentication (public read, authenticated write)
- Q: What should the "author" field capture for the audit trail? → A: String identifier from auth system (username, email, or service account)
- Q: How should metadata documents be organized and retrieved when listing? → A: Grouped by active status first (active/inactive)
- Q: What should happen when a schema is updated and existing metadata versions no longer comply? → A: Allow schema update, mark non-compliant versions with warning flag
- Q: What is the expected maximum number of metadata documents per type that the system should support efficiently? → A: 500 per type

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Version Metadata Document (Priority: P1)

A business analyst needs to create a new loyalty program configuration and evolve it over time as requirements change. They create an initial metadata document, make changes as needed, and view the complete history of modifications.

**Why this priority**: This is the core value proposition - enabling non-technical users to create and manage versioned business rules without engineering involvement. Without this, the platform has no purpose.

**Independent Test**: Can be fully tested by creating a metadata document via API, making updates, and verifying that each change creates a new immutable version with complete audit trail (author, timestamp, diff summary).

**Acceptance Scenarios**:

1. **Given** no existing metadata document, **When** business analyst submits new metadata with type="loyalty-program" and name="spring-bonus", **Then** system creates version v1 with provided JSON content and records creator information
2. **Given** existing metadata document at v1, **When** analyst updates the content, **Then** system creates v2 preserving v1 unchanged and captures modification timestamp
3. **Given** metadata document with multiple versions, **When** analyst requests version history, **Then** system returns complete lineage from v1 to current with all metadata (author, timestamp, diff summary)
4. **Given** metadata document at v3, **When** analyst retrieves specific version v1, **Then** system returns exact v1 content unchanged

---

### User Story 2 - Activate and Consume Metadata (Priority: P1)

Downstream systems (offer engines, campaign platforms) need to reliably fetch the currently active version of metadata to execute business rules. Business users control which version is active without deploying code.

**Why this priority**: This enables the integration use case - without ability to activate and consume versions, the metadata can't be used operationally. This is equally critical as creation for making the system functional.

**Independent Test**: Can be fully tested by creating multiple versions of a document, activating specific version, and verifying that API consumers retrieve only the active version by type and name.

**Acceptance Scenarios**:

1. **Given** metadata document with versions v1, v2, v3 where v2 is active, **When** consumer requests active version for type="loyalty-program" and name="spring-bonus", **Then** system returns v2 content
2. **Given** metadata document with v2 currently active, **When** business user activates v3, **Then** system marks v3 as active and v2 as inactive
3. **Given** multiple metadata documents of same type with different names, **When** consumer requests active version for specific type and name, **Then** system returns only the active version for that exact combination
4. **Given** metadata document with no active version, **When** consumer requests active version, **Then** system returns clear message indicating no active version exists

---

### User Story 3 - Compare Versions Before Activation (Priority: P2)

Before promoting a draft version to production, business users and reviewers need to understand exactly what changed between versions to assess risk and validate correctness.

**Why this priority**: This provides safety and confidence when evolving business rules. While not required for basic functionality, it significantly reduces errors and enables collaborative review workflows.

**Independent Test**: Can be fully tested by creating two versions with known differences, requesting comparison, and verifying that system identifies all added fields, removed fields, and value modifications.

**Acceptance Scenarios**:

1. **Given** metadata document with v1 containing field "maxReward": 100 and v2 containing "maxReward": 200, **When** user compares v1 to v2, **Then** system shows "maxReward" value changed from 100 to 200
2. **Given** v2 adds new field "eligibleTiers": ["gold", "platinum"] not present in v1, **When** user compares v1 to v2, **Then** system shows "eligibleTiers" as added field
3. **Given** v2 removes field "deprecated_flag" present in v1, **When** user compares v1 to v2, **Then** system shows "deprecated_flag" as removed field
4. **Given** comparison showing breaking changes, **When** user reviews diff, **Then** system clearly distinguishes breaking changes from additive changes

---

### User Story 4 - Manage Schema Definitions (Priority: P2)

Organization administrators define schemas that establish required fields and validation rules for metadata types (loyalty programs, campaigns, offers), enabling consistency while allowing custom extensions.

**Why this priority**: Schemas provide governance and integration reliability. While initial versions can work without schemas, they become essential for scaling to multiple teams and ensuring downstream systems can depend on consistent structure.

**Independent Test**: Can be fully tested by defining a schema with required fields, creating metadata that validates against it, and attempting to create invalid metadata that violates schema rules.

**Acceptance Scenarios**:

1. **Given** administrator defines schema for "loyalty-program" with required fields ["programId", "name", "startDate"], **When** user creates metadata without "programId", **Then** system rejects creation with validation error
2. **Given** schema allows custom properties in "extensions" section, **When** user creates metadata with custom field "extensions.customRule", **Then** system accepts and stores the custom property
3. **Given** existing schema definition, **When** administrator updates schema to add new required field, **Then** system allows the update and marks existing non-compliant versions with warning flag while new versions must comply with updated schema
4. **Given** metadata document with custom properties, **When** system validates, **Then** custom properties pass generic rules for data types, naming conventions, and depth limits
5. **Given** metadata versions marked with schema compliance warning, **When** user retrieves version, **Then** system includes warning indicator in response with timestamp of when non-compliance was detected

---

### User Story 5 - Track Publishing Lifecycle (Priority: P3)

Business teams collaborate on metadata through workflow stages (draft, approved, published, archived) with visibility into which versions are in progress versus production-ready.

**Why this priority**: This adds workflow governance for enterprise scenarios with approval processes. Basic functionality works with just versioning and activation; publishing states enhance collaboration and compliance for larger organizations.

**Independent Test**: Can be fully tested by creating version in draft state, transitioning through approval to published, and verifying that only published versions can be activated.

**Acceptance Scenarios**:

1. **Given** newly created metadata version, **When** system creates version, **Then** version starts in "draft" state
2. **Given** version in draft state, **When** approver marks version as approved, **Then** version transitions to "approved" state and records approver
3. **Given** version in approved state, **When** user publishes version, **Then** version transitions to "published" and becomes eligible for activation
4. **Given** outdated published version, **When** user archives version, **Then** version transitions to "archived" and cannot be activated
5. **Given** versions in various states, **When** user lists versions, **Then** system shows current publishing state for each version

---

### Edge Cases

- What happens when user attempts to modify an already-published version? (System should prevent modification of immutable versions)
- How does system handle concurrent attempts to activate different versions of the same metadata? (Use optimistic locking or serialization to ensure one activation wins)
- What if metadata JSON exceeds reasonable size limits? (Define maximum document size and reject oversized submissions)
- How are orphaned versions handled when no version is active? (System allows this state; consumers receive appropriate response)
- What happens when comparing two identical versions? (System shows "no differences found")
- How does system handle malformed JSON in metadata content? (Validate JSON structure before accepting and return clear error messages)
- What if user deletes all versions of a metadata document? (System should either prevent deletion of all versions or clearly mark metadata as deleted while preserving audit trail)
- How are circular references in JSON handled? (Define depth limits and reject deeply nested structures)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create new metadata versions automatically with each save operation, incrementing version numbers sequentially (v1, v2, v3, etc.)
- **FR-002**: System MUST store metadata content as JSON with full support for nested objects, arrays, and primitive types
- **FR-003**: System MUST record complete audit information for each version including author identifier, timestamp, and human-readable change summary
- **FR-004**: System MUST ensure all versions are immutable after creation - no modifications to existing version content or metadata
- **FR-005**: System MUST enforce unique constraint per (type, name, version) combination to prevent duplicate versions
- **FR-006**: System MUST allow exactly one active version per (type, name) combination at any time
- **FR-007**: System MUST provide API endpoint to retrieve active version by type and name for consumer applications
- **FR-008**: System MUST provide API endpoint to retrieve specific version by type, name, and version number
- **FR-009**: System MUST provide API endpoint to list all versions for given type and name, ordered by version number
- **FR-010**: System MUST generate comparison output showing structural and value differences between any two versions of same metadata
- **FR-011**: System MUST validate JSON structure and reject malformed content before creating version
- **FR-012**: System MUST support schema definitions that specify required fields, optional fields, and validation rules
- **FR-013**: System MUST validate metadata content against schema when schema is defined for the type
- **FR-014**: System MUST allow custom properties in designated extension sections while validating against generic rules
- **FR-015**: System MUST provide API endpoint to list all metadata documents grouped by active status (active versions first, then inactive)
- **FR-016**: System MUST track publishing state (draft, approved, published, archived) for each version
- **FR-017**: System MUST return appropriate HTTP status codes and error messages following REST conventions
- **FR-018**: System MUST support filtering version lists by publishing state
- **FR-019**: System MUST allow schema updates even when existing versions would become non-compliant
- **FR-020**: System MUST mark existing versions with schema compliance warning flag when schema changes make them non-compliant
- **FR-021**: System MUST record timestamp when schema compliance warning is applied to a version
- **FR-022**: System MUST include schema compliance warning indicator in API responses when retrieving flagged versions
- **FR-023**: System MUST prevent activation of versions not in "published" state
- **FR-024**: System MUST record state transitions with timestamps when publishing state changes
- **FR-025**: System MUST enforce maximum JSON document size limit to prevent resource exhaustion
- **FR-026**: System MUST allow unauthenticated read access to retrieve active versions and version history
- **FR-027**: System MUST require authentication for all write operations (create, update, activate, publish, schema management)
- **FR-028**: System MUST record authenticated user identity in audit trail for all write operations

### Key Entities

- **Metadata Document**: Represents a named configuration for a specific type (e.g., loyalty program, campaign, offer). Identified by unique combination of type and name. Contains multiple versions over its lifecycle.

- **Version**: Immutable snapshot of metadata content at a specific point in time. Attributes include version number (v1, v2, etc.), JSON content, author (string identifier from authentication system such as username, email, or service account name), creation timestamp, change summary, publishing state, and active flag. Belongs to exactly one metadata document.

- **Schema Definition**: Template that specifies structure and validation rules for a metadata type. Defines required fields, optional fields, data types, and locations for custom extensions. One schema applies to all metadata documents of that type.

- **Version Comparison**: Computed difference between two versions showing added fields, removed fields, and modified values. Identifies breaking versus additive changes. Generated on-demand rather than stored.

- **Audit Entry**: Record of significant events including version creation, activation changes, state transitions, and schema updates. Includes timestamp, actor, and action description for compliance tracking.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Business users can create new metadata documents and receive version v1 in under 2 seconds including validation
- **SC-002**: Consumer applications retrieve active versions with response time under 200 milliseconds for 95th percentile
- **SC-003**: System correctly identifies and displays all differences when comparing any two versions within 1 second
- **SC-004**: System maintains complete audit trail with zero data loss - every version creation and activation is recorded
- **SC-005**: System supports at least 50 concurrent API requests without response time degradation
- **SC-006**: Version history queries return results in under 1 second for documents with up to 100 versions
- **SC-007**: Schema validation catches 100% of violations for required fields and data types before version creation
- **SC-008**: System handles JSON documents up to 1MB in size without performance degradation
- **SC-009**: Business users can complete the workflow of creating, updating, comparing, and activating versions without technical support
- **SC-010**: API consumers successfully retrieve correct active version 99.9% of the time with proper error handling for remaining cases
- **SC-011**: System efficiently supports up to 500 metadata documents per type with listing and query operations completing in under 2 seconds
