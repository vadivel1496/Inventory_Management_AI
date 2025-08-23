const request = require('supertest');
const app = require('../app');
const pool = require('../database/connection');
const bcrypt = require('bcryptjs');

let authToken;
let testCategoryId;
let testProductId;

describe('Stock API', () => {
  beforeAll(async () => {
    // Create test user and get auth token
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    await pool.query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
      ['test@example.com', hashedPassword, 'admin']
    );

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpass123'
      });

    authToken = loginResponse.body.data.token;

    // Create test category
    const categoryResponse = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Category',
        description: 'Test category for stock testing'
      });

    testCategoryId = categoryResponse.body.data.id;

    // Create test product
    const productResponse = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Product for Stock',
        description: 'A test product for stock management',
        sku: 'STOCK-001',
        category_id: testCategoryId,
        price: 29.99,
        quantity: 100,
        supplier_info: 'Test Supplier'
      });

    testProductId = productResponse.body.data.id;
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM stock_movements WHERE product_id = $1', [testProductId]);
    await pool.query('DELETE FROM products WHERE id = $1', [testProductId]);
    await pool.query('DELETE FROM categories WHERE id = $1', [testCategoryId]);
    await pool.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
    await pool.end();
  });

  describe('POST /api/v1/stock/update', () => {
    it('should add stock to a product', async () => {
      const stockData = {
        product_id: testProductId,
        quantity: 50,
        movement_type: 'in',
        notes: 'Initial stock addition'
      };

      const response = await request(app)
        .post('/api/v1/stock/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send(stockData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.new_quantity).toBe(150); // 100 + 50
      expect(response.body.data.movement.quantity).toBe(50);
      expect(response.body.data.movement.movement_type).toBe('in');
      expect(response.body.data.movement.notes).toBe('Initial stock addition');
    });

    it('should remove stock from a product', async () => {
      const stockData = {
        product_id: testProductId,
        quantity: 30,
        movement_type: 'out',
        notes: 'Sales transaction'
      };

      const response = await request(app)
        .post('/api/v1/stock/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send(stockData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.new_quantity).toBe(120); // 150 - 30
      expect(response.body.data.movement.quantity).toBe(30);
      expect(response.body.data.movement.movement_type).toBe('out');
    });

    it('should return 400 for invalid movement type', async () => {
      const invalidData = {
        product_id: testProductId,
        quantity: 10,
        movement_type: 'invalid',
        notes: 'Invalid movement'
      };

      const response = await request(app)
        .post('/api/v1/stock/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for negative quantity', async () => {
      const invalidData = {
        product_id: testProductId,
        quantity: -10,
        movement_type: 'in',
        notes: 'Negative quantity'
      };

      const response = await request(app)
        .post('/api/v1/stock/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when trying to remove more stock than available', async () => {
      const invalidData = {
        product_id: testProductId,
        quantity: 200, // More than current stock (120)
        movement_type: 'out',
        notes: 'Too much stock removal'
      };

      const response = await request(app)
        .post('/api/v1/stock/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Insufficient stock');
    });

    it('should return 404 for non-existent product', async () => {
      const stockData = {
        product_id: 99999,
        quantity: 10,
        movement_type: 'in',
        notes: 'Non-existent product'
      };

      const response = await request(app)
        .post('/api/v1/stock/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send(stockData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/stock/low-stock', () => {
    it('should get products with low stock', async () => {
      // First, reduce stock to low level
      await request(app)
        .post('/api/v1/stock/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: testProductId,
          quantity: 100, // Reduce to 20 (120 - 100)
          movement_type: 'out',
          notes: 'Reduce to low stock'
        });

      const response = await request(app)
        .get('/api/v1/stock/low-stock')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Should include our test product with low stock
      const lowStockProduct = response.body.data.find(p => p.id === testProductId);
      expect(lowStockProduct).toBeDefined();
      expect(lowStockProduct.quantity).toBeLessThanOrEqual(20);
    });
  });

  describe('GET /api/v1/stock/out-of-stock', () => {
    it('should get products that are out of stock', async () => {
      // First, remove all stock
      await request(app)
        .post('/api/v1/stock/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: testProductId,
          quantity: 20, // Remove remaining stock
          movement_type: 'out',
          notes: 'Remove all stock'
        });

      const response = await request(app)
        .get('/api/v1/stock/out-of-stock')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Should include our test product with zero stock
      const outOfStockProduct = response.body.data.find(p => p.id === testProductId);
      expect(outOfStockProduct).toBeDefined();
      expect(outOfStockProduct.quantity).toBe(0);
    });
  });

  describe('GET /api/v1/stock/movements', () => {
    it('should get stock movements for a product', async () => {
      const response = await request(app)
        .get(`/api/v1/stock/movements?product_id=${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Check that all movements are for the correct product
      response.body.data.forEach(movement => {
        expect(movement.product_id).toBe(testProductId);
        expect(movement).toHaveProperty('quantity');
        expect(movement).toHaveProperty('movement_type');
        expect(movement).toHaveProperty('notes');
        expect(movement).toHaveProperty('created_at');
      });
    });

    it('should get stock movements with date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/v1/stock/movements?start_date=${today}&end_date=${today}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get stock movements by movement type', async () => {
      const response = await request(app)
        .get('/api/v1/stock/movements?movement_type=in')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Check that all movements are of type 'in'
      response.body.data.forEach(movement => {
        expect(movement.movement_type).toBe('in');
      });
    });
  });

  describe('GET /api/v1/stock/movements/:id', () => {
    it('should get a specific stock movement', async () => {
      // First get all movements to find one
      const movementsResponse = await request(app)
        .get(`/api/v1/stock/movements?product_id=${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const movementId = movementsResponse.body.data[0].id;

      const response = await request(app)
        .get(`/api/v1/stock/movements/${movementId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(movementId);
      expect(response.body.data.product_id).toBe(testProductId);
    });

    it('should return 404 for non-existent movement', async () => {
      const response = await request(app)
        .get('/api/v1/stock/movements/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
