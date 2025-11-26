# SC-004 Supportability Telemetry

## Overview

This document describes the telemetry instrumentation for measuring **SC-004** success criteria:

> "Support inquiries related to 'What changed between versions?' decrease by 50% within one quarter of launch, indicating adoption of the comparison experience."

## Telemetry Events

### Diff Comparison Events

| Event | Description | Fields |
|-------|-------------|--------|
| `diff_comparison_initiated` | User started a version comparison | documentId, leftVersionId, rightVersionId, timestamp, correlationId |
| `diff_comparison_completed` | Diff rendered successfully | documentId, leftVersionId, rightVersionId, durationMs, payloadSizeBytes, viewMode, correlationId |
| `diff_comparison_failed` | Diff failed to render | documentId, leftVersionId, rightVersionId, errorCode, correlationId |

### Self-Service Resolution Events

| Event | Description | Fields |
|-------|-------------|--------|
| `self_service_resolution` | User found information without contacting support | action, documentId, sessionDurationMs, correlationId |

Actions tracked:
- `view_history` - User viewed version history
- `view_diff` - User completed a diff comparison
- `view_version_detail` - User inspected version details
- `search_documents` - User searched for documents

### Supportability Metrics

| Event | Description | Fields |
|-------|-------------|--------|
| `version_lookup` | Version lookup attempt | success, durationMs, correlationId, errorMessage |
| `activation_attempt` | Version activation attempt | success, durationMs, correlationId, errorMessage |
| `auth_failure` | Authentication failure | correlationId, errorMessage |
| `error_displayed` | Error shown to user | errorMessage, correlationId |

## Usage

### Tracking Diff Comparisons

```typescript
import { 
  trackDiffInitiated,
  trackDiffCompleted,
  trackDiffFailed 
} from '@services/analytics'

// When user starts comparison
trackDiffInitiated(documentId, leftVersionId, rightVersionId, correlationId)

// When diff completes
trackDiffCompleted(
  documentId,
  leftVersionId, 
  rightVersionId,
  durationMs,
  payloadSizeBytes,
  'inline', // or 'split'
  correlationId
)

// When diff fails
trackDiffFailed(documentId, leftVersionId, rightVersionId, 'PAYLOAD_TOO_LARGE', correlationId)
```

### Tracking Self-Service Resolution

```typescript
import { trackSelfServiceResolution } from '@services/analytics'

// When user finds what they need
trackSelfServiceResolution('view_diff', documentId, correlationId)
```

### Getting Summary Metrics

```typescript
import { getTelemetrySummary } from '@services/analytics'

const summary = getTelemetrySummary()
console.log({
  diffComparisons: summary.diffComparisons,
  successRate: summary.successfulDiffs / summary.diffComparisons,
  averageDurationMs: summary.averageDiffDurationMs,
})
```

## Alert Wiring

### Recommended Alerts

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| High Diff Failure Rate | `failedDiffs / diffComparisons > 0.1` | Warning | Investigate error codes |
| Slow Diff Performance | `averageDiffDurationMs > 3000` | Warning | Review payload sizes |
| Zero Diff Usage | `diffComparisons == 0` in 24h | Info | Check feature visibility |
| Auth Failures Spike | `auth_failure > 10` in 1h | Warning | Check backend health |

### Dashboard Metrics

For SC-004 measurement, track these metrics weekly:

1. **Diff Adoption Rate**
   - `diff_comparison_completed` count
   - Unique users performing diffs
   - Documents compared

2. **Self-Service Success**
   - `self_service_resolution` count
   - Sessions with diff usage
   - Time to resolution

3. **Error Impact**
   - `error_displayed` count
   - Correlation IDs for support tickets
   - Error codes distribution

### Integration with Analytics Backend

In production, implement periodic event export:

```typescript
import { exportEvents, flushEvents } from '@services/analytics'

const sendToAnalytics = async () => {
  const events = exportEvents()
  if (events.length === 0) return
  
  try {
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events })
    })
    flushEvents()
  } catch (error) {
    console.error('Failed to send analytics:', error)
  }
}

// Send every 30 seconds
setInterval(sendToAnalytics, 30_000)

// Send on page unload
window.addEventListener('beforeunload', sendToAnalytics)
```

## Privacy Considerations

- No PII is collected in telemetry events
- Correlation IDs link to backend logs, not user identity
- Session IDs are random and not persistent across visits
- All timestamps are ISO 8601 format

## Measuring SC-004 Success

### Baseline (Pre-Launch)

Capture:
- Support ticket count tagged "version comparison" or "what changed"
- Average time to resolution for comparison questions

### Post-Launch Metrics

Monitor weekly:
1. Support tickets with comparison-related tags
2. Self-service resolution events
3. Diff completion rate

### Success Calculation

```
SC-004 Success = 
  (Baseline Support Tickets - Current Support Tickets) / Baseline Support Tickets >= 0.5
```

If `SC-004 Success >= 50%`, the criteria is met.

## Implementation Status

| Component | Instrumented | Status |
|-----------|--------------|--------|
| VersionComparePanel | Yes | ✅ |
| VersionDiffViewer | Yes | ✅ |
| DiffErrorState | Yes | ✅ |
| VersionHistoryTable | Planned | ⏳ |
| ActivationControls | Planned | ⏳ |
| AuthSettingsPanel | Planned | ⏳ |
