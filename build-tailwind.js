const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const inputFile = path.join(process.cwd(), 'src', 'tailwind.css');
const outputFile = path.join(process.cwd(), 'src', 'tailwind-output.css');

if (fs.existsSync(inputFile)) {
  console.log('Building Tailwind CSS...');
  try {
    execSync(`tailwindcss -i "${inputFile}" -o "${outputFile}" --minify`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✓ Tailwind CSS built successfully');
  } catch (error) {
    console.error('Error building Tailwind CSS:', error.message);
    process.exit(1);
  }
} else {
  console.log('⚠ tailwind.css not found, skipping Tailwind build');
  // Create an empty output file so the build doesn't fail
  if (!fs.existsSync(outputFile)) {
    fs.writeFileSync(outputFile, '/* Tailwind CSS output - file not generated */');
  }
}

