# Planet Catalog Context

This directory contains catalog definitions for different types of planets that can be rendered in the Chart-Citizen application.

## Files

- `terrestrial-rocky.json`: Basic rocky terrestrial planets with minimal atmosphere and surface features

- `desert-world.json`: Arid planets with low humidity (15%), high temperature (75%), and sparse population (25%)
- `ocean-world.json`: Water-dominated planets with high humidity (90%), moderate temperature (55%), and aquatic civilizations (60%)
- `ice-world.json`: Cold planets with low temperature (15%), moderate humidity (40%), and hardy polar populations (35%)
- `gas-giant.json`: Large gaseous planets with thick atmospheres and no solid surface

## Habitable Planet Parameters

The habitable planet types use three key parameters (0-100 scale):

### Humidity (0-100)
- **0-20**: Desert worlds with minimal water coverage
- **21-40**: Arid planets with some water bodies
- **41-60**: Balanced water/land distribution
- **61-80**: Water-rich worlds with large oceans
- **81-100**: Ocean worlds with minimal land masses

### Temperature (0-100)
- **0-20**: Ice worlds with extensive polar ice caps
- **21-40**: Cold planets with significant frozen regions
- **41-60**: Temperate worlds with moderate climate zones
- **61-80**: Warm planets with reduced ice coverage
- **81-100**: Hot worlds with minimal to no ice caps

### Population (0-100)
- **0-20**: Uninhabited or sparsely populated worlds
- **21-40**: Low population with scattered settlements
- **41-60**: Moderate civilization with visible city lights
- **61-80**: High population with extensive urban areas
- **81-100**: Heavily urbanized worlds with bright night-side illumination

## Quality Levels

Habitable planets support three rendering quality levels:
- **Low**: Basic land/ocean rendering (2 noise iterations)
- **Medium**: Adds animated cloud systems (4 noise iterations)
- **High**: Adds night-time city lights (8 noise iterations)

## Usage

These catalog objects are referenced by system files to create planets with specific characteristics. The engine automatically selects the appropriate renderer based on the `engine_object` field and applies the habitability parameters to generate realistic planetary surfaces. 