/**
 * T062: SC-004 Supportability Telemetry
 *
 * Tracks user interactions to measure success criteria SC-004:
 * "Support inquiries related to 'What changed between versions?' decrease by 50%
 * within one quarter of launch, indicating adoption of the comparison experience."
 *
 * This module captures:
 * - Diff comparisons initiated and completed
 * - Self-service resolution metrics (user found info without support)
 * - Correlation IDs for tracing issues
 * - Performance metrics for diff operations
 */

export interface DiffComparisonEvent {
  eventType: 'diff_comparison_initiated' | 'diff_comparison_completed' | 'diff_comparison_failed'
  documentId: string
  leftVersionId: string
  rightVersionId: string
  timestamp: string
  durationMs?: number
  payloadSizeBytes?: number
  correlationId?: string
  viewMode?: 'inline' | 'split'
  errorCode?: string
}

export interface SelfServiceResolutionEvent {
  eventType: 'self_service_resolution'
  action: 'view_history' | 'view_diff' | 'view_version_detail' | 'search_documents'
  documentId?: string
  timestamp: string
  sessionDurationMs?: number
  correlationId?: string
}

export interface SupportAbilityMetric {
  eventType: 'version_lookup' | 'activation_attempt' | 'auth_failure' | 'error_displayed'
  success: boolean
  timestamp: string
  durationMs?: number
  correlationId?: string
  errorMessage?: string
}

type TelemetryEvent = DiffComparisonEvent | SelfServiceResolutionEvent | SupportAbilityMetric

interface TelemetryState {
  events: TelemetryEvent[]
  sessionStart: string
  sessionId: string
}

/**
 * Generate a unique session ID for tracking user sessions
 */
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * In-memory telemetry store
 * In production, this would send to an analytics backend
 */
let telemetryState: TelemetryState = {
  events: [],
  sessionStart: new Date().toISOString(),
  sessionId: generateSessionId(),
}

/**
 * Maximum events to keep in memory to prevent memory leaks
 */
const MAX_EVENTS_IN_MEMORY = 1000

/**
 * Record a telemetry event
 */
const recordEvent = (event: TelemetryEvent): void => {
  telemetryState.events.push(event)

  // Trim events to prevent memory leaks
  if (telemetryState.events.length > MAX_EVENTS_IN_MEMORY) {
    telemetryState.events = telemetryState.events.slice(-MAX_EVENTS_IN_MEMORY / 2)
  }

  // Log in development for debugging
  if (import.meta.env.DEV) {
    console.debug('[telemetry]', event.eventType, event)
  }
}

/**
 * Track when a diff comparison is initiated
 */
export const trackDiffInitiated = (
  documentId: string,
  leftVersionId: string,
  rightVersionId: string,
  correlationId?: string,
): void => {
  recordEvent({
    eventType: 'diff_comparison_initiated',
    documentId,
    leftVersionId,
    rightVersionId,
    timestamp: new Date().toISOString(),
    ...(correlationId && { correlationId }),
  })
}

/**
 * Track when a diff comparison completes successfully
 */
export const trackDiffCompleted = (
  documentId: string,
  leftVersionId: string,
  rightVersionId: string,
  durationMs: number,
  payloadSizeBytes: number,
  viewMode: 'inline' | 'split',
  correlationId?: string,
): void => {
  recordEvent({
    eventType: 'diff_comparison_completed',
    documentId,
    leftVersionId,
    rightVersionId,
    timestamp: new Date().toISOString(),
    durationMs,
    payloadSizeBytes,
    viewMode,
    ...(correlationId && { correlationId }),
  })
}

/**
 * Track when a diff comparison fails
 */
export const trackDiffFailed = (
  documentId: string,
  leftVersionId: string,
  rightVersionId: string,
  errorCode: string,
  correlationId?: string,
): void => {
  recordEvent({
    eventType: 'diff_comparison_failed',
    documentId,
    leftVersionId,
    rightVersionId,
    timestamp: new Date().toISOString(),
    errorCode,
    ...(correlationId && { correlationId }),
  })
}

/**
 * Track self-service resolution events (user finding info without support)
 */
export const trackSelfServiceResolution = (
  action: SelfServiceResolutionEvent['action'],
  documentId?: string,
  correlationId?: string,
): void => {
  const sessionDurationMs = Date.now() - new Date(telemetryState.sessionStart).getTime()

  recordEvent({
    eventType: 'self_service_resolution',
    action,
    ...(documentId && { documentId }),
    timestamp: new Date().toISOString(),
    sessionDurationMs,
    ...(correlationId && { correlationId }),
  })
}

/**
 * Track version lookup events
 */
export const trackVersionLookup = (
  success: boolean,
  durationMs: number,
  correlationId?: string,
  errorMessage?: string,
): void => {
  recordEvent({
    eventType: 'version_lookup',
    success,
    timestamp: new Date().toISOString(),
    durationMs,
    ...(correlationId && { correlationId }),
    ...(errorMessage && { errorMessage }),
  })
}

/**
 * Track activation attempts
 */
export const trackActivationAttempt = (
  success: boolean,
  durationMs: number,
  correlationId?: string,
  errorMessage?: string,
): void => {
  recordEvent({
    eventType: 'activation_attempt',
    success,
    timestamp: new Date().toISOString(),
    durationMs,
    ...(correlationId && { correlationId }),
    ...(errorMessage && { errorMessage }),
  })
}

/**
 * Track authentication failures
 */
export const trackAuthFailure = (correlationId?: string, errorMessage?: string): void => {
  recordEvent({
    eventType: 'auth_failure',
    success: false,
    timestamp: new Date().toISOString(),
    ...(correlationId && { correlationId }),
    ...(errorMessage && { errorMessage }),
  })
}

/**
 * Track when error is displayed to user
 */
export const trackErrorDisplayed = (errorMessage: string, correlationId?: string): void => {
  recordEvent({
    eventType: 'error_displayed',
    success: false,
    timestamp: new Date().toISOString(),
    errorMessage,
    ...(correlationId && { correlationId }),
  })
}

/**
 * Get current telemetry metrics summary
 * Useful for debugging and local analysis
 */
export const getTelemetrySummary = (): {
  sessionId: string
  sessionStart: string
  eventCount: number
  diffComparisons: number
  successfulDiffs: number
  failedDiffs: number
  selfServiceActions: number
  averageDiffDurationMs: number | null
} => {
  const diffEvents = telemetryState.events.filter(
    (e): e is DiffComparisonEvent =>
      e.eventType === 'diff_comparison_initiated' ||
      e.eventType === 'diff_comparison_completed' ||
      e.eventType === 'diff_comparison_failed',
  )

  const completedDiffs = diffEvents.filter((e) => e.eventType === 'diff_comparison_completed')
  const failedDiffs = diffEvents.filter((e) => e.eventType === 'diff_comparison_failed')
  const selfServiceEvents = telemetryState.events.filter(
    (e): e is SelfServiceResolutionEvent => e.eventType === 'self_service_resolution',
  )

  const durations = completedDiffs
    .map((e) => e.durationMs)
    .filter((d): d is number => d !== undefined)

  const averageDiffDurationMs =
    durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : null

  return {
    sessionId: telemetryState.sessionId,
    sessionStart: telemetryState.sessionStart,
    eventCount: telemetryState.events.length,
    diffComparisons: diffEvents.filter((e) => e.eventType === 'diff_comparison_initiated').length,
    successfulDiffs: completedDiffs.length,
    failedDiffs: failedDiffs.length,
    selfServiceActions: selfServiceEvents.length,
    averageDiffDurationMs,
  }
}

/**
 * Reset telemetry state (useful for testing)
 */
export const resetTelemetry = (): void => {
  telemetryState = {
    events: [],
    sessionStart: new Date().toISOString(),
    sessionId: generateSessionId(),
  }
}

/**
 * Export events for sending to analytics backend
 * In production, this would POST to an analytics endpoint
 */
export const exportEvents = (): TelemetryEvent[] => {
  return [...telemetryState.events]
}

/**
 * Flush events (mark as sent)
 * In production, call this after successful POST to analytics
 */
export const flushEvents = (): void => {
  telemetryState.events = []
}
