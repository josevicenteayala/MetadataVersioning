# JsonVersionManager# JsonVersionManager



> A versioned metadata management platform for business-configurable JSON documentsJsonVersionManager is a platform that helps non-technical business users describe and evolve metadata for topics such as loyalty programs, retail campaigns, offers, and coupons. Each metadata document is stored as JSON, validated against a schema that defines the stable structure, and remains open to custom properties that stakeholders may need for their specific scenarios. Every change to a JSON document is versioned, so customers can view history, compare revisions, and confidently publish updates.



JsonVersionManager empowers non-technical business users to create and evolve metadata for topics such as loyalty programs, retail campaigns, offers, and coupons—without writing code. Every change is versioned, validated against schemas, and traceable through a complete audit history.## Audience & Purpose

- **Business owners / customer teams** need a safe way to describe business rules without touching code.

## What It Does- **Developers / integrators** expect reliable APIs, validation, and traceable history when consuming the metadata in downstream systems.



- **Schema-aware editing**: Define structured metadata with flexibility for custom propertiesThe application bridges both worlds by providing APIs for automation and a guided UI for collaborative editing.

- **Version control**: Every save creates an immutable version with full change history

- **Visual comparison**: Side-by-side diff to understand changes before publishing## Core Concepts

- **Dual interfaces**: REST API for developers, guided UI for business users- **Topics** – logical areas such as `loyalty`, `retail`, `offers`, `coupons`. Each topic has a base schema curated by the platform team.

- **Role-based access**: Secure permissions for viewing, editing, and publishing- **Schema with extensions** – schemas define required and optional fields plus the slots where custom attributes live. Custom properties are stored alongside schema-defined ones and validated through generic rules (data type, naming, depth limits).

- **Versioned JSON documents** – each save operation creates a new immutable version (`v1`, `v2`, ...). Metadata includes author, timestamp, diff summary, and publishing state.

## Key Features- **Comparison tooling** – users can diff any two versions of the same topic to understand structural and value changes before promoting them to production.



- 📝 **Rich JSON editor** with business-friendly form controls## MVP Scope

- 🔄 **Version history** with rollback and comparison### MVP 1 – API-first delivery

- ✅ **Validation** against JSON schemas with custom property support- CRUD endpoints for topic JSONs (`POST /topics/{topic}/documents`, `GET /.../{version}`, `PUT`, `DELETE`).

- 🔐 **RBAC security** with audit logging- Schema-aware validation that enforces required fields while allowing custom properties.

- 🎯 **Template gallery** for common metadata types- Version history retrieval and comparison service returning human-friendly diff data.

- 🔗 **REST API** for programmatic access and integration- Authentication / authorization hooks so only permitted users manipulate a topic.

- Postman / OpenAPI documentation to help customer teams integrate quickly.

## Quick Start

### MVP 2 – UI experience

```bash- Rich JSON editor that layers business-friendly controls on top of the schema (dropdowns, checkboxes, inline validation).

# Clone the repository- Version browser with timeline, side-by-side diff, and rollback/promote actions.

git clone https://github.com/josevicenteayala/JsonVersionManager.git- Guided templates for new topics (e.g., “Create Loyalty Offer”) with contextual hints.

cd JsonVersionManager- Role-based views so non-technical users see simplified forms while power users can edit raw JSON when needed.



# Install dependencies (TBD based on tech stack)## Architecture Approach

# npm install  OR  pip install -r requirements.txt  OR  mvn installJsonVersionManager follows Hexagonal (Ports & Adapters) Architecture to keep the core domain independent from delivery technology.



# Configure environment- **Domain Layer** – entities like `Topic`, `MetadataDocument`, `Version`, plus value objects for custom attributes. Encapsulates business rules (version increments, validation orchestration, diff logic).

cp .env.example .env- **Application Layer (Use Cases)** – services such as `CreateDocument`, `UpdateDocument`, `CompareVersions`, `ListHistory`. Exposes ports for repositories, schema providers, diff engines, and notification services.

# Edit .env with your database and auth provider settings- **Adapters**

  - **Inbound**: REST controllers, CLI tools, future GraphQL gateway, background jobs that import/export metadata.

# Run the application (TBD)  - **Outbound**: Persistence adapters (SQL/NoSQL), schema registry adapter, search index adapter, notification/webhook adapter.

# npm start  OR  python app.py  OR  java -jar app.jar- **Infrastructure** – database, message bus, cache, and authentication providers. Each adapter implements the ports defined in the application layer, enforcing SOLID (especially DIP) and easing testability.

```

## Design Principles Applied

_Note: Installation instructions will be finalized once the tech stack is decided._- **SOLID** – Domain models hide invariants; use-case services depend on interfaces; controllers map transport concerns without mixing logic.

- **DRY** – Shared validation, versioning, and diff helpers live in domain services reused by API and UI adapters.

## Documentation- **KISS** – MVP limits scope to essential workflows (CRUD + diff + validation + UI editor) before introducing automation pipelines.

- **YAGNI** – Advanced features (multi-tenant billing, workflow engines) remain future considerations until feedback justifies them.

Comprehensive documentation is organized into focused guides:

## Patterns & Considerations

- **[VISION.md](docs/VISION.md)** - Product vision, target audiences, core concepts, and future opportunities- **Repository pattern** for topic/version storage with pluggable databases.

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Technical design, patterns, and architectural decisions- **Factory / Builder** for assembling schema-aware JSON documents with defaults.

- **[PRODUCT_ROADMAP.md](docs/PRODUCT_ROADMAP.md)** - MVP scope, feature priorities, and release timeline- **Strategy** for diff rendering (plain text vs. highlighted UI view) and validation rules per topic.

- **[UI_GUIDE.md](docs/UI_GUIDE.md)** - User interface components, workflows, and mockups- **Observer / Event sourcing hooks** so downstream systems can react to new versions without tight coupling.

- **[API_REFERENCE.md](docs/API_REFERENCE.md)** - REST API endpoints, authentication, and code examples- **Command pattern** for encapsulating user actions (create, edit, publish) enabling audit logs.



## Use Cases## Data & Versioning

- Metadata persisted in a document store (e.g., PostgreSQL JSONB or MongoDB) with immutable version rows plus a pointer to the latest active version.

### For Business Users- Comparison service computes structural diffs (added/removed nodes, value updates) and tags breaking vs. additive changes.

- Configure loyalty offers with dropdowns and date pickers (no JSON knowledge needed)- Audit trail captures who changed what, making approvals easier for compliance-heavy industries.

- Compare campaign versions before publishing to production

- Roll back to previous versions if issues are discovered## UI Highlights (MVP 2)

- Track who changed what and when for compliance- Schema-driven form renderer: fixed fields map to UI widgets while custom properties live in an “Additional data” panel.

- Inline validation messages and human-readable hints tied to schema rules.

### For Developers- Version compare view with color-coded additions/removals and quick rollback/publish buttons.

- Consume validated metadata via REST API- Template gallery to kick-start common topic types, reducing the JSON knowledge required from business users.

- Subscribe to webhook notifications on version changes

- Integrate metadata into downstream systems with confidence## Non-functional Goals

- Extend schemas without redeploying applications- **Security** – RBAC, audit logging, encryption at rest/in transit.

- **Scalability** – stateless services behind load balancers; cache schema definitions; paginate history queries.

## Example- **Observability** – structured logs, metrics for save/compare performance, tracing across adapters.

- **Extensibility** – new topics or schema updates do not require redeploying the whole stack thanks to hexagonal boundaries.

**Creating a loyalty offer document:**

## Future Opportunities

```json- Workflow approvals before version activation.

{- Hooks to sync metadata into downstream offer/loyalty engines.

  "offerName": "Black Friday Special",- SDKs for popular languages so partners can embed the platform quickly.

  "discount": {- Generative helpers that propose schema extensions or suggest diffs to simplify customer authoring.

    "type": "percentage",

    "value": 25This README will evolve as the solution takes shape. For now it captures the shared understanding of the product vision, MVP milestones, and the architecture principles guiding implementation.

  },
  "validFrom": "2025-11-28",
  "validTo": "2025-11-30",
  "active": true,
  "customProperties": {
    "campaignId": "BF2025",
    "internalCode": "PROMO-BF-001"
  }
}
```

**API request:**
```bash
curl -X POST https://api.jsonversionmanager.com/v1/topics/loyalty/documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @loyalty-offer.json
```

See [API_REFERENCE.md](docs/API_REFERENCE.md) for complete API documentation.

## Architecture Overview

JsonVersionManager follows **Hexagonal Architecture** (Ports & Adapters):

- **Domain Layer**: Core business logic (versioning, validation, diff computation)
- **Application Layer**: Use cases orchestrating domain entities
- **Adapter Layer**: REST API, UI, database, external services
- **Infrastructure**: Authentication, caching, messaging, observability

This design keeps the core domain independent from infrastructure, enabling:
- Easy testing with mock adapters
- Swappable databases (PostgreSQL, MongoDB)
- Multiple delivery channels (REST, GraphQL, CLI)

For details, see [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Technology Stack

_To be determined during implementation. Candidate technologies:_

**Backend**: Java/Spring Boot, .NET/ASP.NET Core, Node.js/Express, Python/FastAPI  
**Frontend**: React, Vue, Angular  
**Database**: PostgreSQL (JSONB), MongoDB  
**Auth**: OAuth2, JWT, Auth0/Okta/Azure AD  
**Infrastructure**: Docker, Kubernetes, AWS/Azure/GCP

## Development Status

🚧 **Early planning phase** - Architecture and requirements defined, implementation starting soon.

**Current Phase**: Documentation and design  
**Next Phase**: MVP 1 - API-first delivery (see [PRODUCT_ROADMAP.md](docs/PRODUCT_ROADMAP.md))

## Contributing

Contributions are welcome! Please read our contributing guidelines (TBD) before submitting pull requests.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the [MIT License](LICENSE) (TBD).

## Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/josevicenteayala/JsonVersionManager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/josevicenteayala/JsonVersionManager/discussions)

## Acknowledgments

Built with the goal of bridging the gap between business agility and technical reliability. Special thanks to all contributors who will help make this vision a reality.

---

_For detailed product vision and roadmap, see [docs/VISION.md](docs/VISION.md) and [docs/PRODUCT_ROADMAP.md](docs/PRODUCT_ROADMAP.md)._
