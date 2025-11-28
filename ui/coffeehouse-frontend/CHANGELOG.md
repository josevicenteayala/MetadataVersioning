# Changelog

All notable changes to the Coffeehouse Frontend project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Create New Version Modal** (`002-new-version-ui`) - New feature allowing users to create document versions directly from the UI
  - Modal dialog accessible from document detail page via "Create New Version" button
  - JSON payload editor with syntax validation
  - "Format JSON" button for automatic payload formatting
  - Change summary input field (max 500 characters)
  - Pre-populates payload editor with active version content when available
  - Inline validation with clear error messages
  - Accessibility support: keyboard navigation, focus management, ARIA attributes
  - Error boundary for graceful error handling
  - Full test coverage: 9 component tests, E2E tests for all user stories

### Technical Details

- **Components**:
  - `CreateVersionModal.tsx` - Modal container with focus management
  - `NewVersionForm.tsx` - Form with JSON editor and validation (existing, extended)
- **Routes**:
  - `DocumentRoute.tsx` - Updated to include Create Version button and modal
- **Tests**:
  - Unit tests: `CreateVersionModal.test.tsx`
  - E2E tests: `create-version.spec.ts`

### Dependencies

- No new dependencies added
- Uses existing TanStack Query for data fetching
- Uses existing toast system for notifications

---

## [1.0.0] - 2025-11-24

- Initial release of Coffeehouse Frontend
- Dashboard with document discovery
- Version history viewing
- Version comparison (diff view)
- Version lifecycle management
- Authentication settings panel
- Document creation form
