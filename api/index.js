// api/index.js
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import your services (adjust paths as needed)
let dbService, rssFetcher, aiAnalyzer;
try {
  dbService = require('../src/services/dbService');
  rssFetcher = require('../src/services/rssFetcher');
  aiAnalyzer = require('../src/services/aiAnalyzer');
} catch (error) {
  console.warn('Services not loaded:', error.message);
}

// Basic test route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'AI Regulatory Intelligence API',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'operational',
        database: dbService ? 'connected' : 'not initialized'
      }
    };
    res.json(health);
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message 
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// System status
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Updates endpoint
app.get('/api/updates', async (req, res) => {
  try {
    if (!dbService) {
      return res.json({ 
        success: true, 
        updates: [], 
        message: 'Database service not initialized' 
      });
    }
    
    const updates = await dbService.getAllUpdates();
    res.json({
      success: true,
      updates: updates.slice(0, 50), // Limit to 50
      count: updates.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      updates: [] 
    });
  }
});

// Dashboard page (HTML)
app.get('/dashboard', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>AI Regulatory Intelligence Dashboard</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #333; }
        .status { padding: 20px; background: #f0f0f0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 AI Regulatory Intelligence Dashboard</h1>
        <div class="status">
          <h2>System Status</h2>
          <p>✅ API is operational</p>
          <p>📊 Dashboard endpoint: /dashboard</p>
          <p>🔍 Health check: <a href="/api/health">/api/health</a></p>
          <p>🧪 Test endpoint: <a href="/api/test">/api/test</a></p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Export for Vercel
module.exports = app;