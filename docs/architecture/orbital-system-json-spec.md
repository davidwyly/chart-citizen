# Orbital System JSON Specification and Design

## Overview

This document defines the structure, schema, and rules for generating, parsing, and rendering orbital bodies in our solar system generator. It supports hierarchical relationships, complex barycenters, ring systems, belts, and unified property modeling for shaders and simulation.

---

## Object Categories

Each celestial object includes the following top-level fields:

* `id` (string): Unique identifier
* `name` (string): Human-readable name
* `classification` (string): What the object is (e.g., `planet`, `moon`, `belt`, `star`, `barycenter`)
* `geometry_type` (string): What geometry/shader family to render it with
* `orbit` (object): Orbital relationship and parameters (if applicable)
* `properties` (object): Unified block for physical, visual, and behavioral attributes
* `rings` (array, optional): Ring definitions for gas giants or rocky bodies
* `timeline` (array, optional): Chronological events associated with the object

---

## Geometry Types (`geometry_type`)

| Type          | Use For                                  | Geometry                      |
| ------------- | ---------------------------------------- | ----------------------------- |
| `terrestrial` | Earth-like planets, moons w/ atmospheres | Sphere + atmosphere shell     |
| `rocky`       | Moons, Mercury-like bodies               | Basic sphere                  |
| `gas_giant`   | Jupiter, Saturn, Neptune, etc.           | Banding + haze                |
| `star`        | Radiant body like the Sun                | Emissive sphere               |
| `compact`     | Neutron stars, white dwarfs              | Point/small sphere + effects  |
| `exotic`      | Black holes, pulsars, other phenomena    | Raymarched shader projections |
| `ring`        | Planet-attached ring system              | Flat disk                     |
| `belt`        | Asteroid/Kuiper belt                     | Donut/torus zone              |
| `none`        | Barycenters, jump points (not rendered)  | Invisible                     |

---

## Classification (`classification`)

| Value            | Description                     |
| ---------------- | ------------------------------- |
| `star`           | Primary stellar body            |
| `compact-object` | Neutron star, white dwarf, etc. |
| `planet`         | Major planet                    |
| `dwarf-planet`   | Pluto-like                      |
| `moon`           | Natural satellite               |
| `belt`           | Asteroid or Kuiper belt         |
| `ring`           | Planet-attached ring structure  |
| `barycenter`     | Virtual mass center             |

---

## Orbit Structure (`orbit`)

### For planets, moons, stars:

```json
"orbit": {
  "parent": "id-of-parent-body",
  "semi_major_axis": float,
  "eccentricity": float,
  "inclination": float,
  "orbital_period": float
}
```

### For belts:

```json
"orbit": {
  "parent": "id-of-parent-body",
  "inner_radius": float,
  "outer_radius": float,
  "inclination": float,
  "eccentricity": float
}
```

---

## Orbital Hierarchy and Complex Star Systems

To support complex systems like binaries and trinaries, a hierarchical structure is used:

1. **Each object has a `parent` field in its `orbit`, referencing another object or barycenter by ID.**
2. **Barycenters** may be defined implicitly or as dedicated non-physical `classification: "barycenter"` objects.
3. **Rendering and simulation** use the orbital tree to build transformations, motion, and physics.

### Example: HD 188753

* Star A is orbited by a close binary B+C pair.
* A barycenter exists between B and C.
* The BC barycenter orbits Star A.
* Planets may orbit:

  * Star A directly (S-type)
  * The BC barycenter (circumbinary)
  * The entire system (circumtriple)

```json
{
  "id": "star-a",
  "classification": "star",
  "geometry_type": "star",
  "position": [0, 0, 0],
  "properties": { ... }
},
{
  "id": "barycenter-bc",
  "classification": "barycenter",
  "geometry_type": "none"
},
{
  "id": "star-b",
  "orbit": { "parent": "barycenter-bc", ... }
},
{
  "id": "star-c",
  "orbit": { "parent": "barycenter-bc", ... }
},
{
  "id": "barycenter-system",
  "classification": "barycenter",
  "geometry_type": "none"
},
{
  "id": "barycenter-bc",
  "orbit": { "parent": "barycenter-system", ... }
},
{
  "id": "star-a",
  "orbit": { "parent": "barycenter-system", ... }
},
{
  "id": "planet-x",
  "classification": "planet",
  "geometry_type": "terrestrial",
  "orbit": { "parent": "barycenter-system", ... }
}
```

This model allows flexible support for binary stars, triple systems, circumbinary planets, moons of moons, and belts that orbit anything.

---

## Unified Properties Block (`properties`)

All bodies use a single `properties` object for physical and shader-driven data.

### Shared Physical Properties:

* `mass`: in Earth or solar units
* `radius`: in Earth or solar radii
* `temperature`: surface temperature (K)
* `rotation_period`: in hours
* `axial_tilt`: degrees
* `axial_wobble`: degrees (optional, for visuals)
* `geomagnetism`: 0–100 (affects auroras/magnetic fields)

### Shader-Driven Properties

#### Terrestrial Planets

* `water`: 0–100 (ocean/ice coverage)
* `tectonics`: 0–100 (terrain roughness)
* `flora`: 0–100 (vegetation tint)
* `population`: 0–100 (city lights/urban sprawl)
* `atmosphere`: 0–100 (visual shell thickness)

#### Rocky Bodies (e.g., Moons)

* `albedo`: 0–100 (surface reflectivity)
* `surface_variance`: 0–100 (bumpiness)
* `crater_density`: 0–100
* `regolith_depth`: 0–100
* `surface_color`: hex (e.g. "#aaaaaa")

#### Gas Giants

* `band_contrast`: 0–100
* `cloud_opacity`: 0–100
* `hue_shift`: 0–100 (color offset)

#### Stars

* `color_temperature`: 2000–40000 (Kelvin)
* `luminosity`: 0–100
* `solar_activity`: 0–100
* `corona_thickness`: 0–100
* `variability`: 0–100

#### Rings

* `density`: `sparse` | `moderate` | `dense`
* `opacity`: 0–100
* `composition`: \["ice", "rock", etc.]
* `color`: hex color
* `ring_gap`: 0–100

#### Belts

* `density`: `sparse` | `moderate` | `dense`
* `particle_size`: `small` | `medium` | `large`
* `composition`: \["rock", "ice", "metal"]
* `brightness`: 0–100
* `tint`: hex color

---

## Rings (optional, attached to planets)

```json
"rings": [
  {
    "id": "main-ring",
    "geometry_type": "ring",
    "name": "A Ring",
    "radius_start": float,
    "radius_end": float,
    "inclination": float,
    "density": "sparse|moderate|dense",
    "composition": ["ice", "rock"]
  }
]
```

---

## Timeline (optional, attached to any object)

```json
"timeline": [
  {
    "date": "YYYY-MM-DD",
    "title": "Event Title",
    "description": "A brief description of the event."
  },
  {
    "date": "YYYY-MM-DD",
    "title": "Another Event",
    "description": "More details about this historical point."
  }
]
```

---

## Example: Earth

```json
{
  "id": "earth",
  "name": "Earth",
  "classification": "planet",
  "geometry_type": "terrestrial",
  "orbit": {
    "parent": "sol-star",
    "semi_major_axis": 1.0,
    "eccentricity": 0.017,
    "inclination": 0.0,
    "orbital_period": 365
  },
  "properties": {
    "mass": 1.0,
    "radius": 1.0,
    "temperature": 288,
    "rotation_period": 24.0,
    "axial_tilt": 23.44,
    "axial_wobble": 2.4,
    "water": 71,
    "tectonics": 40,
    "flora": 60,
    "population": 80,
    "atmosphere": 80,
    "geomagnetism": 85
  }
}
```

---

## JSON Parsing and Generation

### Generation Logic:

* Assign `id`, `classification`, `geometry_type`
* Attach `orbit` and link `parent` by ID
* Generate `properties` based on type presets + random variation
* Optional: attach `rings` or other structures

### Rendering:

* Use `geometry_type` to select mesh/shader group
* Pass `properties` to GPU as uniform or parameter block
* Parent/child orbits driven by `orbit.parent`

---

## Future Considerations

* Procedural naming and object seeding
* Custom atmospheres or color palettes
* Time-based orbital updates or precession
* Nested barycenters and binary star systems