const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx')).map(f => path.join(dir, f));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;
  if (/text-primary/.test(content)) { content = content.replace(/text-primary/g, 'text-blue-600'); changed = true; }
  if (/bg-primary/.test(content)) { content = content.replace(/bg-primary/g, 'bg-blue-600'); changed = true; }
  if (/border-primary/.test(content)) { content = content.replace(/border-primary/g, 'border-blue-600'); changed = true; }
  if (/ring-primary/.test(content)) { content = content.replace(/ring-primary/g, 'ring-blue-600'); changed = true; }
  if (/shadow-primary/.test(content)) { content = content.replace(/shadow-primary/g, 'shadow-blue-600'); changed = true; }
  if (/text-primary-foreground/.test(content)) { content = content.replace(/text-primary-foreground/g, 'text-white'); changed = true; }
  
  if (changed) {
    fs.writeFileSync(file, content);
  }
});

const componentsDir = path.join(__dirname, 'src', 'components');
const scanRecursive = (d) => {
  const entries = fs.readdirSync(d, { withFileTypes: true });
  entries.forEach(entry => {
    const fullPath = path.join(d, entry.name);
    if (entry.isDirectory()) {
      scanRecursive(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let changed = false;
      if (/text-primary/.test(content)) { content = content.replace(/text-primary/g, 'text-blue-600'); changed = true; }
      if (/bg-primary/.test(content)) { content = content.replace(/bg-primary/g, 'bg-blue-600'); changed = true; }
      if (/border-primary/.test(content)) { content = content.replace(/border-primary/g, 'border-blue-600'); changed = true; }
      if (/ring-primary/.test(content)) { content = content.replace(/ring-primary/g, 'ring-blue-600'); changed = true; }
      if (/shadow-primary/.test(content)) { content = content.replace(/shadow-primary/g, 'shadow-blue-600'); changed = true; }
      if (/text-primary-foreground/.test(content)) { content = content.replace(/text-primary-foreground/g, 'text-white'); changed = true; }
      
      if (changed) {
         fs.writeFileSync(fullPath, content);
      }
    }
  });
}
scanRecursive(componentsDir);

console.log('Colors replaced successfully!');
