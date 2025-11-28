import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeAll } from 'vitest'
import '@testing-library/jest-dom'
import { CreateVersionModal } from '../../../../src/features/versions/components/CreateVersionModal'

// Mock NewVersionForm to capture props
let capturedProps: any = null
vi.mock('../../../../src/features/versions/forms/NewVersionForm', () => ({
  default: (props: any) => {
    capturedProps = props
    return (
      <div data-testid="new-version-form">
        <button onClick={props.onSuccess}>Success</button>
        <button onClick={props.onCancel}>Cancel</button>
        {props.initialPayload && (
          <div data-testid="initial-payload">{JSON.stringify(props.initialPayload)}</div>
        )}
      </div>
    )
  },
}))

describe('CreateVersionModal', () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    })
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open')
    })
  })

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    documentId: 'doc-1',
  }

  it('should render dialog when isOpen is true', () => {
    render(<CreateVersionModal {...defaultProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled()
  })

  it('should close dialog when isOpen is false', () => {
    render(<CreateVersionModal {...defaultProps} isOpen={false} />)
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled()
  })

  it('should call onClose when cancel button clicked (from form)', () => {
    render(<CreateVersionModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('should call onClose when Escape key pressed', () => {
    render(<CreateVersionModal {...defaultProps} />)
    const dialog = screen.getByRole('dialog')
    fireEvent(dialog, new Event('close'))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('should pass documentId to NewVersionForm', () => {
    render(<CreateVersionModal {...defaultProps} />)
    expect(screen.getByTestId('new-version-form')).toBeInTheDocument()
  })

  it('should call onClose when form submission succeeds', () => {
    render(<CreateVersionModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Success'))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  // User Story 3: Pre-populate with Active Version
  it('should pass initialPayload to NewVersionForm when provided', () => {
    const initialPayload = { key: 'value', nested: { data: true } }
    render(<CreateVersionModal {...defaultProps} initialPayload={initialPayload} />)
    expect(screen.getByTestId('initial-payload')).toHaveTextContent(JSON.stringify(initialPayload))
    expect(capturedProps.initialPayload).toEqual(initialPayload)
  })

  it('should not pass initialPayload when undefined', () => {
    render(<CreateVersionModal {...defaultProps} initialPayload={undefined} />)
    expect(screen.queryByTestId('initial-payload')).not.toBeInTheDocument()
    expect(capturedProps.initialPayload).toBeUndefined()
  })

  it('should render correctly when no initialPayload is provided', () => {
    render(<CreateVersionModal {...defaultProps} />)
    expect(screen.getByTestId('new-version-form')).toBeInTheDocument()
    expect(screen.queryByTestId('initial-payload')).not.toBeInTheDocument()
  })
})
