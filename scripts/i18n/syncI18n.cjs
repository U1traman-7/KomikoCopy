#!/usr/bin/env node

/*
copy modelOptions.vidu to modelOptions.vidu_base

node scripts/synci18n.cjs \
 image-animation-generator  \
 modelOptions.vidu \
modelOptions.vidu_base
*/

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Usage: node synci18n.js <filename> <sourceKey> <newKey>');
  console.error('Example: node synci18n.js image-animation-generator modelOptions.vidu modelOptions.vidu_base');
  process.exit(1);
}

const filename = args[0];
const sourceKey = args[1];
const newKey = args[2];

const localesDir = path.join(process.cwd(), 'src', 'i18n', 'locales');

// Function to get nested value from an object using dot notation
function getNestedValue(obj, path) {
  return path.split('.').reduce((prev, curr) => prev && prev[curr], obj);
}

// Function to set nested value in an object using dot notation
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const lastObj = keys.reduce((prev, curr) => {
    if (!prev[curr]) prev[curr] = {};
    return prev[curr];
  }, obj);
  lastObj[lastKey] = value;
}

// Process each language directory
function processLanguageFiles() {
  // Get all language directories
  const langDirs = fs.readdirSync(localesDir)
    .filter(dir => fs.statSync(path.join(localesDir, dir)).isDirectory());

  let processed = 0;
  let errors = 0;

  langDirs.forEach(lang => {
    const filePath = path.join(localesDir, lang, `${filename}.json`);

    // Skip if file doesn't exist
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    try {
      // Read and parse the JSON file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(fileContent);

      // Get the value from source key
      const sourceValue = getNestedValue(data, sourceKey);

      if (sourceValue === undefined) {
        console.error(`Source key "${sourceKey}" not found in ${filePath}`);
        errors++;
        return;
      }

      // Set the new key with the same value
      setNestedValue(data, newKey, sourceValue);

      // Write the updated data back to the file
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`Updated ${lang}/${filename}.json: Added ${newKey} = ${JSON.stringify(sourceValue)}`);
      processed++;

    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
      errors++;
    }
  });

  console.log(`\nSummary: Processed ${processed} files with ${errors} errors.`);
}

processLanguageFiles();
