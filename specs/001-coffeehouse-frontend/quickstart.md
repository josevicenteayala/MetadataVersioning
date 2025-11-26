# Quickstart: Coffeehouse-Inspired Metadata Frontend

## Prerequisites
- Node.js 20+
- pnpm 9 (preferred) or npm 10
- Java backend running locally on `http://localhost:8080`
- OpenAPI document available at `http://localhost:8080/v3/api-docs`

## Install
```bash
cd ui/coffeehouse-frontend
pnpm install
pnpm generate:client   # wraps openapi-typescript-codegen -> src/services/generated
```

## Run Dev Server
```bash
pnpm dev
```
- Proxies `/api` requests to `http://localhost:8080`
- Auto-injects Basic Auth headers using in-memory credentials store
- Opens at `http://localhost:5173`

## Testing
```bash
pnpm test          # Vitest + React Testing Library (watch mode)
pnpm test:ci       # Vitest with coverage
pnpm test:e2e      # Playwright (requires backend up)
```

## Lint & Format
```bash
pnpm lint          # eslint + typescript-eslint strict config
pnpm format        # prettier --write
```

## Build
```bash
pnpm build         # Vite build → dist/
```
- Outputs static assets ready for CDN/edge hosting
- `pnpm preview` serves the production build locally

## Environment Configuration
Create `.env` in `ui/coffeehouse-frontend`:
```
VITE_API_BASE_URL=http://localhost:8080
VITE_API_TIMEOUT_MS=10000
```
Credentials are entered via the Settings/Auth screen at runtime—never stored in `.env` files.

## Deployment Checklist
1. Run `pnpm lint && pnpm test:ci && pnpm test:e2e`
2. Execute `pnpm build`
3. Upload `dist/` to static host (e.g., Azure Static Web Apps)
4. Configure reverse proxy so `/api` reaches the Metadata Versioning service with HTTPS enforced
