/**
 * Compare telemetry barrel export
 */
export {
  DIFF_TELEMETRY_EVENTS,
  DIFF_LATENCY_THRESHOLDS,
  classifyDiffLatency,
  trackDiffStarted,
  trackDiffCompleted,
  trackDiffFailed,
  trackViewModeChange,
  trackSectionToggle,
  trackVersionsSwapped,
  withDiffTelemetry,
  useDiffTelemetry,
  type DiffLatencyCategory,
} from './diffLatencyMetrics';
