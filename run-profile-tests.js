const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check that tests exist
const testFiles = [
  '__tests__/components/PlanetAlignment.test.tsx',
  '__tests__/components/OrbitalPathSpacing.test.tsx'
];

let allFilesExist = true;
for (const file of testFiles) {
  if (!fs.existsSync(path.join(process.cwd(), file))) {
    console.error(`Error: Test file not found: ${file}`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  process.exit(1);
}

console.log("🚀 Running profile mode tests...");

try {
  // Run Vitest tests specifically for the profile view mode tests
  execSync('npx vitest run __tests__/components/PlanetAlignment.test.tsx __tests__/components/OrbitalPathSpacing.test.tsx', 
    { stdio: 'inherit' });
  
  console.log("\n✅ All profile mode tests passed!");
  
  // Suggest checking the visual test page
  console.log("\n💡 For visual verification of orbital path spacing, run:");
  console.log("   npm run dev");
  console.log("   Then visit: http://localhost:3000/test-orbit-spacing");
} catch (error) {
  console.error("\n❌ Some tests failed. See output above for details.");
  process.exit(1);
} 