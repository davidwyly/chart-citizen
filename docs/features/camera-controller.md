# Camera Controller

The camera controller manages the camera's position, orientation, and behavior in the 3D space, with special handling for different view modes and object types.

## Features

### Object Following
- Smoothly follows selected objects
- Maintains appropriate distance based on object type and size
- Adjusts focus distance based on view mode
- Handles transitions between different object types

### View Mode Support
- Adapts camera behavior to current view mode
- Adjusts distance and orientation for each mode
- Maintains proper perspective for different layouts

### Distance Management
- Calculates minimum and maximum distances based on object size
- Prevents camera from getting too close or too far
- Adjusts distance multipliers for different object types

## Distance Calculation

The camera uses a sophisticated distance calculation system that takes into account:

1. Object's actual size (radius)
2. Object's visual size (scaled for view mode)
3. Object type (star, planet, moon)
4. Current view mode
5. System scale factor

### Base Distances
```typescript
const baseDistances = {
  min: 5,      // Minimum distance in units
  max: 100,    // Maximum distance in units
  default: 20  // Default distance in units
};
```

### Object Type Multipliers
- Stars: 8x multiplier (larger distance due to visual effects)
- Planets: 1x multiplier (standard distance)
- Moons: 0.5x multiplier (closer distance)

### View Mode Adjustments
- Realistic: Uses actual object sizes
- Navigational: Increases distances for better overview
- Profile: Adjusts for horizontal layout

## Camera Behavior

### Following Objects
1. Calculates target position based on object's position
2. Determines appropriate distance based on object type and size
3. Smoothly interpolates to new position
4. Maintains proper orientation relative to object

### Distance Constraints
- Minimum distance prevents camera from entering objects
- Maximum distance maintains visibility of the system
- Smooth transitions between distance changes

### View Mode Transitions
- Adjusts camera position and orientation for each mode
- Maintains focus on current object during transition
- Smoothly interpolates between view modes

## Usage

The camera controller is used to:
1. Follow selected objects
2. Maintain proper viewing distance
3. Handle view mode transitions
4. Provide smooth camera movement
5. Ensure proper object visibility

## Benefits

The camera system provides:
1. Smooth and intuitive camera movement
2. Proper object visibility in all view modes
3. Appropriate distances for different object types
4. Seamless transitions between objects and views
5. Consistent user experience across the application 