#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Real-world celestial body radii in kilometers
const REFERENCE_RADII_KM = {
  // Stars
  'sol': 695700,    // Sun radius
  'star': 695700,   // Default star radius
  
  // Planets
  'mercury': 2439.7,
  'venus': 6051.8,
  'earth': 6371.0,
  'mars': 3389.5,
  'jupiter': 69911,
  'saturn': 58232,
  'uranus': 25362,
  'neptune': 24622,
  
  // Moons
  'luna': 1737.4,      // Earth's moon
  'phobos': 22.2,      // Mars moon
  'deimos': 12.4,      // Mars moon
  'io': 1821.6,        // Jupiter moon
  'europa': 1560.8,    // Jupiter moon
  'ganymede': 2634.1,  // Jupiter moon
  'callisto': 2410.3,  // Jupiter moon
  'titan': 2574,       // Saturn moon
  'enceladus': 252.1,  // Saturn moon
  'mimas': 198.2,      // Saturn moon
  
  // Default sizes by classification
  'terrestrial': 6371.0,    // Earth-sized
  'gas_giant': 69911,       // Jupiter-sized
  'rocky_moon': 1737.4,     // Luna-sized
  'small_moon': 500,        // Small asteroid-sized
  'dwarf_planet': 1188,     // Pluto-sized
  'asteroid': 500,          // Small rocky body
  'belt': 1000,             // Asteroid belt object
};

// Function to determine radius based on object name and classification
function determineRadiusKm(objectName, classification, currentRadius) {
  const name = objectName.toLowerCase();
  
  // Check for specific named objects first
  for (const [key, radiusKm] of Object.entries(REFERENCE_RADII_KM)) {
    if (name.includes(key)) {
      return radiusKm;
    }
  }
  
  // Check by classification
  switch (classification) {
    case 'star':
      return REFERENCE_RADII_KM.star;
    case 'planet':
      // Try to determine if it's terrestrial or gas giant based on name
      if (name.includes('jupiter') || name.includes('saturn') || name.includes('uranus') || name.includes('neptune')) {
        return REFERENCE_RADII_KM.gas_giant;
      }
      return REFERENCE_RADII_KM.terrestrial;
    case 'moon':
      // Determine moon size based on current relative size
      if (currentRadius > 0.3) {
        return REFERENCE_RADII_KM.luna;
      } else if (currentRadius > 0.1) {
        return REFERENCE_RADII_KM.rocky_moon;
      } else {
        return REFERENCE_RADII_KM.small_moon;
      }
    case 'belt':
      return REFERENCE_RADII_KM.belt;
    case 'asteroid':
      return REFERENCE_RADII_KM.asteroid;
    default:
      // Fallback: try to scale current radius assuming it's in Earth radii
      return currentRadius * REFERENCE_RADII_KM.earth;
  }
}

// Function to process a single JSON file
function processSystemFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changesMade = false;
  
  for (const object of data.objects) {
    if (object.properties && typeof object.properties.radius === 'number') {
      const currentRadius = object.properties.radius;
      const newRadiusKm = determineRadiusKm(object.name, object.classification, currentRadius);
      
      if (newRadiusKm !== currentRadius) {
        console.log(`  ${object.name}: ${currentRadius} → ${newRadiusKm} km`);
        object.properties.radius = newRadiusKm;
        changesMade = true;
      }
    }
  }
  
  if (changesMade) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`  ✓ Updated ${filePath}`);
  } else {
    console.log(`  - No changes needed for ${filePath}`);
  }
}

// Function to find all system JSON files
function findSystemFiles(directory) {
  const files = [];
  
  function searchDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && entry.name === 'systems') {
        // Found a systems directory, look for JSON files
        const systemFiles = fs.readdirSync(fullPath)
          .filter(file => file.endsWith('.json'))
          .map(file => path.join(fullPath, file));
        files.push(...systemFiles);
      } else if (entry.isDirectory()) {
        searchDirectory(fullPath);
      }
    }
  }
  
  searchDirectory(directory);
  return files;
}

// Main execution
function main() {
  console.log('Standardizing celestial object radii to kilometers...\n');
  
  const dataDir = path.join(process.cwd(), 'public', 'data');
  const systemFiles = findSystemFiles(dataDir);
  
  if (systemFiles.length === 0) {
    console.log('No system files found!');
    return;
  }
  
  console.log(`Found ${systemFiles.length} system files:\n`);
  
  for (const file of systemFiles) {
    processSystemFile(file);
    console.log('');
  }
  
  console.log('✓ Radius standardization complete!');
  console.log('\nNext steps:');
  console.log('1. Review the changes to ensure they look correct');
  console.log('2. Update the view mode system to handle the new kilometer values');
  console.log('3. Test the system to ensure proper rendering');
}

// Run the script
main(); 