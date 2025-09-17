// init-json-files.js
const fs = require('fs').promises;
const path = require('path');

async function initJsonFiles() {
    const jsonDir = path.join(__dirname, 'data', 'json');
    const files = ['updates.json', 'enhanced-updates.json'];
    
    console.log('📁 Initializing JSON database files...');
    
    // Create directory
    await fs.mkdir(jsonDir, { recursive: true });
    
    for (const fileName of files) {
        const filePath = path.join(jsonDir, fileName);
        
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            const parsed = JSON.parse(data);
            
            if (!Array.isArray(parsed)) {
                console.log(`🔧 Fixing ${fileName} - converting to array`);
                await fs.writeFile(filePath, JSON.stringify([], null, 2));
            } else {
                console.log(`✅ ${fileName} is valid`);
            }
        } catch (error) {
            console.log(`📝 Creating ${fileName}`);
            await fs.writeFile(filePath, JSON.stringify([], null, 2));
        }
    }
    
    console.log('✅ JSON files initialized');
}

initJsonFiles();