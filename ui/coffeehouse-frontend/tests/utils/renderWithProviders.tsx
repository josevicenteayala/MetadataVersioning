import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { RenderOptions } from '@testing-library/react'
import { render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

interface WrapperOptions {
  queryClient?: QueryClient
  initialEntries?: string[]
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

const Providers = ({
  children,
  client,
  initialEntries,
}: {
  children: ReactNode
  client: QueryClient
  initialEntries?: string[]
}) => (
  <MemoryRouter initialEntries={initialEntries ?? ['/']}>
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  </MemoryRouter>
)

export const renderWithProviders = (ui: ReactElement, options?: RenderOptions & WrapperOptions) => {
  const queryClient = options?.queryClient ?? createTestQueryClient()
  const initialEntries = options?.initialEntries ?? ['/']
  const result = render(ui, {
    wrapper: ({ children }) => (
      <Providers client={queryClient} initialEntries={initialEntries}>
        {children}
      </Providers>
    ),
    ...options,
  })

  return {
    queryClient,
    ...result,
  }
}
