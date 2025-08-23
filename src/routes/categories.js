const express = require('express');
const Joi = require('joi');
const pool = require('../database/connection');
const { authenticateToken, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const categorySchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  description: Joi.string().allow('', null)
});

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status = 'active' } = req.query;
    
    let query = `
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (status && status !== 'all') {
      query += ` AND c.status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }
    
    query += ` GROUP BY c.id ORDER BY c.name`;
    
    const result = await pool.query(query, queryParams);

    const categories = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      productCount: parseInt(row.product_count),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      data: categories,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
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
 *         description: Category details
 *       404:
 *         description: Category not found
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
      WHERE c.id = $1
      GROUP BY c.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    const category = result.rows[0];

    res.json({
      success: true,
      data: {
        id: category.id,
        name: category.name,
        description: category.description,
        productCount: parseInt(category.product_count),
        createdAt: category.created_at,
        updatedAt: category.updated_at
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create new category
 *     tags: [Categories]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 */
router.post('/', authenticateToken, requireRole(['admin', 'user']), async (req, res, next) => {
  try {
    const { error, value } = categorySchema.validate(req.body);
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

    const { name, description } = value;

    // Check if category already exists
    const existingCategory = await pool.query(
      'SELECT id FROM categories WHERE name = $1',
      [name]
    );

    if (existingCategory.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CATEGORY_EXISTS',
          message: 'Category already exists'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Create category
    const result = await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );

    const newCategory = result.rows[0];

    logger.info(`Category created: ${newCategory.name} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: {
        id: newCategory.id,
        name: newCategory.name,
        description: newCategory.description,
        createdAt: newCategory.created_at,
        updatedAt: newCategory.updated_at
      },
      message: 'Category created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update category
 *     tags: [Categories]
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
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 */
router.put('/:id', authenticateToken, requireRole(['admin', 'user']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = categorySchema.validate(req.body);
    
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

    const { name, description } = value;

    // Check if category exists
    const existingCategory = await pool.query(
      'SELECT id FROM categories WHERE id = $1',
      [id]
    );

    if (existingCategory.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if name already exists (excluding current category)
    const nameCheck = await pool.query(
      'SELECT id FROM categories WHERE name = $1 AND id != $2',
      [name, id]
    );

    if (nameCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CATEGORY_EXISTS',
          message: 'Category name already exists'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Update category
    const result = await pool.query(`
      UPDATE categories SET
        name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [name, description, id]);

    const updatedCategory = result.rows[0];

    logger.info(`Category updated: ${updatedCategory.name} (ID: ${id}) by user ${req.user.id}`);

    res.json({
      success: true,
      data: {
        id: updatedCategory.id,
        name: updatedCategory.name,
        description: updatedCategory.description,
        updatedAt: updatedCategory.updated_at
      },
      message: 'Category updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete category (soft delete)
 *     tags: [Categories]
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
 *         description: Category deactivated successfully
 *       404:
 *         description: Category not found
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const categoryResult = await pool.query(
      'SELECT id, name FROM categories WHERE id = $1',
      [id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Soft delete category by setting status to inactive
    const result = await pool.query(
      'UPDATE categories SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, name',
      ['inactive', id]
    );

    const deletedCategory = result.rows[0];

    logger.info(`Category deactivated: ${deletedCategory.name} (ID: ${id}) by user ${req.user.id}`);

    res.json({
      success: true,
      data: {
        id: deletedCategory.id,
        name: deletedCategory.name
      },
      message: 'Category deactivated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
