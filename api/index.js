// api/index.js
// Vercel serverless function entry point

try {
  // Import the Express app from src/index.js
  const app = require('../src/index.js');
  
  // Export for Vercel
  module.exports = app;
  
} catch (error) {
  console.error('Failed to load main application:', error);
  
  // Fallback if main app fails to load
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>⚠️ Application Loading Error</h1>
          <p>The main application failed to load.</p>
          <p>Error: ${error.message}</p>
          <hr>
          <p><a href="/api/health">Check Health</a> | <a href="/api/test">Test API</a></p>
        </body>
      </html>
    `);
  });
  
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'error',
      message: 'Main application failed to load',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  });
  
  app.get('/api/test', (req, res) => {
    res.json({
      message: 'Fallback API is running',
      error: 'Main application failed to load',
      timestamp: new Date().toISOString()
    });
  });
  
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      path: req.path,
      message: 'Main application is not loaded'
    });
  });
  
  module.exports = app;
}