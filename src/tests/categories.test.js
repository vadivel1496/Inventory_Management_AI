const request = require('supertest');
const app = require('../app');
const pool = require('../database/connection');
const bcrypt = require('bcryptjs');

let authToken;
let testCategoryId;

describe('Categories API', () => {
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
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM products WHERE category_id = $1', [testCategoryId]);
    await pool.query('DELETE FROM categories WHERE id = $1', [testCategoryId]);
    await pool.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
    await pool.end();
  });

  describe('POST /api/v1/categories', () => {
    it('should create a new category', async () => {
      const categoryData = {
        name: 'Test Category',
        description: 'A test category for products'
      };

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(categoryData.name);
      expect(response.body.data.description).toBe(categoryData.description);
      expect(response.body.data.product_count).toBe(0);

      testCategoryId = response.body.data.id;
    });

    it('should return 400 for invalid category data', async () => {
      const invalidData = {
        name: '', // Empty name
        description: 123 // Invalid description type
      };

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.details.length).toBeGreaterThan(0);
    });

    it('should return 400 for duplicate category name', async () => {
      const duplicateData = {
        name: 'Test Category', // Same name as above
        description: 'Another test category'
      };

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/categories', () => {
    it('should get all categories with product counts', async () => {
      const response = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Check that each category has product_count property
      response.body.data.forEach(category => {
        expect(category).toHaveProperty('product_count');
        expect(typeof category.product_count).toBe('number');
      });
    });
  });

  describe('GET /api/v1/categories/:id', () => {
    it('should get a specific category', async () => {
      const response = await request(app)
        .get(`/api/v1/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testCategoryId);
      expect(response.body.data.name).toBe('Test Category');
      expect(response.body.data.product_count).toBe(0);
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .get('/api/v1/categories/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/categories/:id', () => {
    it('should update a category', async () => {
      const updateData = {
        name: 'Updated Test Category',
        description: 'Updated test category description'
      };

      const response = await request(app)
        .put(`/api/v1/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .put('/api/v1/categories/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    it('should delete a category with no products', async () => {
      const response = await request(app)
        .delete(`/api/v1/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 when trying to delete category with products', async () => {
      // First create a new category
      const categoryResponse = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Category with Products',
          description: 'Category that will have products'
        });

      const categoryId = categoryResponse.body.data.id;

      // Create a product in this category
      await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Product',
          description: 'A test product',
          sku: 'TEST-002',
          category_id: categoryId,
          price: 29.99,
          quantity: 100,
          supplier_info: 'Test Supplier'
        });

      // Try to delete the category
      const deleteResponse = await request(app)
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(400);
      expect(deleteResponse.body.success).toBe(false);
      expect(deleteResponse.body.error.message).toContain('Cannot delete category with associated products');

      // Clean up
      await pool.query('DELETE FROM products WHERE category_id = $1', [categoryId]);
      await pool.query('DELETE FROM categories WHERE id = $1', [categoryId]);
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .delete('/api/v1/categories/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
