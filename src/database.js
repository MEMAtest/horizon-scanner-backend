const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

// Set default structure if the database file is empty
db.defaults({ updates: [] }).write();

module.exports = db;