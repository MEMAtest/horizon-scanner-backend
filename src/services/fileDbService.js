// src/services/fileDbService.js
// This abstracts the original lowdb/file-based database
const path = require('path');
const { Low, JSONFile } = require('lowdb');

const dbPath = path.join(process.cwd(), 'db.json');
const adapter = new JSONFile(dbPath);
const db = new Low(adapter);

async function initialize() {
    await db.read();
    db.data = db.data || { updates: [] }; // Set default data if file is empty
    await db.write();
}

async function findUpdateByUrl(url) {
    await db.read();
    return db.data.updates.find(p => p.url === url);
}

async function addUpdate(update) {
    await db.read();
    db.data.updates.push(update);
    await db.write();
}

// LowDB doesn't have a direct 'get' and 'value' like the original code,
// this exposes the db object to be used like that.
module.exports = {
    initialize,
    findUpdateByUrl,
    addUpdate,
    get: (key) => {
        return {
            value: () => db.data[key]
        };
    }
};
