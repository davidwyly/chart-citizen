import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import React from 'react'
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

  describe('Basic Functionality', () => {
    it('renders the catalog with title and search', () => {
      render(
        <ObjectCatalog
          {...defaultProps}
        />
      )

      expect(screen.getByText('Celestial Objects')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search objects...')).toBeInTheDocument()
    })

    it('calls selection handler when object is clicked', () => {
      render(
        <ObjectCatalog
          {...defaultProps}
        />
      )

      // Stars category should be expanded by default, find the star object directly
      const firstObject = screen.getByText('G2V Main Sequence Star')
      fireEvent.click(firstObject)
      expect(mockOnSelect).toHaveBeenCalledWith('g2v-main-sequence')
    })
  })

  describe('object categories', () => {
    it('renders all star objects', () => {
      render(
        <ObjectCatalog
          {...defaultProps}
        />
      )

      // Stars category should be expanded by default
      const starObjects = [
        'G2V Main Sequence Star',
        'M2V Red Dwarf',
        'Protostar'
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

    it('renders all rocky body objects', () => {
      render(
        <ObjectCatalog
          {...defaultProps}
        />
      )

      const rockyObjects = [
        'Rocky Moon',
        'Large Asteroid'
      ]

      rockyObjects.forEach(name => {
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
        'Black Hole'
      ]

      specialObjects.forEach(name => {
        expect(screen.getByText(name)).toBeInTheDocument()
      })
    })

    it('renders habitable planet objects', () => {
      render(
        <ObjectCatalog
          {...defaultProps}
        />
      )

      const habitableObjects = [
        'Earth-like World',
        'Desert World',
        'Ocean World',
        'Ice World'
      ]

      habitableObjects.forEach(name => {
        expect(screen.getByText(name)).toBeInTheDocument()
      })
    })
  })

  describe('search functionality', () => {
    it('filters objects based on search term', () => {
      render(
        <ObjectCatalog
          {...defaultProps}
        />
      )

      const searchInput = screen.getByPlaceholderText('Search objects...')
      fireEvent.change(searchInput, { target: { value: 'Black' } })

      expect(screen.getByText('Black Hole')).toBeInTheDocument()
      expect(screen.queryByText('G2V Main Sequence Star')).not.toBeInTheDocument()
    })
  })

  describe('category expansion', () => {
    it('can collapse and expand categories', () => {
      render(
        <ObjectCatalog
          {...defaultProps}
        />
      )

      const starsCategory = screen.getByText('Stars')
      
      // Stars category starts expanded by default, so objects should be visible
      expect(screen.getByText('G2V Main Sequence Star')).toBeInTheDocument()
      
      // Click to collapse
      fireEvent.click(starsCategory)
      
      // Objects should now be hidden
      expect(screen.queryByText('G2V Main Sequence Star')).not.toBeInTheDocument()
      
      // Click to expand again
      fireEvent.click(starsCategory)
      
      // Objects should be visible again
      expect(screen.getByText('G2V Main Sequence Star')).toBeInTheDocument()
    })
  })
}) 