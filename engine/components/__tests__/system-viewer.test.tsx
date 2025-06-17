import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { SystemViewer } from '../system-viewer'
import React from 'react'

vi.mock('@react-three/fiber', async () => {
  const actual = await vi.importActual('@react-three/fiber')
  return {
    ...actual,
    Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  }
})

describe('SystemViewer', () => {
  const defaultProps = {
    mode: 'realistic',
    systemId: 'sol',
    onFocus: vi.fn(),
    onSystemChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<SystemViewer {...defaultProps} />)
      expect(screen.getByText(/Loading sol/)).toBeInTheDocument()
    })
  })

  // Additional tests for context, state, and performance would require more setup or mocking
  // For now, focus on prop validation and rendering
}) 