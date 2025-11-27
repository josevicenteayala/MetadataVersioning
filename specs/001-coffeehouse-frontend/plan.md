# Implementation Plan: Coffeehouse-Inspired Metadata Frontend

**Branch**: `001-coffeehouse-frontend` | **Date**: 2025-11-25 | **Spec**: [/specs/001-coffeehouse-frontend/spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-coffeehouse-frontend/spec.md`

**Note**: Generated via `/speckit.plan` following the repository constitution.

## Summary

Deliver a branded React + TypeScript single-page application under `/ui/coffeehouse-frontend` that consumes the existing Metadata Versioning API. The UI must cover dashboard stats, document lists, version history, version lifecycle actions (create, activate), diff visualization, and in-session Basic Auth. Technical execution centers on a strict TypeScript client generated from the OpenAPI spec, TanStack Query-powered data layer, and stateful UI patterns that preserve coffeehouse styling while meeting performance targets (≤1s list loads, ≤3s diffs, ≤3 steps to activate a version).

## Technical Context

**Language/Version**: TypeScript 5.4 (strict) + React 18, Node 20 toolchain  
**Primary Dependencies**: Vite 5, React Router 6, TanStack Query 5, Zustand (session credentials), Axios + OpenAPI Generator client, jsondiffpatch (diff rendering), Tailwind CSS + custom tokens  
**Storage**: No persistent storage; in-memory stores for credentials and UI state only  
**Testing**: Vitest + React Testing Library (unit), MSW + Playwright (integration/E2E)  
**Target Platform**: Modern evergreen browsers (Chromium, Firefox, Safari) with responsive layouts; deployable via static hosting/CDN  
**Project Type**: Web SPA sharing repo with Spring Boot backend  
**Performance Goals**: Dashboard/doc list requests ≤1s p95; diff loads ≤3s p95 for 200 KB payloads; interactions sustain 60 fps animations  
**Constraints**: Basic Auth credentials never persisted; correlation IDs surfaced in UI; coffeehouse palette adherence; mobile-first responsive rules with breakpoint automation; lifecycle + diff interactions instrumented for latency/step metrics; respect constitution’s Hexagonal + testing mandates  
**Scale/Scope**: Initial release focuses on ~500 documents / 5k versions, concurrent usage by 50 analysts; pages include dashboard, list, detail, compare, settings

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Code Quality & Architecture | Pass | SPA organized by feature modules with service adapters mirroring Hexagonal boundaries; generated API client keeps domain logic separate from transport. |
| Testing Standards | Pass | Plan commits to TDD with Vitest/RTL, MSW, Playwright plus coverage tracking in CI. |
| User Experience Consistency | Pass | Web UI matches REST capabilities (all lifecycle actions) and supplies diff visualization + validation feedback per spec. |
| Performance Requirements | Pass | Targets align with constitution (<1s history, <3s diff) and include instrumentation for correlation IDs + metrics hooks. |
| Security Gate | Pass | Basic Auth handled via in-memory store, no persistence/logging; future OAuth upgrade tracked separately. |

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
```text
backend/
└── src/main/java/com/metadata/versioning/...  (existing Spring Boot services)

ui/
└── coffeehouse-frontend/
    ├── src/
    │   ├── app/               # routing + layout shells
    │   ├── components/        # shared UI (cards, chips, toasts, diff viewer)
    │   ├── features/
    │   │   ├── dashboard/
    │   │   ├── documents/
    │   │   ├── versions/
    │   │   ├── compare/
    │   │   └── settings/
    │   ├── hooks/
    │   ├── services/          # generated API client wrappers, auth store
    │   └── styles/
    ├── public/
    ├── tests/
    │   ├── unit/
    │   ├── integration/
    │   └── e2e/
    ├── vite.config.ts
    └── package.json

tests/
└── frontend-e2e/ (Playwright suite executed via npm scripts)
```

**Structure Decision**: Adopt split-root layout with existing backend under `src/main/java` and a new `ui/coffeehouse-frontend` workspace managed by Vite. Feature-first folders keep domain logic close to UI states while `services/` encapsulates API adapters to respect Hexagonal boundaries mandated by the constitution.

## Phase 0: Research Summary

See [`research.md`](./research.md) for full ADR-style entries.

- **Stack validation**: Confirmed Vite + React 18 + Tailwind satisfies UX constraints without SSR overhead.
- **API client**: Adopt `openapi-typescript-codegen` over heavier generators to keep build lean while honoring strict typing.
- **Data layer**: TanStack Query selected for cache/mutation orchestration paired with MSW in tests.
- **Diff experience**: jsondiffpatch + Monaco diff ensures inline/split parity and accessible theming.
- **Credential storage**: Zustand in-memory store prevents persistence, meeting security gate.

## Phase 1: Design & Contracts

- **Data Model**: [`data-model.md`](./data-model.md) captures DocumentSummary, MetadataVersion, VersionDiff, SessionCredentials, and ToastEvent metadata plus transitions.
- **API Contracts**: [`contracts/coffeehouse-frontend.yaml`](./contracts/coffeehouse-frontend.yaml) maps each UI flow to REST endpoints aligned with the existing backend.
- **Quickstart**: [`quickstart.md`](./quickstart.md) documents toolchain setup, scripts, env vars, and deployment checklist.
- **Agent Context**: `.specify/scripts/bash/update-agent-context.sh copilot` executed to sync Copilot instructions with new tech stack.
- **Quality Hooks**: Instrumentation plan established to log lifecycle step counts, diff latency (Performance API), and viewport coverage; responsive breakpoints validated via scripted Playwright viewport suite.

## Constitution Re-Check (Post-Design)

All gates remain **Pass** after incorporating detailed data model and contracts. Research + design artifacts reinforce Hexagonal separation (generated client + services layer), type safety (strict TS), testing mandates (Vitest/Playwright), UX consistency (diff + validation flows), and performance targets (documented in Technical Context + quickstart).

## Complexity Tracking

No constitution violations introduced; table omitted by design.
