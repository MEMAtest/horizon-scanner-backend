// Simple test API endpoint for Vercel
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.json({
    status: 'success',
    message: 'Simple test endpoint working',
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
    environment: process.env.NODE_ENV || 'unknown'
  });
};