// fix-json-fatf.js
const fs = require('fs');
const path = require('path');

const updatesFile = path.join(__dirname, 'data', 'updates.json');
const data = JSON.parse(fs.readFileSync(updatesFile, 'utf8'));

console.log(`Total updates: ${data.length}`);

// Remove any FATF fallback entries
const cleaned = data.filter(item => {
    if (item.authority === 'FATF') {
        const headline = item.headline || '';
        if (headline.includes('News Available') || 
            headline.includes('Updates Available') ||
            headline.includes('Check FATF')) {
            console.log(`Removing: ID ${item.id} - ${headline}`);
            return false;
        }
    }
    return true;
});

console.log(`\nRemoved ${data.length - cleaned.length} fallback entries`);

// Save cleaned data
fs.writeFileSync(updatesFile, JSON.stringify(cleaned, null, 2));

// Show remaining FATF items
const fatf = cleaned.filter(u => u.authority === 'FATF');
console.log(`\n${fatf.length} FATF items remain:`);
fatf.forEach(item => {
    console.log(`  ID ${item.id}: ${item.headline?.substring(0, 50)}...`);
});