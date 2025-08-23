const request = require('supertest');
const app = require('../app');
const pool = require('../database/connection');
const bcrypt = require('bcryptjs');

let authToken;
let testCategoryId;
let testProductId;

describe('Products API', () => {
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
        description: 'Test category for products'
      });

    testCategoryId = categoryResponse.body.data.id;
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM products WHERE category_id = $1', [testCategoryId]);
    await pool.query('DELETE FROM categories WHERE id = $1', [testCategoryId]);
    await pool.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
    await pool.end();
  });

  describe('POST /api/v1/products', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product',
        sku: 'TEST-001',
        category_id: testCategoryId,
        price: 29.99,
        quantity: 100,
        supplier_info: 'Test Supplier'
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(productData.name);
      expect(response.body.data.sku).toBe(productData.sku);
      expect(response.body.data.price).toBe(productData.price);
      expect(response.body.data.quantity).toBe(productData.quantity);
      expect(response.body.data.category_id).toBe(testCategoryId);

      testProductId = response.body.data.id;
    });

    it('should return 400 for invalid product data', async () => {
      const invalidData = {
        name: '', // Empty name
        price: -10, // Negative price
        quantity: 'invalid' // Invalid quantity type
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.details.length).toBeGreaterThan(0);
    });

    it('should return 400 for duplicate SKU', async () => {
      const duplicateData = {
        name: 'Another Test Product',
        description: 'Another test product',
        sku: 'TEST-001', // Same SKU as above
        category_id: testCategoryId,
        price: 19.99,
        quantity: 50,
        supplier_info: 'Another Supplier'
      };

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/products', () => {
    it('should get all products with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/v1/products?category_id=' + testCategoryId)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.products.every(p => p.category_id === testCategoryId)).toBe(true);
    });

    it('should search products by name', async () => {
      const response = await request(app)
        .get('/api/v1/products?search=Test Product')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.products.some(p => p.name.includes('Test Product'))).toBe(true);
    });

    it('should filter by price range', async () => {
      const response = await request(app)
        .get('/api/v1/products?min_price=20&max_price=30')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.products.every(p => p.price >= 20 && p.price <= 30)).toBe(true);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should get a specific product', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testProductId);
      expect(response.body.data.name).toBe('Test Product');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/v1/products/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    it('should update a product', async () => {
      const updateData = {
        name: 'Updated Test Product',
        price: 39.99,
        quantity: 150
      };

      const response = await request(app)
        .put(`/api/v1/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.price).toBe(updateData.price);
      expect(response.body.data.quantity).toBe(updateData.quantity);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .put('/api/v1/products/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    it('should soft delete a product', async () => {
      const response = await request(app)
        .delete(`/api/v1/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted_at).toBeTruthy();
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .delete('/api/v1/products/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
