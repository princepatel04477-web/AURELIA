import fs from 'node:fs';

let content = fs.readFileSync('public/IMAGES.md', 'utf8');

// Update jewelry table header if not already updated
if (content.includes('| File | Role | Ratio | Section | Alt text |')) {
  content = content.replace(
    '| File | Role | Ratio | Section | Alt text |',
    '| File | Status | Role | Ratio | Section | Alt text |'
  ).replace(
    '|---|---|---|---|---|',
    '|---|---|---|---|---|---|'
  );
}

// Update cinematic table header if not already updated
if (content.includes('| File | Role | Ratio | Used by | Alt / note |')) {
  content = content.replace(
    '| File | Role | Ratio | Used by | Alt / note |',
    '| File | Status | Role | Ratio | Used by | Alt / note |'
  ).replace(
    '|---|---|---|---|---|',
    '|---|---|---|---|---|---|'
  );
}

const statusMap = {
  'featured-1.webp': 'DONE',
  'featured-2.webp': 'DONE',
  'featured-3.webp': 'NEEDS REVIEW',
  'featured-4.webp': 'DONE',
  'aurelia-solitaire-ring.jpg': 'DONE',
  'chapter-light.jpg': 'DONE',
  'chapter-stone.jpg': 'DONE',
  'chapter-fire.jpg': 'DONE',
  'chapter-hand.jpg': 'DONE',
  'atelier-hands.jpg': 'DONE',
  'gold-texture.jpg': 'DONE',
};

// Process each line in markdown tables
const lines = content.split('\n');
const newLines = lines.map((line) => {
  const match = line.match(/^\|\s*`([^`]+)`\s*\|\s*(DONE|NEEDS REVIEW|MISSING\s*\|)?(.*)$/);
  if (match) {
    const filename = match[1];
    const rest = match[3] || match[2] || '';
    // If it's a known table row
    if (filename.includes('.')) {
      const status = statusMap[filename] || 'MISSING';
      // Clean up rest to remove previous status if present
      const cleanRest = rest.replace(/^(DONE|NEEDS REVIEW|MISSING)\s*\|\s*/, '');
      return `| \`${filename}\` | ${status} | ${cleanRest}`;
    }
  }
  return line;
});

fs.writeFileSync('public/IMAGES.md', newLines.join('\n'), 'utf8');
console.log('Successfully updated IMAGES.md');
