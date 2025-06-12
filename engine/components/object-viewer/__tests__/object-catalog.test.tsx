import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ObjectCatalog } from '../object-catalog'

describe('ObjectCatalog', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    mockOnSelect.mockClear()
  })

  const defaultProps = {
    selectedObjectId: 'g2v-main-sequence',
    onObjectSelect: mockOnSelect
  }

  const baseObjectProps = {
    mass: 1,
    radius: 1,
    render: {
      shader: 'basic',
      texture: 'none'
    }
  }

  describe('Base Controls', () => {
    const mockCatalogObject = {
      ...baseObjectProps,
      id: 'test-object',
      name: 'Test Object',
      physical: {
        radius: 2
      }
    }

    it('renders base scale controls', () => {
      render(
        <ObjectCatalog
          {...defaultProps}
        />
      )

      expect(screen.getByText('Object Scale')).toBeInTheDocument()
      expect(screen.getByText('Shader Scale')).toBeInTheDocument()
    })

    it('calls scale change handlers', () => {
      render(
        <ObjectCatalog
          {...defaultProps}
        />
      )

      const objectScaleInput = screen.getByLabelText('Object Scale')
      fireEvent.click(objectScaleInput)
      expect(mockOnSelect).toHaveBeenCalledWith('test-object')
    })
  })

  describe('object categories', () => {
    it('renders all star objects', () => {
      render(
        <ObjectCatalog
          {...defaultProps}
        />
      )

      const starObjects = [
        'G2V Main Sequence Star',
        'M2V Red Dwarf',
        'Variable Star'
      ]

      starObjects.forEach(name => {
        expect(screen.getByText(name)).toBeInTheDocument()
      })
    })

    it('renders all terrestrial planet objects', () => {
      render(
        <ObjectCatalog
          {...defaultProps}
        />
      )

      const planetObjects = [
        'Terrestrial Rocky Planet',
        'Oceanic Planet',
        'Smog Planet'
      ]

      planetObjects.forEach(name => {
        expect(screen.getByText(name)).toBeInTheDocument()
      })
    })

    it('renders all gas giant objects', () => {
      render(
        <ObjectCatalog
          {...defaultProps}
        />
      )

      const gasGiantObjects = [
        'Gas Giant',
        'Ice Giant'
      ]

      gasGiantObjects.forEach(name => {
        expect(screen.getByText(name)).toBeInTheDocument()
      })
    })

    it('renders all moon objects', () => {
      render(
        <ObjectCatalog
          {...defaultProps}
        />
      )

      const moonObjects = [
        'Rocky Moon',
        'Icy Moon'
      ]

      moonObjects.forEach(name => {
        expect(screen.getByText(name)).toBeInTheDocument()
      })
    })

    it('renders all special objects', () => {
      render(
        <ObjectCatalog
          {...defaultProps}
        />
      )

      const specialObjects = [
        'Black Hole',
        'Neutron Star',
        'Asteroid Belt'
      ]

      specialObjects.forEach(name => {
        expect(screen.getByText(name)).toBeInTheDocument()
      })
    })
  })
}) 