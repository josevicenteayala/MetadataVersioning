export type ToastIntent = 'success' | 'info' | 'warning' | 'error'

export interface ToastPayload {
  id: string
  title: string
  message: string
  intent: ToastIntent
  correlationId?: string
  autoDismissMs?: number
  createdAt: string
}

export type ToastListener = (toast: ToastPayload) => void

class ToastBus {
  private listeners = new Set<ToastListener>()

  subscribe(listener: ToastListener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  publish(toast: ToastPayload) {
    this.listeners.forEach((listener) => listener(toast))
    if (toast.correlationId) {
      console.info('[toast]', toast.intent, toast.message, `correlation: ${toast.correlationId}`)
    }
  }
}

export const toastBus = new ToastBus()

const buildPayload = (input: Omit<ToastPayload, 'id' | 'createdAt'>): ToastPayload => ({
  id: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  title: input.title,
  message: input.message,
  intent: input.intent,
  ...(input.correlationId && { correlationId: input.correlationId }),
  ...(input.autoDismissMs !== undefined && { autoDismissMs: input.autoDismissMs }),
})

export const emitToast = (input: {
  title: string
  message: string
  intent?: ToastIntent
  correlationId?: string
  autoDismissMs?: number
}) => {
  const payload = buildPayload({
    title: input.title,
    message: input.message,
    intent: input.intent ?? 'info',
    ...(input.correlationId && { correlationId: input.correlationId }),
    ...(input.autoDismissMs && { autoDismissMs: input.autoDismissMs }),
  })
  toastBus.publish(payload)
  return payload.id
}

export const emitErrorToast = (message: string, correlationId?: string) =>
  emitToast({
    title: 'Something went wrong',
    message,
    intent: 'error',
    ...(correlationId && { correlationId }),
  })

// T039: Diff-specific toast helpers

/**
 * Emit warning toast for diff breaking changes
 */
export const emitDiffBreakingChangeWarning = (details: {
  path: string
  oldType: string
  newType: string
  correlationId?: string
}) =>
  emitToast({
    title: 'Breaking Change Detected',
    message: `Field "${details.path}" changed type from ${details.oldType} to ${details.newType}. This may cause compatibility issues.`,
    intent: 'warning',
    ...(details.correlationId && { correlationId: details.correlationId }),
    autoDismissMs: 10000, // Longer for important warnings
  })

/**
 * Emit warning toast for large diff payload
 */
export const emitDiffPayloadWarning = (sizeKb: number, correlationId?: string) =>
  emitToast({
    title: 'Large Payload',
    message: `Version payload is ${sizeKb.toFixed(1)}KB. Diff computation may be slow.`,
    intent: 'warning',
    ...(correlationId && { correlationId }),
    autoDismissMs: 8000,
  })

/**
 * Emit error toast for diff computation failure
 */
export const emitDiffErrorToast = (errorCode: string, message: string, correlationId?: string) =>
  emitToast({
    title: `Diff Error: ${errorCode}`,
    message,
    intent: 'error',
    ...(correlationId && { correlationId }),
    autoDismissMs: 10000,
  })

/**
 * Emit info toast for successful diff
 */
export const emitDiffSuccessToast = (stats: {
  additions: number
  removals: number
  modifications: number
}) =>
  emitToast({
    title: 'Diff Computed',
    message: `Found ${stats.additions} additions, ${stats.removals} removals, ${stats.modifications} modifications.`,
    intent: 'success',
    autoDismissMs: 4000,
  })
