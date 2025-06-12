import { render } from '@testing-library/react'
import RootLayout from '../layout'

// Mock next/font/google
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'mocked-inter-font',
    style: { fontFamily: 'Inter' }
  })
}))

describe('RootLayout', () => {
  it('renders with correct font configuration', () => {
    const { container } = render(
      <RootLayout>
        <div>Test content</div>
      </RootLayout>
    )

    // Check if the body has the font class
    const body = container.querySelector('body')
    expect(body).toHaveClass('mocked-inter-font')
  })

  it('renders with correct metadata', () => {
    const { container } = render(
      <RootLayout>
        <div>Test content</div>
      </RootLayout>
    )

    // Check if the HTML has the correct lang attribute
    const html = container.querySelector('html')
    expect(html).toHaveAttribute('lang', 'en')
  })

  it('renders children correctly', () => {
    const { getByText } = render(
      <RootLayout>
        <div>Test content</div>
      </RootLayout>
    )

    expect(getByText('Test content')).toBeInTheDocument()
  })
}) 