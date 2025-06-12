import { render, screen } from '@testing-library/react'
import { SystemViewer } from '../system-viewer'
import React from 'react'

jest.mock('@react-three/fiber', () => ({
  ...jest.requireActual('@react-three/fiber'),
  Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

describe('SystemViewer', () => {
  const defaultProps = {
    mode: 'realistic',
    systemId: 'sol',
    onFocus: jest.fn(),
    onSystemChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<SystemViewer {...defaultProps} />)
      expect(screen.getByRole('generic')).toBeInTheDocument()
    })
  })

  // Additional tests for context, state, and performance would require more setup or mocking
  // For now, focus on prop validation and rendering
}) 