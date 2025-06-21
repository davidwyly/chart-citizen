const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

/**
 * Recursively finds files in a directory that match a given pattern.
 * @param {string} startPath - The directory to start searching from.
 * @param {RegExp} filter - A regex to match against file names.
 * @returns {Promise<string[]>} A promise that resolves to an array of matching file paths.
 */
async function findInDir(startPath, filter) {
    let results = [];
    try {
        const files = await readdir(startPath);
        for (const file of files) {
            const filePath = path.join(startPath, file);
            // Ignore node_modules and __tests__ for this analysis
            if (filePath.includes('node_modules') || filePath.includes('__tests__')) {
                continue;
            }
            const fileStat = await stat(filePath);
            if (fileStat.isDirectory()) {
                results = results.concat(await findInDir(filePath, filter));
            } else if (filter.test(filePath)) {
                results.push(filePath);
            }
        }
    } catch (error) {
        if (error.code !== 'ENOENT') { // Ignore "not found" errors for optional directories
            console.error(`Error searching in directory ${startPath}:`, error);
        }
    }
    return results;
}

module.exports = { findInDir }; 