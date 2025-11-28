/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/**
 * T058: Diff Latency Telemetry
 * Performance instrumentation for version comparison (SC-003)
 */

// TODO: Implement telemetry service
// import { telemetry } from '@services/telemetry'

// Stub telemetry for now
const telemetry = {
  track: (event: string, data: Record<string, unknown>) => {
    if (import.meta.env.DEV) {
      console.debug('[Telemetry]', event, data)
    }
  },
}

/**
 * Telemetry event names for diff operations
 */
export const DIFF_TELEMETRY_EVENTS = {
  /** Diff computation started */
  DIFF_STARTED: 'diff.started',
  /** Diff computation completed successfully */
  DIFF_COMPLETED: 'diff.completed',
  /** Diff computation failed */
  DIFF_FAILED: 'diff.failed',
  /** User switched between inline/split view */
  VIEW_MODE_CHANGED: 'diff.view_mode_changed',
  /** User expanded a diff section */
  SECTION_EXPANDED: 'diff.section_expanded',
  /** User collapsed a diff section */
  SECTION_COLLAPSED: 'diff.section_collapsed',
  /** User swapped left/right versions */
  VERSIONS_SWAPPED: 'diff.versions_swapped',
} as const

/**
 * Performance thresholds for diff latency (milliseconds)
 */
export const DIFF_LATENCY_THRESHOLDS = {
  /** Good performance */
  GOOD: 500,
  /** Acceptable performance */
  ACCEPTABLE: 1500,
  /** Poor performance - may need optimization */
  POOR: 3000,
} as const

/**
 * Diff latency classification
 */
export type DiffLatencyCategory = 'good' | 'acceptable' | 'poor' | 'critical'

/**
 * Classify diff latency into performance categories
 */
export function classifyDiffLatency(latencyMs: number): DiffLatencyCategory {
  if (latencyMs <= DIFF_LATENCY_THRESHOLDS.GOOD) return 'good'
  if (latencyMs <= DIFF_LATENCY_THRESHOLDS.ACCEPTABLE) return 'acceptable'
  if (latencyMs <= DIFF_LATENCY_THRESHOLDS.POOR) return 'poor'
  return 'critical'
}

/**
 * Common properties for diff telemetry events
 */
interface DiffTelemetryBase {
  documentId: string
  leftVersionId: string
  rightVersionId: string
}

/**
 * Properties for diff started event
 */
interface DiffStartedProps extends DiffTelemetryBase {
  correlationId: string
}

/**
 * Properties for diff completed event
 */
interface DiffCompletedProps extends DiffTelemetryBase {
  correlationId: string
  latencyMs: number
  leftPayloadSizeBytes: number
  rightPayloadSizeBytes: number
  diffEntriesCount: number
  additionsCount: number
  removalsCount: number
  modificationsCount: number
}

/**
 * Properties for diff failed event
 */
interface DiffFailedProps extends DiffTelemetryBase {
  correlationId: string
  errorCode: string
  errorMessage: string
  latencyMs?: number
}

/**
 * Track when diff computation starts
 */
export function trackDiffStarted(props: DiffStartedProps): void {
  telemetry.track(DIFF_TELEMETRY_EVENTS.DIFF_STARTED, {
    ...props,
    timestamp: Date.now(),
  })
}

/**
 * Track successful diff completion with latency metrics
 */
export function trackDiffCompleted(props: DiffCompletedProps): void {
  const latencyCategory = classifyDiffLatency(props.latencyMs)

  telemetry.track(DIFF_TELEMETRY_EVENTS.DIFF_COMPLETED, {
    ...props,
    latencyCategory,
    timestamp: Date.now(),
    // Computed metrics
    totalPayloadSizeBytes: props.leftPayloadSizeBytes + props.rightPayloadSizeBytes,
    totalChangesCount: props.additionsCount + props.removalsCount + props.modificationsCount,
  })

  // Log warning for poor performance
  if (latencyCategory === 'poor' || latencyCategory === 'critical') {
    console.warn(`[Diff Telemetry] ${latencyCategory} performance: ${props.latencyMs}ms`, {
      documentId: props.documentId,
      totalPayloadSize: props.leftPayloadSizeBytes + props.rightPayloadSizeBytes,
    })
  }
}

/**
 * Track diff computation failure
 */
export function trackDiffFailed(props: DiffFailedProps): void {
  telemetry.track(DIFF_TELEMETRY_EVENTS.DIFF_FAILED, {
    ...props,
    timestamp: Date.now(),
  })
}

/**
 * Track view mode change (inline ↔ split)
 */
export function trackViewModeChange(
  documentId: string,
  fromMode: 'inline' | 'split',
  toMode: 'inline' | 'split',
): void {
  telemetry.track(DIFF_TELEMETRY_EVENTS.VIEW_MODE_CHANGED, {
    documentId,
    fromMode,
    toMode,
    timestamp: Date.now(),
  })
}

/**
 * Track section expand/collapse for UX analytics
 */
export function trackSectionToggle(documentId: string, path: string, expanded: boolean): void {
  const event = expanded
    ? DIFF_TELEMETRY_EVENTS.SECTION_EXPANDED
    : DIFF_TELEMETRY_EVENTS.SECTION_COLLAPSED

  telemetry.track(event, {
    documentId,
    path,
    timestamp: Date.now(),
  })
}

/**
 * Track version swap action
 */
export function trackVersionsSwapped(props: DiffTelemetryBase): void {
  telemetry.track(DIFF_TELEMETRY_EVENTS.VERSIONS_SWAPPED, {
    ...props,
    timestamp: Date.now(),
  })
}

/**
 * Higher-order function to wrap diff computation with telemetry
 */
export function withDiffTelemetry<T>(
  props: DiffTelemetryBase,
  computeFn: () => Promise<T>,
): Promise<T> {
  const correlationId = crypto.randomUUID()
  const startTime = performance.now()

  trackDiffStarted({ ...props, correlationId })

  return computeFn()
    .then((result) => {
      // Note: Caller should call trackDiffCompleted with full metrics
      return result
    })
    .catch((error) => {
      const latencyMs = performance.now() - startTime
      trackDiffFailed({
        ...props,
        correlationId,
        errorCode: error.code || 'UNKNOWN',
        errorMessage: error.message || 'Unknown error',
        latencyMs,
      })
      throw error
    })
}

/**
 * React hook for diff telemetry within components
 */
export function useDiffTelemetry(documentId: string) {
  return {
    trackViewModeChange: (from: 'inline' | 'split', to: 'inline' | 'split') =>
      trackViewModeChange(documentId, from, to),
    trackSectionToggle: (path: string, expanded: boolean) =>
      trackSectionToggle(documentId, path, expanded),
    trackVersionsSwapped: (leftId: string, rightId: string) =>
      trackVersionsSwapped({ documentId, leftVersionId: leftId, rightVersionId: rightId }),
  }
}
