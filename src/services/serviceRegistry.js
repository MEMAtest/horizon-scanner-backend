// src/services/serviceRegistry.js
const services = {};

// Safely load services
try {
    services.analytics = require('./analyticsService');
} catch (e) {
    console.log('Analytics service not available');
}

try {
    services.relevance = require('./relevanceService');
} catch (e) {
    console.log('Relevance service not available');
}

try {
    services.workspace = require('./workspaceService');
} catch (e) {
    console.log('Workspace service not available');
}

try {
    services.aiIntelligence = require('./aiIntelligenceService');
} catch (e) {
    console.log('AI Intelligence service not available');
}

module.exports = services;