import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { RenderOptions } from '@testing-library/react'
import { render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

interface WrapperOptions {
  queryClient?: QueryClient
}

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

const Providers = ({ children, client }: { children: ReactNode; client: QueryClient }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
)

export const renderWithProviders = (ui: ReactElement, options?: RenderOptions & WrapperOptions) => {
  const queryClient = options?.queryClient ?? createTestQueryClient()
  const result = render(ui, {
    wrapper: ({ children }) => <Providers client={queryClient}>{children}</Providers>,
    ...options,
  })

  return {
    queryClient,
    ...result,
  }
}
