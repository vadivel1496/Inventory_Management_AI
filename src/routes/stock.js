const express = require('express');
const Joi = require('joi');
const pool = require('../database/connection');
const { authenticateToken, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const stockMovementSchema = Joi.object({
  quantity: Joi.number().integer().positive().required(),
  type: Joi.string().valid('in', 'out').required(),
  reason: Joi.string().min(2).max(500).required(),
  reference: Joi.string().max(255).allow('', null),
  notes: Joi.string().max(1000).allow('', null)
});

/**
 * @swagger
 * /stock/products/{id}:
 *   post:
 *     summary: Update stock quantity for a product
 *     tags: [Stock]
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
 *               - quantity
 *               - type
 *               - reason
 *             properties:
 *               quantity:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [in, out]
 *               reason:
 *                 type: string
 *               reference:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *       400:
 *         description: Insufficient stock for out movement
 *       404:
 *         description: Product not found
 */
router.post('/products/:id', authenticateToken, requireRole(['admin', 'user']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = stockMovementSchema.validate(req.body);
    
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

    const { quantity, type, reason, reference, notes } = value;

    // Check if product exists
    const productResult = await pool.query(
      'SELECT id, name, quantity FROM products WHERE id = $1 AND is_active = true',
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    const product = productResult.rows[0];
    const currentQuantity = product.quantity;
    let newQuantity;

    if (type === 'in') {
      newQuantity = currentQuantity + quantity;
    } else {
      if (currentQuantity < quantity) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: `Insufficient stock. Available: ${currentQuantity}, Requested: ${quantity}`
          },
          timestamp: new Date().toISOString()
        });
      }
      newQuantity = currentQuantity - quantity;
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update product quantity
      await client.query(
        'UPDATE products SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newQuantity, id]
      );

      // Record stock movement
      await client.query(`
        INSERT INTO stock_movements (product_id, quantity, type, reason, reference, notes, user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [id, quantity, type, reason, reference, notes || '', req.user.id]);

      await client.query('COMMIT');

      logger.info(`Stock movement: ${type} ${quantity} units for product ${product.name} (ID: ${id}) by user ${req.user.id}`);

      res.json({
        success: true,
        data: {
          productId: id,
          productName: product.name,
          previousQuantity: currentQuantity,
          newQuantity,
          movement: {
            quantity,
            type,
            reason,
            reference
          }
        },
        message: 'Stock updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /stock/low-stock:
 *   get:
 *     summary: Get products below low stock threshold
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of low stock products
 */
router.get('/low-stock', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.quantity,
        p.low_stock_threshold,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true AND p.quantity <= p.low_stock_threshold
      ORDER BY p.quantity ASC
    `);

    const lowStockProducts = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      quantity: row.quantity,
      lowStockThreshold: row.low_stock_threshold,
      category: row.category_name,
      status: row.quantity === 0 ? 'out_of_stock' : 'low_stock'
    }));

    res.json({
      success: true,
      data: {
        products: lowStockProducts,
        count: lowStockProducts.length,
        outOfStock: lowStockProducts.filter(p => p.status === 'out_of_stock').length,
        lowStock: lowStockProducts.filter(p => p.status === 'low_stock').length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /stock/movements:
 *   get:
 *     summary: Get stock movement history
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [in, out]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Stock movement history
 */
router.get('/movements', authenticateToken, async (req, res, next) => {
  try {
    const {
      productId,
      type,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramCount = 0;

    if (productId) {
      paramCount++;
      conditions.push(`sm.product_id = $${paramCount}`);
      params.push(productId);
    }

    if (type) {
      paramCount++;
      conditions.push(`sm.type = $${paramCount}`);
      params.push(type);
    }

    if (startDate) {
      paramCount++;
      conditions.push(`sm.created_at >= $${paramCount}`);
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      conditions.push(`sm.created_at <= $${paramCount}`);
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM stock_movements sm
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get movements
    const movementsQuery = `
      SELECT 
        sm.*,
        p.name as product_name,
        p.sku as product_sku,
        u.name as user_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      ${whereClause}
      ORDER BY sm.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    const movementsResult = await pool.query(movementsQuery, [...params, limit, offset]);

    const movements = movementsResult.rows.map(row => ({
      id: row.id,
      product: {
        id: row.product_id,
        name: row.product_name,
        sku: row.product_sku
      },
      quantity: row.quantity,
      type: row.type,
      reason: row.reason,
      reference: row.reference,
      user: {
        id: row.user_id,
        name: row.user_name
      },
      createdAt: row.created_at
    }));

    res.json({
      success: true,
      data: {
        movements,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /stock/products/{id}/movements:
 *   get:
 *     summary: Get stock movements for a specific product
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Product stock movements
 *       404:
 *         description: Product not found
 */
router.get('/products/:id/movements', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Check if product exists
    const productResult = await pool.query(
      'SELECT id, name, sku FROM products WHERE id = $1 AND is_active = true',
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    const product = productResult.rows[0];

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM stock_movements WHERE product_id = $1',
      [id]
    );
    const total = parseInt(countResult.rows[0].count);

    // Get movements
    const movementsResult = await pool.query(`
      SELECT 
        sm.*,
        u.name as user_name
      FROM stock_movements sm
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.product_id = $1
      ORDER BY sm.created_at DESC
      LIMIT $2 OFFSET $3
    `, [id, limit, offset]);

    const movements = movementsResult.rows.map(row => ({
      id: row.id,
      quantity: row.quantity,
      type: row.type,
      reason: row.reason,
      reference: row.reference,
      user: {
        id: row.user_id,
        name: row.user_name
      },
      createdAt: row.created_at
    }));

    res.json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku
        },
        movements,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /stock/movements/{id}:
 *   get:
 *     summary: Get a specific stock movement by ID
 *     tags: [Stock]
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
 *         description: Stock movement details
 *       404:
 *         description: Stock movement not found
 */
router.get('/movements/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        sm.*,
        p.name as product_name,
        p.sku as product_sku,
        u.name as user_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MOVEMENT_NOT_FOUND',
          message: 'Stock movement not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    const row = result.rows[0];
    const movement = {
      id: row.id,
      product: {
        id: row.product_id,
        name: row.product_name,
        sku: row.product_sku
      },
      quantity: row.quantity,
      type: row.type,
      reason: row.reason,
      reference: row.reference,
      notes: row.notes,
      user: {
        id: row.user_id,
        name: row.user_name
      },
      createdAt: row.created_at
    };

    res.json({
      success: true,
      data: movement,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /stock/movements/{id}:
 *   put:
 *     summary: Update a stock movement
 *     tags: [Stock]
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
 *               - quantity
 *               - type
 *               - reason
 *             properties:
 *               quantity:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [in, out]
 *               reason:
 *                 type: string
 *               reference:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock movement updated successfully
 *       404:
 *         description: Stock movement not found
 *       400:
 *         description: Validation error or insufficient stock
 */
router.put('/movements/:id', authenticateToken, requireRole(['admin', 'user']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = stockMovementSchema.validate(req.body);
    
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

    const { quantity, type, reason, reference } = value;
    const notes = req.body.notes || '';

    // Get the existing movement
    const existingMovementResult = await pool.query(
      'SELECT sm.*, p.quantity as current_quantity FROM stock_movements sm JOIN products p ON sm.product_id = p.id WHERE sm.id = $1',
      [id]
    );

    if (existingMovementResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MOVEMENT_NOT_FOUND',
          message: 'Stock movement not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    const existingMovement = existingMovementResult.rows[0];
    const currentProductQuantity = existingMovement.current_quantity;

    // Calculate what the product quantity would be if we reverse the old movement
    let quantityAfterReversal;
    if (existingMovement.type === 'in') {
      quantityAfterReversal = currentProductQuantity - existingMovement.quantity;
    } else {
      quantityAfterReversal = currentProductQuantity + existingMovement.quantity;
    }

    // Calculate what the new quantity would be with the new movement
    let finalQuantity;
    if (type === 'in') {
      finalQuantity = quantityAfterReversal + quantity;
    } else {
      if (quantityAfterReversal < quantity) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: `Insufficient stock. Available after reversal: ${quantityAfterReversal}, Requested: ${quantity}`
          },
          timestamp: new Date().toISOString()
        });
      }
      finalQuantity = quantityAfterReversal - quantity;
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update the stock movement
      await client.query(`
        UPDATE stock_movements 
        SET quantity = $1, type = $2, reason = $3, reference = $4, notes = $5, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $6
      `, [quantity, type, reason, reference, notes, id]);

      // Update product quantity
      await client.query(
        'UPDATE products SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [finalQuantity, existingMovement.product_id]
      );

      await client.query('COMMIT');

      logger.info(`Stock movement updated: ID ${id} by user ${req.user.id}`);

      res.json({
        success: true,
        data: {
          movementId: id,
          productId: existingMovement.product_id,
          previousQuantity: currentProductQuantity,
          newQuantity: finalQuantity,
          movement: {
            quantity,
            type,
            reason,
            reference,
            notes
          }
        },
        message: 'Stock movement updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /stock/movements/{id}:
 *   delete:
 *     summary: Delete a stock movement (admin only)
 *     tags: [Stock]
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
 *         description: Stock movement deleted successfully
 *       404:
 *         description: Stock movement not found
 *       403:
 *         description: Insufficient permissions
 *       400:
 *         description: Cannot delete movement that would result in negative stock
 */
router.delete('/movements/:id', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get the stock movement details
    const movementResult = await pool.query(
      'SELECT sm.*, p.name as product_name, p.quantity as current_quantity FROM stock_movements sm JOIN products p ON sm.product_id = p.id WHERE sm.id = $1',
      [id]
    );

    if (movementResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MOVEMENT_NOT_FOUND',
          message: 'Stock movement not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    const movement = movementResult.rows[0];
    const currentQuantity = movement.current_quantity;
    let newQuantity;

    // Calculate what the quantity would be after reversing this movement
    if (movement.type === 'in') {
      newQuantity = currentQuantity - movement.quantity;
    } else {
      newQuantity = currentQuantity + movement.quantity;
    }

    // Check if deletion would result in negative stock
    if (newQuantity < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NEGATIVE_STOCK',
          message: 'Cannot delete movement that would result in negative stock'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update product quantity
      await client.query(
        'UPDATE products SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newQuantity, movement.product_id]
      );

      // Delete the stock movement
      await client.query('DELETE FROM stock_movements WHERE id = $1', [id]);

      await client.query('COMMIT');

      logger.info(`Stock movement deleted: ${movement.type} ${movement.quantity} units for product ${movement.product_name} (ID: ${movement.product_id}) by user ${req.user.id}`);

      res.json({
        success: true,
        data: {
          movementId: id,
          productId: movement.product_id,
          productName: movement.product_name,
          previousQuantity: currentQuantity,
          newQuantity,
          deletedMovement: {
            quantity: movement.quantity,
            type: movement.type,
            reason: movement.reason
          }
        },
        message: 'Stock movement deleted successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
