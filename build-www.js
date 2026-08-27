const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname);
const wwwDir = path.resolve(__dirname, 'www');

if (!fs.existsSync(wwwDir)) {
  fs.mkdirSync(wwwDir, { recursive: true });
}

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const stat = fs.lstatSync(path.join(from, element));
    if (stat.isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else if (stat.isDirectory() && element !== 'www' && element !== 'node_modules' && element !== 'dist-electron' && element !== 'android' && element !== 'ios' && element !== '.git') {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

// Copy essential web assets
const rootFiles = ['index.html', 'index.css', 'manifest.json', 'sw.js'];
rootFiles.forEach(file => {
  const src = path.join(rootDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(wwwDir, file));
  }
});

// Copy src directory
if (fs.existsSync(path.join(rootDir, 'src'))) {
  copyFolderSync(path.join(rootDir, 'src'), path.join(wwwDir, 'src'));
}

console.log('✅ Web assets successfully built into www/ directory for Capacitor & Electron.');
