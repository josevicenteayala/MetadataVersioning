# Metadata Versioning - Product Requirements

## Overview
The Metadata Versioning Service is a RESTful API built with Java 21 and Spring Boot 3+ that provides comprehensive metadata (JSON Object) management with version control capabilities. This service allows users to create, version, activate, and manage metadata entries with full audit trail and JSON storage support.

### Target Audiences

**Business owners / customer teams** need a safe way to describe business rules without touching code.
- Non-technical stakeholders who need to manage metadata for loyalty programs, retail campaigns, offers, and coupons
- Business analysts who need to configure and evolve business rules
- Product managers who want to iterate quickly without engineering dependencies

**Developers / integrators** expect reliable APIs, validation, and traceable history when consuming the metadata in downstream systems.
- Backend engineers consuming metadata in offer engines, loyalty systems, and campaign platforms
- Integration specialists connecting the platform to existing business systems
- DevOps teams responsible for deployment and monitoring

The application bridges both worlds by providing APIs for automation and a guided UI for collaborative editing.

## Core Concepts


### Schema with Extensions
Schemas define required and optional fields plus the slots where custom attributes live. This hybrid approach provides:
- **Structured foundation**: Required fields ensure consistency and enable integrations
- **Flexibility**: Custom properties are stored alongside schema-defined ones
- **Validation**: Generic rules apply to custom attributes (data type, naming conventions, depth limits)
- **Evolution**: Schemas can evolve without breaking existing documents

### Versioned JSON Documents
Each save operation creates a new immutable version (`v1`, `v2`, ...). Version metadata includes:
- **Author**: Who made the change
- **Timestamp**: When the change occurred
- **Diff summary**: Human-readable description of changes
- **Publishing state**: Draft, approved, published, archived
- **Lineage**: Full history chain from v1 to current

### Comparison Tooling
Users can diff any two versions of the same topic to understand structural and value changes before promoting them to production. The comparison service identifies:
- Added/removed fields
- Value modifications
- Breaking vs. additive changes
- Schema compliance differences

### Key Features
- **Version Control**: Automatic incremental versioning for all metadata changes
- **Active Version Management**: One active version per (type, name) combination
- **JSON Storage**: Native JSONB support for flexible metadata schemas
- **Full Audit Trail**: Complete history with timestamps for all versions
- **RESTful Design**: Clean API following REST principles

### Technology Stack
- **Language**: Java 21
- **Framework**: Spring Boot 3.3+
- **Database**: PostgreSQL 17+
- **ORM**: Spring Data JPA / Hibernate
- **API Documentation**: OpenAPI 3.1
- **JSON Processing**: Jackson