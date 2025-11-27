const ensureLocalStorage = () => {
  const missingLocalStorage =
    typeof globalThis.localStorage === 'undefined' ||
    typeof globalThis.localStorage.getItem !== 'function'

  if (missingLocalStorage) {
    let store: Record<string, string> = {}
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
          store[key] = value
        },
        removeItem: (key: string) => {
          delete store[key]
        },
        clear: () => {
          store = {}
        },
        key: (index: number) => Object.keys(store)[index] ?? null,
        get length() {
          return Object.keys(store).length
        },
      },
    })
  }
}

ensureLocalStorage()

const { setupServer } = await import('msw/node')

export const server = setupServer()

export const mockApi = {
  use: (...handlers: Parameters<typeof server.use>) => server.use(...handlers),
  reset: () => server.resetHandlers(),
}
