// Comprehensive Filter Testing Suite
// Tests all filter combinations for the Horizon Scanner app

const request = require('supertest');
const express = require('express');

// Mock setup
const app = express();
app.use(express.json());

// Import the API routes
const apiRoutes = require('../src/routes/apiRoutes');
app.use('/api', apiRoutes);

describe('Filter Functionality Tests', () => {
  describe('Single Filter Tests', () => {
    test('Authority filter - single value', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ authority: 'FCA' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.updates)).toBe(true);
      
      // Verify all results are from FCA
      if (response.body.updates.length > 0) {
        response.body.updates.forEach(update => {
          expect(update.authority).toBe('FCA');
        });
      }
    });

    test('Authority filter - multiple values', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ authority: 'FCA,Bank of England' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.updates)).toBe(true);
      
      // Verify all results are from specified authorities
      if (response.body.updates.length > 0) {
        response.body.updates.forEach(update => {
          expect(['FCA', 'Bank of England']).toContain(update.authority);
        });
      }
    });

    test('Sector filter - single value', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ sector: 'Banking' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.updates)).toBe(true);
    });

    test('Sector filter - multiple values', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ sector: 'Banking,Insurance' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.updates)).toBe(true);
    });

    test('Impact level filter - single value', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ impact: 'Significant' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.updates)).toBe(true);
      
      // Verify all results have Significant impact
      if (response.body.updates.length > 0) {
        response.body.updates.forEach(update => {
          expect(['Significant']).toContain(update.impactLevel || update.impact_level);
        });
      }
    });

    test('Impact level filter - multiple values', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ impact: 'Significant,Moderate' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.updates)).toBe(true);
    });

    test('Urgency filter - single value', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ urgency: 'High' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.updates)).toBe(true);
      
      // Verify all results have High urgency
      if (response.body.updates.length > 0) {
        response.body.updates.forEach(update => {
          expect(update.urgency).toBe('High');
        });
      }
    });

    test('Urgency filter - multiple values', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ urgency: 'High,Medium' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.updates)).toBe(true);
    });

    test('Search filter', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ search: 'regulation' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.updates)).toBe(true);
    });

    test('Date range filter - today', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ range: 'today' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.updates)).toBe(true);
    });

    test('Date range filter - week', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ range: 'week' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.updates)).toBe(true);
    });
  });

  describe('Combined Filter Tests', () => {
    test('Authority + Sector filters', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ 
          authority: 'FCA',
          sector: 'Banking'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.updates)).toBe(true);
    });

    test('Authority + Impact level filters', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ 
          authority: 'FCA',
          impact: 'Significant'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.updates)).toBe(true);
    });

    test('Sector + Urgency filters', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ 
          sector: 'Banking',
          urgency: 'High'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.updates)).toBe(true);
    });

    test('Impact + Urgency filters', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ 
          impact: 'Significant',
          urgency: 'High'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.updates)).toBe(true);
    });

    test('Authority + Sector + Impact filters', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ 
          authority: 'FCA',
          sector: 'Banking',
          impact: 'Significant'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.updates)).toBe(true);
    });

    test('All filters combined', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ 
          authority: 'FCA',
          sector: 'Banking',
          impact: 'Significant',
          urgency: 'High',
          search: 'regulation',
          range: 'week'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.updates)).toBe(true);
    });

    test('Search + Date range filters', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ 
          search: 'consultation',
          range: 'month'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.updates)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('Empty filters should return all updates', async () => {
      const response = await request(app)
        .get('/api/updates');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.updates)).toBe(true);
    });

    test('Invalid filter values should not cause errors', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ authority: 'NonexistentAuthority' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.updates)).toBe(true);
    });

    test('Limit parameter works correctly', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ limit: 5 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.updates)).toBe(true);
      expect(response.body.updates.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Response Format Tests', () => {
    test('Response should include required fields', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ limit: 1 });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('updates');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('Updates should have expected structure', async () => {
      const response = await request(app)
        .get('/api/updates')
        .query({ limit: 1 });
      
      if (response.body.updates.length > 0) {
        const update = response.body.updates[0];
        expect(update).toHaveProperty('id');
        expect(update).toHaveProperty('headline');
        expect(update).toHaveProperty('url');
        expect(update).toHaveProperty('authority');
      }
    });
  });
});

describe('Category Filter Tests', () => {
  test('High impact category filter', async () => {
    const response = await request(app)
      .get('/api/updates')
      .query({ category: 'high-impact' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('Today category filter', async () => {
    const response = await request(app)
      .get('/api/updates')
      .query({ category: 'today' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('This week category filter', async () => {
    const response = await request(app)
      .get('/api/updates')
      .query({ category: 'this-week' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('Consultations category filter', async () => {
    const response = await request(app)
      .get('/api/updates')
      .query({ category: 'consultations' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('Enforcement category filter', async () => {
    const response = await request(app)
      .get('/api/updates')
      .query({ category: 'enforcement' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('Deadlines category filter', async () => {
    const response = await request(app)
      .get('/api/updates')
      .query({ category: 'deadlines' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
