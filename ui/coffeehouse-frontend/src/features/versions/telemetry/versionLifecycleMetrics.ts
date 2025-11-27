/**
 * Version Lifecycle Telemetry Metrics (T055)
 * SC-002: Instrumentation for create/activate workflows
 *
 * Tracks performance and user behavior for version management operations
 */

// ─────────────────────────────────────────────────────────────
// Metric Event Types
// ─────────────────────────────────────────────────────────────

export type LifecycleEventName =
  | 'version.create.started'
  | 'version.create.succeeded'
  | 'version.create.failed'
  | 'version.create.cancelled'
  | 'version.activate.started'
  | 'version.activate.confirmed'
  | 'version.activate.succeeded'
  | 'version.activate.failed'
  | 'version.activate.cancelled'
  | 'version.form.validation_error'
  | 'version.form.json_parse_error'

export interface LifecycleMetricPayload {
  documentId: string
  versionId?: string
  versionNumber?: number
  durationMs?: number
  errorCode?: string
  errorMessage?: string
  userRole?: string
  payloadSizeBytes?: number
  summaryLength?: number
  validationErrors?: string[]
}

export interface LifecycleMetricEvent {
  name: LifecycleEventName
  timestamp: number
  correlationId: string
  payload: LifecycleMetricPayload
}

// ─────────────────────────────────────────────────────────────
// Metric Storage
// ─────────────────────────────────────────────────────────────

const metricsBuffer: LifecycleMetricEvent[] = []
const MAX_BUFFER_SIZE = 100

// ─────────────────────────────────────────────────────────────
// Correlation ID Generator
// ─────────────────────────────────────────────────────────────

export function generateCorrelationId(): string {
  return `lcm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// ─────────────────────────────────────────────────────────────
// Metric Recording Functions
// ─────────────────────────────────────────────────────────────

export function recordLifecycleMetric(
  name: LifecycleEventName,
  payload: LifecycleMetricPayload,
  correlationId?: string,
): LifecycleMetricEvent {
  const event: LifecycleMetricEvent = {
    name,
    timestamp: Date.now(),
    correlationId: correlationId ?? generateCorrelationId(),
    payload,
  }

  // Add to buffer with overflow protection
  if (metricsBuffer.length >= MAX_BUFFER_SIZE) {
    metricsBuffer.shift()
  }
  metricsBuffer.push(event)

  // Log in development
  if (import.meta.env.DEV) {
    console.debug('[Lifecycle Telemetry]', event.name, event.payload)
  }

  return event
}

// ─────────────────────────────────────────────────────────────
// Timing Helpers
// ─────────────────────────────────────────────────────────────

const timingStarts = new Map<string, number>()

export function startTiming(operationKey: string): void {
  timingStarts.set(operationKey, performance.now())
}

export function endTiming(operationKey: string): number | undefined {
  const startTime = timingStarts.get(operationKey)
  if (startTime === undefined) {
    return undefined
  }
  timingStarts.delete(operationKey)
  return Math.round(performance.now() - startTime)
}

// ─────────────────────────────────────────────────────────────
// Create Version Metrics
// ─────────────────────────────────────────────────────────────

export function trackCreateStarted(documentId: string, correlationId: string): void {
  startTiming(`create-${correlationId}`)
  recordLifecycleMetric('version.create.started', { documentId }, correlationId)
}

export function trackCreateSucceeded(
  documentId: string,
  versionId: string,
  versionNumber: number,
  payloadSizeBytes: number,
  summaryLength: number,
  correlationId: string,
): void {
  const durationMs = endTiming(`create-${correlationId}`)
  recordLifecycleMetric(
    'version.create.succeeded',
    {
      documentId,
      versionId,
      versionNumber,
      ...(durationMs !== undefined && { durationMs }),
      payloadSizeBytes,
      summaryLength,
    },
    correlationId,
  )
}

export function trackCreateFailed(
  documentId: string,
  errorCode: string,
  errorMessage: string,
  correlationId: string,
): void {
  const durationMs = endTiming(`create-${correlationId}`)
  recordLifecycleMetric(
    'version.create.failed',
    { documentId, ...(durationMs !== undefined && { durationMs }), errorCode, errorMessage },
    correlationId,
  )
}

export function trackCreateCancelled(documentId: string, correlationId: string): void {
  endTiming(`create-${correlationId}`)
  recordLifecycleMetric('version.create.cancelled', { documentId }, correlationId)
}

// ─────────────────────────────────────────────────────────────
// Activate Version Metrics
// ─────────────────────────────────────────────────────────────

export function trackActivateStarted(
  documentId: string,
  versionId: string,
  correlationId: string,
): void {
  startTiming(`activate-${correlationId}`)
  recordLifecycleMetric('version.activate.started', { documentId, versionId }, correlationId)
}

export function trackActivateConfirmed(
  documentId: string,
  versionId: string,
  correlationId: string,
): void {
  recordLifecycleMetric('version.activate.confirmed', { documentId, versionId }, correlationId)
}

export function trackActivateSucceeded(
  documentId: string,
  versionId: string,
  versionNumber: number,
  correlationId: string,
): void {
  const durationMs = endTiming(`activate-${correlationId}`)
  recordLifecycleMetric(
    'version.activate.succeeded',
    { documentId, versionId, versionNumber, ...(durationMs !== undefined && { durationMs }) },
    correlationId,
  )
}

export function trackActivateFailed(
  documentId: string,
  versionId: string,
  errorCode: string,
  errorMessage: string,
  correlationId: string,
): void {
  const durationMs = endTiming(`activate-${correlationId}`)
  recordLifecycleMetric(
    'version.activate.failed',
    { documentId, versionId, ...(durationMs !== undefined && { durationMs }), errorCode, errorMessage },
    correlationId,
  )
}

export function trackActivateCancelled(
  documentId: string,
  versionId: string,
  correlationId: string,
): void {
  endTiming(`activate-${correlationId}`)
  recordLifecycleMetric('version.activate.cancelled', { documentId, versionId }, correlationId)
}

// ─────────────────────────────────────────────────────────────
// Form Validation Metrics
// ─────────────────────────────────────────────────────────────

export function trackValidationError(
  documentId: string,
  validationErrors: string[],
  correlationId: string,
): void {
  recordLifecycleMetric(
    'version.form.validation_error',
    { documentId, validationErrors },
    correlationId,
  )
}

export function trackJsonParseError(
  documentId: string,
  errorMessage: string,
  correlationId: string,
): void {
  recordLifecycleMetric(
    'version.form.json_parse_error',
    { documentId, errorMessage },
    correlationId,
  )
}

// ─────────────────────────────────────────────────────────────
// Metrics Retrieval
// ─────────────────────────────────────────────────────────────

export function getRecentMetrics(count = 10): LifecycleMetricEvent[] {
  return metricsBuffer.slice(-count)
}

export function getMetricsByCorrelation(correlationId: string): LifecycleMetricEvent[] {
  return metricsBuffer.filter((e) => e.correlationId === correlationId)
}

export function getMetricsByName(name: LifecycleEventName): LifecycleMetricEvent[] {
  return metricsBuffer.filter((e) => e.name === name)
}

export function clearMetricsBuffer(): void {
  metricsBuffer.length = 0
}

// ─────────────────────────────────────────────────────────────
// Aggregation Helpers (for SC-002 reporting)
// ─────────────────────────────────────────────────────────────

export interface LifecycleStats {
  createAttempts: number
  createSuccesses: number
  createFailures: number
  createCancellations: number
  activateAttempts: number
  activateSuccesses: number
  activateFailures: number
  activateCancellations: number
  avgCreateDurationMs: number | null
  avgActivateDurationMs: number | null
}

export function computeLifecycleStats(): LifecycleStats {
  const createSuccesses = metricsBuffer.filter((e) => e.name === 'version.create.succeeded')
  const activateSuccesses = metricsBuffer.filter((e) => e.name === 'version.activate.succeeded')

  const avgCreateDuration =
    createSuccesses.length > 0
      ? createSuccesses.reduce((sum, e) => sum + (e.payload.durationMs ?? 0), 0) /
        createSuccesses.length
      : null

  const avgActivateDuration =
    activateSuccesses.length > 0
      ? activateSuccesses.reduce((sum, e) => sum + (e.payload.durationMs ?? 0), 0) /
        activateSuccesses.length
      : null

  return {
    createAttempts: metricsBuffer.filter((e) => e.name === 'version.create.started').length,
    createSuccesses: createSuccesses.length,
    createFailures: metricsBuffer.filter((e) => e.name === 'version.create.failed').length,
    createCancellations: metricsBuffer.filter((e) => e.name === 'version.create.cancelled').length,
    activateAttempts: metricsBuffer.filter((e) => e.name === 'version.activate.started').length,
    activateSuccesses: activateSuccesses.length,
    activateFailures: metricsBuffer.filter((e) => e.name === 'version.activate.failed').length,
    activateCancellations: metricsBuffer.filter((e) => e.name === 'version.activate.cancelled')
      .length,
    avgCreateDurationMs: avgCreateDuration ? Math.round(avgCreateDuration) : null,
    avgActivateDurationMs: avgActivateDuration ? Math.round(avgActivateDuration) : null,
  }
}
