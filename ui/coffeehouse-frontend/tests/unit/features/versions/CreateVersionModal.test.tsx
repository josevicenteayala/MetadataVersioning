import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeAll } from 'vitest'
import '@testing-library/jest-dom'
import { CreateVersionModal } from '../../../../src/features/versions/components/CreateVersionModal'

// Mock NewVersionForm
vi.mock('../../../../src/features/versions/forms/NewVersionForm', () => ({
  default: ({ onSuccess, onCancel }: any) => (
    <div data-testid="new-version-form">
      <button onClick={onSuccess}>Success</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
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
})
