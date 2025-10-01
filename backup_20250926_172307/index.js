// api/index.js
// Vercel serverless function entry point

// Set environment variables for Vercel BEFORE importing the app
process.env.VERCEL = '1';
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
}

try {
  // Set Vercel environment before importing
  process.env.VERCEL = '1';
  process.env.START_SERVER = 'false'; // Don't start the server, just export the app

  // Import the Express app from src/index.js
  const app = require('../src/index.js');

  console.log('✅ App loaded successfully for Vercel');

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
        <head>
          <title>Application Error</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
          <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ff6b6b;">⚠️ Application Loading Error</h1>
            <p style="color: #333; font-size: 18px;">The main application failed to load.</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <code style="color: #d73a49;">${error.message}</code>
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
            <p style="margin: 20px 0;">
              <a href="/api/health" style="color: #0066cc; text-decoration: none; padding: 10px 20px; border: 1px solid #0066cc; border-radius: 5px; display: inline-block; margin: 0 10px;">Check Health</a>
              <a href="/api/test" style="color: #0066cc; text-decoration: none; padding: 10px 20px; border: 1px solid #0066cc; border-radius: 5px; display: inline-block; margin: 0 10px;">Test API</a>
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Environment: ${process.env.NODE_ENV || 'unknown'}<br>
              Platform: Vercel
            </p>
          </div>
        </body>
      </html>
    `);
  });
  
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'error',
      message: 'Main application failed to load',
      error: error.message,
      environment: process.env.NODE_ENV || 'unknown',
      platform: 'vercel',
      timestamp: new Date().toISOString()
    });
  });
  
  app.get('/api/test', (req, res) => {
    res.json({
      message: 'Fallback API is running',
      error: 'Main application failed to load',
      environment: process.env.NODE_ENV || 'unknown',
      platform: 'vercel',
      timestamp: new Date().toISOString()
    });
  });
  
  // Add a root API endpoint
  app.get('/api', (req, res) => {
    res.json({
      status: 'error',
      message: 'Application failed to load properly',
      endpoints: ['/api/health', '/api/test'],
      error: error.message,
      timestamp: new Date().toISOString()
    });
  });
  
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      path: req.path,
      message: 'Main application is not loaded',
      availableEndpoints: ['/api/health', '/api/test', '/api'],
      timestamp: new Date().toISOString()
    });
  });
  
  module.exports = app;
}