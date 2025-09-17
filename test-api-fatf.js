// test-api-fatf.js
const axios = require('axios');

async function testAPI() {
    try {
        // Test the API endpoint
        const response = await axios.get('http://localhost:3000/api/updates?authority=FATF&limit=5');
        const data = response.data;
        
        console.log(`\nAPI returned ${data.updates?.length || data.length} FATF items:\n`);
        
        const updates = data.updates || data;
        updates.forEach(item => {
            console.log(`ID ${item.id}: ${item.headline?.substring(0, 60)}...`);
        });
        
    } catch (error) {
        console.error('API test failed:', error.message);
    }
}

testAPI();