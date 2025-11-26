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
  ...input,
  id: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  autoDismissMs: input.autoDismissMs ?? 6000,
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
    correlationId: input.correlationId,
    autoDismissMs: input.autoDismissMs,
  })
  toastBus.publish(payload)
  return payload.id
}

export const emitErrorToast = (message: string, correlationId?: string) =>
  emitToast({ title: 'Something went wrong', message, correlationId, intent: 'error' })
