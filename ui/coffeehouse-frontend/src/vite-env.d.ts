/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly VITE_API_BASE_URL?: string
    readonly VITE_API_TIMEOUT_MS?: string
  }
}
