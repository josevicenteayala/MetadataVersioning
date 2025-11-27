# Data Model: Coffeehouse-Inspired Metadata Frontend

## DocumentSummary
- **Identifiers**: `documentId` (UUID, required, immutable)
- **Attributes**:
  - `name` (string 3-120 chars, displayed in cards and tables)
  - `status` (enum: draft, approved, published, archived)
  - `activeVersionId` (UUID, nullable when no active version)
  - `versionCount` (integer ≥ 0)
  - `lastUpdatedAt` (ISO-8601 timestamp, server provided)
  - `tags` (string[] max 8 entries, used for chips/filters)
- **Relationships**: 1:N with `MetadataVersion` (document owns versions)
- **Validation Rules**: status chips derived from backend status; cards require `name` + `status` + `lastUpdatedAt` fields before rendering.
- **State Notes**: dashboard metrics aggregate `status` counts across DocumentSummary records.

## MetadataVersion
- **Identifiers**: `versionId` (UUID)
- **Attributes**:
  - `documentId` (UUID, foreign key to DocumentSummary)
  - `versionNumber` (int, monotonically increasing per document)
  - `status` (enum: draft, approved, published, archived, active)
  - `createdBy` (string user id)
  - `createdAt` (ISO timestamp)
  - `activatedAt` (ISO timestamp, nullable)
  - `changeSummary` (string up to 500 chars)
  - `payload` (JSON object ≤ 200 KB rendered in diff/detail panes)
- **Lifecycle / Transitions**:
  - Draft → Approved → Published → Active (activate operation) → Archived.
  - Only one Active version per document; activating demotes previous Active to Published.
  - Contributors can create Draft; Admins can activate/deactivate.
- **Validation Rules**: payload JSON must be valid per server schema; UI validates JSON syntax before submit.

## VersionDiff
- **Attributes**:
  - `fromVersionId` / `toVersionId` (UUIDs)
  - `addedPaths`, `removedPaths`, `changedPaths` (string[] of JSON Pointer)
  - `breakingChanges` (boolean, flagged when required fields removed)
  - `renderMode` (enum: split, inline)
  - `generatedAt` (timestamp)
- **Relationships**: derived from two `MetadataVersion` entities; not persisted server-side but cached client-side per session.
- **Usage**: feeds diff viewer component; metadata displayed in compare header.

## SessionCredentials
- **Attributes**:
  - `username` / `password` (strings, kept in-memory only)
  - `role` (enum: admin, contributor, viewer) resolved from `/auth/check` endpoint
  - `validatedAt` (timestamp of last successful test connection)
  - `correlationId` (string from last API call)
- **Constraints**: store resets on tab close, manual clear, or HTTP 401; never serialized to local/session storage.

## ToastEvent
- **Attributes**:
  - `id` (UUID client-side)
  - `type` (success, warning, error)
  - `message` (string ≤ 140 chars)
  - `correlationId` (string, optional)
  - `autoDismissMs` (default 6000)
- **Usage**: surfaces API feedback, especially correlation IDs on errors; stored in UI queue store.
