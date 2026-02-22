const fs = require('fs');
const path = require('path');

const targetFilePath = path.resolve(
  __dirname,
  '../../node_modules/next-auth/utils/parse-url.js'
)
const oldString = 'http://localhost:3000/api/auth';
const newString = 'http://localhost:3000/v2/api/auth';

fs.readFile(targetFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading file: ${err}`);
    return;
  }

  const updatedData = data.replace(new RegExp(oldString), newString);

  fs.writeFile(targetFilePath, updatedData, 'utf8', (err) => {
    if (err) {
      console.error(`Error writing file: ${err}`);
    } else {
      console.log(`File updated successfully: ${targetFilePath}`);
    }
  });
});

const targetReactFilePath = path.resolve(__dirname, '../../node_modules/next-auth/react/index.js');

const oldFileReg = /isSupportingReturn\s*=\s*isCredentials\s*\|\|\s*isEmail/
const newFileString = 'isSupportingReturn = isCredentials || isEmail || options.preventRedirect'
fs.readFile(targetReactFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading file: ${err}`);
    return;
  }
  const updatedData = data.replace(oldFileReg, newFileString);
  fs.writeFile(targetReactFilePath, updatedData, 'utf8', (err) => {
    if (err) {
      console.error(`Error writing file: ${err}`);
    } else {
      console.log(`File updated successfully: ${targetFilePath}`);
    }
  });

})
