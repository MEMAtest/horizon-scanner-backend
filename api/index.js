// api/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IMPORTANT: Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Import your actual routes
let pageRoutes, apiRoutes;
try {
  pageRoutes = require('../src/routes/pageRoutes');
  apiRoutes = require('../src/routes/apiRoutes');
  
  // Use your actual routes
  app.use('/api', apiRoutes);
  app.use('/', pageRoutes); // This should serve your real dashboard
  
} catch (error) {
  console.error('Failed to load routes:', error);
  
  // Fallback routes only if your routes fail to load
  app.get('/dashboard', (req, res) => {
    res.send('Dashboard route not loaded - check pageRoutes.js');
  });
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', error: 'Routes not loaded' });
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

// Export for Vercel
module.exports = app;