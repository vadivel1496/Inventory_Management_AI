const request = require('supertest');
const app = require('../app');
const pool = require('../database/connection');
const bcrypt = require('bcryptjs');

let authToken;
let testCategoryId;
let testProductId;

describe('Analytics API', () => {
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
        name: 'Test Category for Analytics',
        description: 'Test category for analytics testing'
      });

    testCategoryId = categoryResponse.body.data.id;

    // Create test product
    const productResponse = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Product for Analytics',
        description: 'A test product for analytics',
        sku: 'ANALYTICS-001',
        category_id: testCategoryId,
        price: 49.99,
        quantity: 200,
        supplier_info: 'Test Supplier'
      });

    testProductId = productResponse.body.data.id;

    // Create some stock movements for analytics
    await request(app)
      .post('/api/v1/stock/update')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        product_id: testProductId,
        quantity: 50,
        movement_type: 'in',
        notes: 'Analytics test movement'
      });
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM stock_movements WHERE product_id = $1', [testProductId]);
    await pool.query('DELETE FROM products WHERE id = $1', [testProductId]);
    await pool.query('DELETE FROM categories WHERE id = $1', [testCategoryId]);
    await pool.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
    await pool.end();
  });

  describe('GET /api/v1/analytics/dashboard', () => {
    it('should get dashboard summary', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_products');
      expect(response.body.data).toHaveProperty('total_value');
      expect(response.body.data).toHaveProperty('low_stock_count');
      expect(response.body.data).toHaveProperty('out_of_stock_count');
      expect(response.body.data).toHaveProperty('recent_movements');
      expect(response.body.data).toHaveProperty('category_distribution');
      expect(response.body.data).toHaveProperty('top_products');

      // Check data types
      expect(typeof response.body.data.total_products).toBe('number');
      expect(typeof response.body.data.total_value).toBe('number');
      expect(typeof response.body.data.low_stock_count).toBe('number');
      expect(typeof response.body.data.out_of_stock_count).toBe('number');
      expect(Array.isArray(response.body.data.recent_movements)).toBe(true);
      expect(Array.isArray(response.body.data.category_distribution)).toBe(true);
      expect(Array.isArray(response.body.data.top_products)).toBe(true);
    });
  });

  describe('GET /api/v1/analytics/search', () => {
    it('should perform advanced product search', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/search?query=Analytics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data).toHaveProperty('total_count');
      expect(Array.isArray(response.body.data.products)).toBe(true);
      
      // Should find our test product
      const foundProduct = response.body.data.products.find(p => p.id === testProductId);
      expect(foundProduct).toBeDefined();
    });

    it('should search with multiple criteria', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/search?category_id=${testCategoryId}&min_price=40&max_price=60`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
      
      // All products should match the criteria
      response.body.data.products.forEach(product => {
        expect(product.category_id).toBe(testCategoryId);
        expect(product.price).toBeGreaterThanOrEqual(40);
        expect(product.price).toBeLessThanOrEqual(60);
      });
    });

    it('should search with stock level filters', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/search?stock_level=in_stock')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
      
      // All products should be in stock
      response.body.data.products.forEach(product => {
        expect(product.quantity).toBeGreaterThan(0);
      });
    });
  });

  describe('GET /api/v1/analytics/stock-value', () => {
    it('should get stock value report by category', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/stock-value')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach(category => {
        expect(category).toHaveProperty('category_name');
        expect(category).toHaveProperty('total_products');
        expect(category).toHaveProperty('total_quantity');
        expect(category).toHaveProperty('total_value');
        expect(typeof category.total_products).toBe('number');
        expect(typeof category.total_quantity).toBe('number');
        expect(typeof category.total_value).toBe('number');
      });
    });

    it('should filter stock value by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/v1/analytics/stock-value?start_date=${today}&end_date=${today}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/analytics/stock-movements', () => {
    it('should get stock movement report', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/stock-movements')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('movements');
      expect(response.body.data).toHaveProperty('summary');
      expect(Array.isArray(response.body.data.movements)).toBe(true);
      
      // Check summary properties
      expect(response.body.data.summary).toHaveProperty('total_in');
      expect(response.body.data.summary).toHaveProperty('total_out');
      expect(response.body.data.summary).toHaveProperty('net_change');
      expect(typeof response.body.data.summary.total_in).toBe('number');
      expect(typeof response.body.data.summary.total_out).toBe('number');
      expect(typeof response.body.data.summary.net_change).toBe('number');
    });

    it('should filter movements by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/v1/analytics/stock-movements?start_date=${today}&end_date=${today}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.movements)).toBe(true);
    });

    it('should filter movements by product', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/stock-movements?product_id=${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.movements)).toBe(true);
      
      // All movements should be for the specified product
      response.body.data.movements.forEach(movement => {
        expect(movement.product_id).toBe(testProductId);
      });
    });

    it('should filter movements by movement type', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/stock-movements?movement_type=in')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.movements)).toBe(true);
      
      // All movements should be of type 'in'
      response.body.data.movements.forEach(movement => {
        expect(movement.movement_type).toBe('in');
      });
    });
  });

  describe('GET /api/v1/analytics/category-performance', () => {
    it('should get category performance report', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/category-performance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach(category => {
        expect(category).toHaveProperty('category_name');
        expect(category).toHaveProperty('product_count');
        expect(category).toHaveProperty('total_value');
        expect(category).toHaveProperty('average_price');
        expect(category).toHaveProperty('low_stock_count');
        expect(typeof category.product_count).toBe('number');
        expect(typeof category.total_value).toBe('number');
        expect(typeof category.average_price).toBe('number');
        expect(typeof category.low_stock_count).toBe('number');
      });
    });
  });

  describe('GET /api/v1/analytics/supplier-analysis', () => {
    it('should get supplier analysis report', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/supplier-analysis')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach(supplier => {
        expect(supplier).toHaveProperty('supplier_name');
        expect(supplier).toHaveProperty('product_count');
        expect(supplier).toHaveProperty('total_value');
        expect(supplier).toHaveProperty('average_price');
        expect(typeof supplier.product_count).toBe('number');
        expect(typeof supplier.total_value).toBe('number');
        expect(typeof supplier.average_price).toBe('number');
      });
    });
  });
});
