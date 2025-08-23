const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const pool = require('../database/connection');
const logger = require('../utils/logger');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('user', 'admin').default('user'),
  status: Joi.string().valid('active', 'inactive').default('active')
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  email: Joi.string().email(),
  password: Joi.string().min(6),
  role: Joi.string().valid('user', 'admin'),
  status: Joi.string().valid('active', 'inactive')
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and return JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        },
        timestamp: new Date().toISOString()
      });
    }

    const { email, password } = value;

    // Get user from database
    const result = await pool.query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        },
        timestamp: new Date().toISOString()
      });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    logger.info(`User ${user.email} logged in successfully`);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
      message: 'Login successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 default: user
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: Email already exists
 */
router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        },
        timestamp: new Date().toISOString()
      });
    }

    const { name, email, password, role } = value;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already registered'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, passwordHash, role]
    );

    const newUser = result.rows[0];

    logger.info(`New user registered: ${newUser.email}`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      },
      message: 'User registered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/users/{id}:
 *   put:
 *     summary: Update user details
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Insufficient permissions
 */
router.put('/users/:id', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateUserSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id, email FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    // Build dynamic update query
    if (value.name !== undefined) {
      paramCount++;
      updateFields.push(`name = $${paramCount}`);
      updateValues.push(value.name);
    }

    if (value.email !== undefined) {
      // Check if email already exists (excluding current user)
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [value.email, id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email already registered'
          },
          timestamp: new Date().toISOString()
        });
      }

      paramCount++;
      updateFields.push(`email = $${paramCount}`);
      updateValues.push(value.email);
    }

    if (value.password !== undefined) {
      paramCount++;
      const passwordHash = await bcrypt.hash(value.password, 10);
      updateFields.push(`password_hash = $${paramCount}`);
      updateValues.push(passwordHash);
    }

    if (value.role !== undefined) {
      paramCount++;
      updateFields.push(`role = $${paramCount}`);
      updateValues.push(value.role);
    }

    if (value.status !== undefined) {
      paramCount++;
      updateFields.push(`status = $${paramCount}`);
      updateValues.push(value.status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_UPDATES',
          message: 'No fields to update'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Add updated_at and user id
    paramCount++;
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    // Update user
    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, email, role, status, created_at, updated_at
    `;

    const result = await pool.query(updateQuery, updateValues);
    const updatedUser = result.rows[0];

    logger.info(`User updated: ${updatedUser.email} (ID: ${id}) by user ${req.user.id}`);

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at
      },
      message: 'User updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/users/{id}:
 *   delete:
 *     summary: Delete user (soft delete)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/users/:id', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    const userToDelete = existingUser.rows[0];

    // Prevent deactivating the last admin user
    if (userToDelete.role === 'admin') {
      const adminCount = await pool.query(
        'SELECT COUNT(*) FROM users WHERE role = $1 AND status = $2',
        ['admin', 'active']
      );

      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'LAST_ADMIN',
            message: 'Cannot deactivate the last active admin user'
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    // Soft delete user by setting status to inactive
    const result = await pool.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, role, status, updated_at',
      ['inactive', id]
    );

    const deletedUser = result.rows[0];

    logger.info(`User deactivated: ${deletedUser.email} (ID: ${id}) by user ${req.user.id}`);

    res.json({
      success: true,
      data: {
        id: deletedUser.id,
        name: deletedUser.name,
        email: deletedUser.email,
        role: deletedUser.role,
        status: deletedUser.status,
        updatedAt: deletedUser.updated_at
      },
      message: 'User deactivated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Insufficient permissions
 */
router.get('/users', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { status = 'active' } = req.query;
    
    let query = 'SELECT id, name, email, role, status, last_login, created_at, updated_at FROM users';
    const queryParams = [];
    
    if (status && status !== 'all') {
      query += ' WHERE status = $1';
      queryParams.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, queryParams);

    const users = result.rows.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || 'active',
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));

    res.json({
      success: true,
      data: users,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/users:
 *   post:
 *     summary: Create new user (admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 default: user
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *     responses:
 *       201:
 *         description: User created successfully
 *       409:
 *         description: Email already exists
 *       403:
 *         description: Insufficient permissions
 */
router.post('/users', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        },
        timestamp: new Date().toISOString()
      });
    }

    const { name, email, password, role } = value;
    const status = req.body.status || 'active';

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already registered'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, status, created_at',
      [name, email, passwordHash, role, status]
    );

    const newUser = result.rows[0];

    logger.info(`New user created by admin: ${newUser.email} (ID: ${newUser.id})`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          createdAt: newUser.created_at
        }
      },
      message: 'User created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /auth/users/{id}/status:
 *   patch:
 *     summary: Toggle user status (admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Insufficient permissions
 */
router.patch('/users/:id/status', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be either "active" or "inactive"'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    const userToUpdate = existingUser.rows[0];

    // Prevent deactivating the last admin user
    if (status === 'inactive' && userToUpdate.role === 'admin') {
      const adminCount = await pool.query(
        'SELECT COUNT(*) FROM users WHERE role = $1 AND status = $2',
        ['admin', 'active']
      );

      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'LAST_ADMIN',
            message: 'Cannot deactivate the last active admin user'
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    // Update user status
    const result = await pool.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, role, status, updated_at',
      [status, id]
    );

    const updatedUser = result.rows[0];

    logger.info(`User status updated: ${updatedUser.email} (ID: ${id}) to ${status} by user ${req.user.id}`);

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        updatedAt: updatedUser.updated_at
      },
      message: 'User status updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
