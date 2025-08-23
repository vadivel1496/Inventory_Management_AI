const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const pool = require('../database/connection');

describe('Authentication Endpoints', () => {
  let testUser;

  beforeAll(async () => {
    // Create test user
    const passwordHash = await bcrypt.hash('testpassword123', 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      ['Test User', 'test@example.com', passwordHash, 'user']
    );
    testUser = result.rows[0];
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
    await pool.query('DELETE FROM users WHERE email = $1', ['newuser@example.com']);
    await pool.end();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'newpassword123',
          role: 'user'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('newuser@example.com');
    });

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Duplicate User',
          email: 'test@example.com',
          password: 'password123',
          role: 'user'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Incomplete User'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
