// api/[...path].js
const app = require('../src/index.js');

export default function handler(req, res) {
  // Remove /api prefix if it exists
  if (req.url.startsWith('/api')) {
    req.url = req.url.slice(4);
  }
  
  return new Promise((resolve, reject) => {
    app(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}