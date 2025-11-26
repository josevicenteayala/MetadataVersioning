# Research: Coffeehouse-Inspired Metadata Frontend

## Decision 1: Client stack selection
- **Decision**: Use Vite 5 with React 18 + TypeScript strict mode for the SPA build pipeline.
- **Rationale**: Vite provides <100 ms HMR, SSR-ready build outputs, and seamless integration with TanStack Query plus Tailwind; it keeps tooling lightweight compared to Next.js while still supporting code splitting.
- **Alternatives considered**: Next.js 15 (rejected due to SSR overkill and higher bundling complexity); CRA (deprecated ecosystem, slower builds).

## Decision 2: API client generation
- **Decision**: Generate a typed Axios client via `openapi-typescript-codegen` pointing to `specs/001-metadata-version-api/contracts/openapi.yaml`.
- **Rationale**: The generator emits strict typings, request/response DTOs, and factory functions for Basic Auth injection, aligning with the constitution’s type-safety mandate.
- **Alternatives considered**: `openapi-generator-cli` (heavier Java dependency) and handwritten fetch wrappers (risk of drift and reduced typing).

## Decision 3: Data-fetching and caching
- **Decision**: Use TanStack Query 5 for all server interactions plus optimistic updates on version creation/activation flows.
- **Rationale**: Query caching, background refetch, and mutation lifecycle hooks simplify pagination, toast orchestration, and correlation ID surfacing without reinventing caching.
- **Alternatives considered**: SWR (lacks mutation orchestration) and Redux Toolkit Query (heavier boilerplate for a single SPA).

## Decision 4: Diff visualization and theming
- **Decision**: Render JSON diffs with `jsondiffpatch` + a custom dual-pane viewer built on Monaco Editor’s diff component, themed using Tailwind CSS tokens inspired by the coffeehouse palette.
- **Rationale**: jsondiffpatch specializes in structural JSON diffs while Monaco handles code-friendly guttering, enabling both inline and split views with accessible color contrast.
- **Alternatives considered**: `react-diff-viewer` (string-based diffs, poor JSON context) and custom Prism-based renderers (higher maintenance, no built-in sync scrolling).

## Decision 5: Credential handling
- **Decision**: Store Basic Auth credentials inside a volatile Zustand store scoped per tab, with optional clipboard paste helper and auto-clear on 401/offboarding.
- **Rationale**: Zustand’s minimal API avoids prop drilling, while in-memory storage meets the security constraint of never persisting credentials.
- **Alternatives considered**: Context + useReducer (more boilerplate, harder devtools trace) and browser storage (violates requirement to avoid persistence).
