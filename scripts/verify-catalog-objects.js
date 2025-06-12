#!/usr/bin/env node

/**
 * This script verifies that all objects defined in components/debug-viewer/object-catalog.ts
 * have corresponding entries in the appropriate JSON catalog files in public/data/engine/object-catalog/.
 * 
 * Usage: node scripts/verify-catalog-objects.js
 */

const fs = require('fs');
const path = require('path');

// Define paths
const objectCatalogPath = path.join(process.cwd(), 'components', 'debug-viewer', 'object-catalog.ts');
const engineCatalogDir = path.join(process.cwd(), 'public', 'data', 'engine', 'object-catalog');

// Helper function to extract object keys from object-catalog.ts
function extractObjectCatalogKeys() {
  try {
    const content = fs.readFileSync(objectCatalogPath, 'utf8');
    
    // Use a more robust regex that works with multi-line object definitions
    const objectKeysRegex = /['"]([^'"]+)['"]\s*:\s*{/g;
    const keys = [];
    let match;
    
    while ((match = objectKeysRegex.exec(content)) !== null) {
      // Make sure we're only capturing keys within the objectCatalog
      // This is a simple heuristic, assuming keys come after the objectCatalog declaration
      if (content.indexOf('export const objectCatalog') < match.index) {
        keys.push(match[1]);
      }
    }
    
    return keys;
  } catch (error) {
    console.error('❌ Error reading or parsing object-catalog.ts:', error);
    return [];
  }
}

// Load all catalog JSON files
function loadAllCatalogFiles() {
  const catalogFiles = {};
  
  try {
    const files = fs.readdirSync(engineCatalogDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    for (const file of jsonFiles) {
      const filePath = path.join(engineCatalogDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      try {
        catalogFiles[file] = JSON.parse(content);
      } catch (parseError) {
        console.error(`❌ Error parsing ${file}:`, parseError);
      }
    }
    
    return catalogFiles;
  } catch (error) {
    console.error('❌ Error reading catalog directory:', error);
    return {};
  }
}

// Check if a key exists in any catalog file
function findKeyInCatalogs(key, catalogs) {
  for (const [filename, catalogData] of Object.entries(catalogs)) {
    if (key in catalogData) {
      return { found: true, file: filename };
    }
  }
  
  return { found: false };
}

// Main verification function
function verifyCatalogObjects() {
  console.log('🔍 Verifying catalog objects...');
  
  const objectCatalogKeys = extractObjectCatalogKeys();
  console.log(`📋 Found ${objectCatalogKeys.length} objects in object-catalog.ts: ${objectCatalogKeys.join(', ')}`);
  
  const catalogFiles = loadAllCatalogFiles();
  console.log(`📂 Loaded ${Object.keys(catalogFiles).length} catalog JSON files: ${Object.keys(catalogFiles).join(', ')}`);
  
  let allFound = true;
  const missingObjects = [];
  
  for (const key of objectCatalogKeys) {
    const result = findKeyInCatalogs(key, catalogFiles);
    
    if (result.found) {
      console.log(`✅ Object '${key}' found in ${result.file}`);
    } else {
      console.error(`❌ Object '${key}' not found in any catalog file`);
      missingObjects.push(key);
      allFound = false;
    }
  }
  
  if (allFound) {
    console.log('🎉 All objects verified successfully!');
  } else {
    console.error(`❌ Missing ${missingObjects.length} objects: ${missingObjects.join(', ')}`);
    process.exit(1);
  }
}

// Run the verification
verifyCatalogObjects(); 