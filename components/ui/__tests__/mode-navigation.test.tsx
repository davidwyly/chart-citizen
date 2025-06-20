import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { ModeNavigation } from '../mode-navigation'

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
}))

describe('ModeNavigation', () => {
  it('renders home, starmap and system view buttons for realistic mode', () => {
    render(<ModeNavigation mode="realistic" />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Starmap')).toBeInTheDocument()
    expect(screen.getByText('System View')).toBeInTheDocument()
  })

  it('renders home, starmap and system view buttons for star-citizen mode', () => {
    render(<ModeNavigation mode="star-citizen" />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Starmap')).toBeInTheDocument()
    expect(screen.getByText('System View')).toBeInTheDocument()
  })

  it('generates correct links for realistic mode', () => {
    render(<ModeNavigation mode="realistic" />)
    
    const starmapLink = screen.getByText('Starmap').closest('a')
    const systemViewLink = screen.getByText('System View').closest('a')
    
    expect(starmapLink).toHaveAttribute('href', '/realistic/starmap')
    expect(systemViewLink).toHaveAttribute('href', '/realistic')
  })

  it('generates correct links for star-citizen mode', () => {
    render(<ModeNavigation mode="star-citizen" />)
    
    const starmapLink = screen.getByText('Starmap').closest('a')
    const systemViewLink = screen.getByText('System View').closest('a')
    
    expect(starmapLink).toHaveAttribute('href', '/star-citizen/starmap')
    expect(systemViewLink).toHaveAttribute('href', '/star-citizen')
  })

  it('applies custom className when provided', () => {
    const { container } = render(<ModeNavigation mode="realistic" className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('has proper accessibility attributes', () => {
    render(<ModeNavigation mode="realistic" />)
    
    const starmapButton = screen.getByRole('button', { name: /starmap/i })
    const systemViewButton = screen.getByRole('button', { name: /system view/i })
    
    expect(starmapButton).toBeInTheDocument()
    expect(systemViewButton).toBeInTheDocument()
  })
}) 