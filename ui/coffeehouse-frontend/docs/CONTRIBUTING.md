# Contributing to Coffeehouse Frontend

Thank you for your interest in contributing! This guide will help you get started with development, testing, and submitting changes.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Commit Guidelines](#commit-guidelines)
- [Architecture Guidelines](#architecture-guidelines)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Git
- Backend API running on `http://localhost:8080`

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd MetadataVersioning/ui/coffeehouse-frontend

# Install dependencies
pnpm install

# Generate API client from OpenAPI spec
pnpm generate:api

# Start development server
pnpm dev
```

### Environment Configuration

Create `.env` file:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring

### Starting New Work

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### Development Loop

```bash
# Start dev server (auto-reload on changes)
pnpm dev

# Run tests in watch mode
pnpm test:watch

# Check TypeScript errors
pnpm type-check

# Run linter
pnpm lint

# Format code
pnpm format
```

### Before Committing

```bash
# Run all checks
pnpm type-check
pnpm lint
pnpm test
pnpm build

# Or use pre-commit hook (recommended)
# This runs automatically on git commit if configured
```

## Code Standards

### TypeScript

**Strict Mode**: All code must pass TypeScript strict mode checks.

```typescript
// ✅ Good - Explicit types
interface UserProps {
  name: string
  role: Role
}

function greetUser({ name, role }: UserProps): string {
  return `Hello, ${name} (${role})`
}

// ❌ Bad - Implicit any
function greetUser(user) {
  return `Hello, ${user.name}`
}
```

### React Components

**Prefer Function Components**: Use function components with hooks over class components.

```tsx
// ✅ Good
const VersionCard: React.FC<VersionCardProps> = ({ version }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card>
      <CardHeader>{version.versionNumber}</CardHeader>
      {isExpanded && <CardContent>{version.metadata}</CardContent>}
    </Card>
  )
}

// ❌ Bad
class VersionCard extends React.Component<VersionCardProps> {
  state = { isExpanded: false }

  render() {
    return <Card>...</Card>
  }
}
```

**Component File Structure**:

```tsx
// 1. Imports
import React, { useState } from 'react'
import type { Version } from '@/types'
import { Button } from '@/components/ui/Button'

// 2. Types/Interfaces
interface VersionCardProps {
  version: Version
  onActivate?: (version: Version) => void
}

// 3. Constants
const MAX_DESCRIPTION_LENGTH = 100

// 4. Component
export const VersionCard: React.FC<VersionCardProps> = ({ version, onActivate }) => {
  // 4a. Hooks
  const [isExpanded, setIsExpanded] = useState(false)

  // 4b. Derived state
  const truncatedDesc = version.description.slice(0, MAX_DESCRIPTION_LENGTH)

  // 4c. Event handlers
  const handleToggle = () => setIsExpanded((prev) => !prev)

  // 4d. Render
  return <Card>{/* JSX */}</Card>
}

// 5. Exports
export default VersionCard
```

### Naming Conventions

**Files**:

- Components: `PascalCase.tsx` (e.g., `VersionCard.tsx`)
- Hooks: `camelCase.ts` (e.g., `useVersionHistory.ts`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Types: `PascalCase.types.ts` (e.g., `Version.types.ts`)
- Tests: `*.test.tsx` or `*.test.ts`

**Variables**:

```typescript
// Constants - SCREAMING_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3
const DEFAULT_PAGE_SIZE = 20

// Variables - camelCase
const documentId = 'config/app-settings'
const versionNumber = 42

// Booleans - is/has/can prefix
const isActive = true
const hasChanges = false
const canActivate = user.role === 'admin'

// Types/Interfaces - PascalCase
type Version = {...}
interface VersionCardProps {...}

// React Components - PascalCase
const VersionCard: React.FC<Props> = () => {...}
```

### Import Organization

```typescript
// 1. External libraries
import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

// 2. Internal modules (absolute imports)
import { httpClient } from '@/services/api/httpClient'
import type { Version } from '@/types'

// 3. Relative imports (same feature)
import { VersionCard } from './VersionCard'
import { useVersionHistory } from './useVersionHistory'

// 4. Assets/styles
import './styles.css'
```

### State Management

**Query State**: Use TanStack Query for server state.

```typescript
// ✅ Good - Server state with TanStack Query
const { data: versions, isLoading } = useQuery({
  queryKey: ['versions', documentId],
  queryFn: () => api.getVersions(documentId),
})

// ❌ Bad - Server state with useState
const [versions, setVersions] = useState<Version[]>([])
useEffect(() => {
  api.getVersions(documentId).then(setVersions)
}, [documentId])
```

**Session State**: Use Zustand for session-scoped state.

```typescript
// ✅ Good - Session credentials in Zustand
const { username, password } = useSessionStore()

// ❌ Bad - Credentials in localStorage
const username = localStorage.getItem('username')
```

**Component State**: Use React hooks for UI-only state.

```typescript
// ✅ Good - Local UI state
const [isDrawerOpen, setIsDrawerOpen] = useState(false)
const [selectedTab, setSelectedTab] = useState<Tab>('details')

// ❌ Bad - UI state in Zustand store
const { isDrawerOpen, setDrawerOpen } = useUIStore()
```

## Testing Requirements

### Unit Tests

**Coverage Requirements**:

- 80% line coverage minimum
- 100% for critical paths (authentication, version activation)

**Test Structure**:

```typescript
describe('useActivateVersion', () => {
  beforeEach(() => {
    // Setup
    queryClient.clear()
    vi.clearAllMocks()
  })

  it('should activate version successfully', async () => {
    // Arrange
    const mockVersion = createMockVersion()

    // Act
    const { result } = renderHook(() => useActivateVersion(), {
      wrapper: createQueryWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({
        documentId: 'config/app',
        versionNumber: '2',
      })
    })

    // Assert
    expect(result.current.isSuccess).toBe(true)
    expect(mockApi.activateVersion).toHaveBeenCalledWith({
      type: 'config',
      name: 'app',
      versionNumber: '2',
    })
  })

  it('should handle API errors', async () => {
    // Test error handling
  })

  it('should invalidate cache on success', async () => {
    // Test cache invalidation
  })
})
```

**Run Tests**:

```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# Specific file
pnpm test useActivateVersion.test.ts
```

### E2E Tests

**When to Write E2E Tests**:

- Critical user flows (authentication, version activation)
- Complex interactions across multiple components
- Integration with backend API

**Test Structure**:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Version Activation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5173')

    // Login
    await page.getByLabel('Username').fill('admin')
    await page.getByLabel('Password').fill('password')
    await page.getByRole('button', { name: 'Login' }).click()
  })

  test('should activate version with confirmation', async ({ page }) => {
    // Navigate to version detail
    await page.getByText('app-settings').click()
    await page.getByText('Version 2').click()

    // Click activate button
    await page.getByRole('button', { name: 'Activate Version' }).click()

    // Confirm in modal
    await expect(page.getByText('Are you sure')).toBeVisible()
    await page.getByRole('button', { name: 'Confirm' }).click()

    // Verify success
    await expect(page.getByText('Version activated')).toBeVisible()
    await expect(page.getByText('Status: Active')).toBeVisible()
  })
})
```

**Run E2E Tests**:

```bash
# Ensure backend is running first
mvn spring-boot:run

# Run E2E tests
pnpm test:e2e

# Debug mode
pnpm test:e2e --debug

# Headed browser
pnpm test:e2e --headed
```

## Pull Request Process

### Before Submitting PR

1. **Update from main**:

```bash
git checkout main
git pull origin main
git checkout your-feature-branch
git rebase main
```

2. **Run all checks**:

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

3. **Update documentation** if needed
4. **Squash WIP commits** (optional but recommended)

### PR Template

```markdown
## Description

[Brief description of changes]

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Motivation and Context

[Why is this change needed? What problem does it solve?]

## How Has This Been Tested?

- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)

[Add screenshots for UI changes]

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests pass locally
```

### Review Process

1. **Automated checks** must pass:
   - TypeScript compilation
   - ESLint (no errors)
   - All tests pass
   - Build succeeds

2. **Code review** by at least one maintainer
3. **Address feedback** and push updates
4. **Approval** from maintainer
5. **Merge** (squash and merge preferred)

## Commit Guidelines

### Commit Message Format

```text
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or auxiliary tool changes

**Examples**:

```bash
feat(versions): add bulk activation support

- Add checkbox selection to version list
- Implement bulk activation mutation
- Add confirmation modal for multiple versions

Closes #123

---

fix(auth): clear credentials on 401 response

Previously credentials persisted after token expiration,
causing repeated failed requests.

---

docs(contributing): add commit message guidelines
```

### Commit Best Practices

- **Atomic commits**: One logical change per commit
- **Descriptive messages**: Explain what and why, not how
- **Reference issues**: Include issue numbers when applicable
- **Present tense**: "Add feature" not "Added feature"
- **Imperative mood**: "Fix bug" not "Fixes bug"

## Architecture Guidelines

### Feature Organization

Follow feature-first organization:

```text
features/
  version-history/
    components/
      VersionList.tsx
      VersionCard.tsx
    hooks/
      useVersionHistory.ts
      useActivateVersion.ts
    index.ts
```

### Hexagonal Architecture Alignment

**Ports (Abstract Interfaces)**:

```typescript
// features/version-history/ports/VersionRepository.ts
export interface VersionRepository {
  findByDocument(documentId: string): Promise<Version[]>
  activate(documentId: string, versionNumber: string): Promise<void>
}
```

**Adapters (Concrete Implementations)**:

```typescript
// features/version-history/adapters/ApiVersionRepository.ts
export class ApiVersionRepository implements VersionRepository {
  constructor(private httpClient: HttpClient) {}

  async findByDocument(documentId: string): Promise<Version[]> {
    const [type, name] = documentId.split('/')
    const response = await this.httpClient.get(`/metadata/${type}/${name}/versions`)
    return response.data
  }

  async activate(documentId: string, versionNumber: string): Promise<void> {
    const [type, name] = documentId.split('/')
    await this.httpClient.post(`/metadata/${type}/${name}/versions/${versionNumber}/activate`)
  }
}
```

**Application Services (Use Cases)**:

```typescript
// features/version-history/hooks/useActivateVersion.ts
export function useActivateVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: ActivateVersionRequest) => {
      const repository = new ApiVersionRepository(httpClient)
      await repository.activate(request.documentId, request.versionNumber)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions'] })
    },
  })
}
```

### Design Patterns

**Query Key Factory**:

```typescript
export const versionHistoryKeys = {
  all: ['versions'] as const,
  lists: () => [...versionHistoryKeys.all, 'list'] as const,
  list: (filters: string) => [...versionHistoryKeys.lists(), { filters }] as const,
  byDocument: (documentId: string) => [...versionHistoryKeys.all, documentId] as const,
}
```

**Confirmation Modal Pattern**:

```typescript
const [showConfirmation, setShowConfirmation] = useState(false)

return (
  <>
    <Button onClick={() => setShowConfirmation(true)}>
      Activate
    </Button>

    <ConfirmationModal
      isOpen={showConfirmation}
      onClose={() => setShowConfirmation(false)}
      onConfirm={handleActivate}
      title="Activate Version"
      message="Are you sure you want to activate this version?"
    />
  </>
)
```

### Performance Considerations

- **Memoization**: Use `useMemo` for expensive calculations
- **Callback stability**: Use `useCallback` for event handlers passed as props
- **Code splitting**: Use lazy loading for large components
- **Query optimization**: Configure stale times appropriately

### Security Guidelines

- **No sensitive data in client**: Credentials only in memory
- **Authorization headers**: Always include in API requests
- **Correlation IDs**: Generate for all API calls
- **Input validation**: Validate user inputs before API calls
- **Error handling**: Never expose stack traces to users

## Questions or Issues?

- Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
- Review [Architecture Documentation](./ARCHITECTURE.md)
- Open an issue on GitHub
- Contact maintainers

Thank you for contributing! 🎉
