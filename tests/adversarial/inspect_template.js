const path = require('path');
process.env.NODE_PATH = path.resolve(__dirname, '../../rps-form-app/node_modules');
require('module').Module._initPaths();

const fs = require('fs');
const PizZip = require('pizzip');

const templatePath = path.resolve(__dirname, '../../rps-form-app/templates/processed/rps-template-processed.docx');
console.log('Template path:', templatePath);

if (!fs.existsSync(templatePath)) {
  console.error('Template does not exist!');
  process.exit(1);
}

const content = fs.readFileSync(templatePath, 'binary');
const zip = new PizZip(content);
const docXml = zip.file('word/document.xml').asText();

// Find all tags matching {{...}}
const matches = docXml.match(/\{\{[^}]+\}\}/g) || [];
console.log('Found tags count:', matches.length);
console.log('Unique tags:', Array.from(new Set(matches)));
