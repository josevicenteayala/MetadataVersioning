# Coffeehouse Frontend

A coffeehouse-inspired React frontend for the Metadata Versioning API. Built with TypeScript, React 18, and Vite 5.

## Features

- **Dashboard** - Overview of metadata documents with key metrics
- **Document Management** - Browse and search metadata documents
- **Version History** - View complete version history with sorting
- **Version Details** - Inspect version metadata and JSON payloads
- **Version Lifecycle** - Activate versions with confirmation flows
- **Version Comparison** - Side-by-side diff visualization
- **Authentication** - Basic Auth credential management

## Tech Stack

- **React 18** with TypeScript 5.4 (strict mode)
- **Vite 5** for fast development and optimized builds
- **React Router 7** for client-side routing
- **TanStack Query 5** for data fetching and caching
- **Zustand** for session state management
- **Axios** for HTTP requests with OpenAPI-generated client
- **jsondiffpatch** for JSON diff visualization
- **Tailwind CSS** with custom coffeehouse design tokens
- **Vitest** + React Testing Library for unit tests
- **Playwright** for end-to-end tests

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Metadata Versioning API running on `http://localhost:8080`

### Installation

```bash
# Install dependencies
pnpm install

# Generate API client from OpenAPI spec
pnpm generate:api
```

### Development

```bash
# Start development server
pnpm dev

# Open browser at http://localhost:5173
```

### Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run end-to-end tests
pnpm test:e2e

# Run e2e tests with UI
pnpm test:e2e:ui
```

### Building

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
ui/coffeehouse-frontend/
├── docs/                    # Documentation
│   └── accessibility.md     # Accessibility audit & guidelines
├── public/                  # Static assets
├── src/
│   ├── app/                 # App shell & providers
│   │   ├── hooks/           # Global hooks (useAuth, useHasRole)
│   │   └── providers/       # Context providers (AuthProvider)
│   ├── features/            # Feature modules
│   │   ├── compare/         # Version comparison
│   │   ├── dashboard/       # Dashboard & document list
│   │   ├── documents/       # Document table
│   │   ├── settings/        # Auth settings
│   │   └── versions/        # Version history & details
│   ├── services/            # Shared services
│   │   ├── analytics/       # Telemetry & insights
│   │   ├── api/             # HTTP client & interceptors
│   │   ├── auth/            # Session store (Zustand)
│   │   ├── feedback/        # Toast notifications
│   │   └── generated/       # OpenAPI client (auto-generated)
│   └── styles/              # Global styles & tokens
├── tests/
│   ├── e2e/                 # Playwright tests
│   └── unit/                # Vitest tests
└── ...config files
```

## Design System

The Coffeehouse theme uses a warm, inviting color palette:

| Token    | Light     | Dark      | Use          |
| -------- | --------- | --------- | ------------ |
| foam     | `#FEF9F4` | `#1B120C` | Background   |
| crema    | `#F0DFCE` | `#2C1A13` | Secondary bg |
| espresso | `#402218` | `#F2E7DC` | Primary text |
| mocha    | `#6F4F37` | `#F5D9C2` | Interactive  |
| moss     | `#4E6F52` | `#8EC498` | Success      |
| cherry   | `#C04B3E` | `#F08A76` | Error        |

## Authentication

The frontend uses Basic Auth. Credentials are:

- Stored in session memory only (cleared on browser close)
- Automatically cleared on 401 responses
- Validated via `/auth/check` endpoint

To configure credentials:

1. Navigate to Settings (`/settings`)
2. Enter username and password
3. Click "Test Connection" to validate
4. Click "Save Credentials" to store in session

## API Integration

The frontend consumes the Metadata Versioning API. Ensure the API is running:

```bash
# From project root
mvn spring-boot:run

# Or with Docker
docker-compose up
```

API base URL is configured via environment variable:

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8080/api
```

## Accessibility

This application targets WCAG 2.1 Level AA compliance:

- ✅ Color contrast ratios meet minimum requirements
- ✅ Full keyboard navigation support
- ✅ ARIA labels and live regions
- ✅ Screen reader compatible
- ✅ Reduced motion support

See [docs/accessibility.md](./docs/accessibility.md) for the full audit.

## Scripts Reference

| Script               | Description           |
| -------------------- | --------------------- |
| `pnpm dev`           | Start dev server      |
| `pnpm build`         | Production build      |
| `pnpm preview`       | Preview prod build    |
| `pnpm test`          | Run unit tests        |
| `pnpm test:watch`    | Unit tests (watch)    |
| `pnpm test:coverage` | Unit tests (coverage) |
| `pnpm test:e2e`      | Run Playwright tests  |
| `pnpm test:e2e:ui`   | Playwright with UI    |
| `pnpm lint`          | ESLint check          |
| `pnpm lint:fix`      | ESLint fix            |
| `pnpm format`        | Prettier format       |
| `pnpm typecheck`     | TypeScript check      |
| `pnpm generate:api`  | Generate API client   |

## Contributing

1. Create feature branch from `main`
2. Write tests first (TDD)
3. Implement feature
4. Run full test suite: `pnpm lint && pnpm test && pnpm build`
5. Submit pull request

## License

MIT
