// Script to replace all instances of 'game' with 'profile' in test files
const fs = require('fs');
const path = require('path');

// Function to replace 'game' with 'profile' in a file
function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Only replace when 'game' is a ViewMode or Mode value, not in other contexts
    const replacedContent = content
      // Replace exact ViewMode string values
      .replace(/'game'/g, "'profile'")
      .replace(/"game"/g, '"profile"')
      // Replace exact 'game' references in functions and properties
      .replace(/\.game/g, '.profile')
      .replace(/\bgame\b(?=:)/g, 'profile')
      .replace(/\bgame\b(?=Mode)/g, 'profile')
      .replace(/\bgame\b(?=View)/g, 'profile')
      .replace(/\bgame\b(?=Info)/g, 'profile');
    
    if (content !== replacedContent) {
      fs.writeFileSync(filePath, replacedContent);
      console.log(`Updated: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Helper to scan directories recursively
function findTestFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTestFiles(filePath, fileList);
    } else if (
      (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) && 
      !filePath.includes('node_modules')
    ) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

let updatedCount = 0;
const testDirs = ['__tests__', 'src'];

// Find and process all test files
const allTestFiles = [];
testDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    findTestFiles(dir, allTestFiles);
  }
});

// Process each file
allTestFiles.forEach(filePath => {
  if (replaceInFile(filePath)) {
    updatedCount++;
  }
});

console.log(`Updated ${updatedCount} files.`); 