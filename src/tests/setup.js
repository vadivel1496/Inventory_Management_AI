require('dotenv').config();

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test_user:test_pass@localhost:5432/test_inventory_db';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Global test timeout
jest.setTimeout(10000);
