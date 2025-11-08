const fs = require('fs');
const path = require('path');

const publicPath = path.join(process.cwd(), 'public');
const indexHtmlPath = path.join(publicPath, 'index.html');

console.log('Verifying public folder...');
console.log('Current working directory:', process.cwd());
console.log('Public folder path:', publicPath);

if (!fs.existsSync(publicPath)) {
  console.error('ERROR: public folder does not exist!');
  process.exit(1);
}

if (!fs.existsSync(indexHtmlPath)) {
  console.error('ERROR: public/index.html does not exist!');
  process.exit(1);
}

console.log('✓ public folder exists');
console.log('✓ public/index.html exists');
console.log('Public folder contents:', fs.readdirSync(publicPath).join(', '));

