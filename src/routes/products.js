const express = require('express');
const Joi = require('joi');
const pool = require('../database/connection');
const { authenticateToken, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const productSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  description: Joi.string().allow('', null),
  sku: Joi.string().min(3).max(100).required(),
  categoryId: Joi.number().integer().positive().required(),
  price: Joi.number().positive().precision(2).required(),
  quantity: Joi.number().integer().min(0).default(0),
  lowStockThreshold: Joi.number().integer().min(0).default(10),
  supplierId: Joi.number().integer().positive().required()
});

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get paginated list of products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      minPrice,
      maxPrice,
      inStock
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = ['p.is_active = true'];
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      conditions.push(`(p.name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    if (category) {
      paramCount++;
      conditions.push(`p.category_id = $${paramCount}`);
      params.push(category);
    }

    if (minPrice) {
      paramCount++;
      conditions.push(`p.price >= $${paramCount}`);
      params.push(minPrice);
    }

    if (maxPrice) {
      paramCount++;
      conditions.push(`p.price <= $${paramCount}`);
      params.push(maxPrice);
    }

    if (inStock !== undefined) {
      if (inStock === 'true') {
        conditions.push('p.quantity > 0');
      } else {
        conditions.push('p.quantity = 0');
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM products p 
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get products
    const productsQuery = `
      SELECT 
        p.*,
        c.name as category_name,
        c.description as category_description,
        s.name as supplier_name,
        s.email as supplier_email,
        s.phone as supplier_phone,
        s.contact_person as supplier_contact_person
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    const productsResult = await pool.query(productsQuery, [...params, limit, offset]);

    const products = productsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      sku: row.sku,
      category: {
        id: row.category_id,
        name: row.category_name,
        description: row.category_description
      },
      price: parseFloat(row.price),
      quantity: row.quantity,
      lowStockThreshold: row.low_stock_threshold,
      supplierId: row.supplier_id,
      supplier: {
        id: row.supplier_id,
        name: row.supplier_name,
        email: row.supplier_email,
        phone: row.supplier_phone,
        contactPerson: row.supplier_contact_person
      },
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      data: {
        products,
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
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
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
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        p.*,
        c.name as category_name,
        c.description as category_description,
        s.name as supplier_name,
        s.email as supplier_email,
        s.phone as supplier_phone,
        s.contact_person as supplier_contact_person
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = $1 AND p.is_active = true
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    const product = result.rows[0];

    res.json({
      success: true,
      data: {
        id: product.id,
        name: product.name,
        description: product.description,
        sku: product.sku,
        category: {
          id: product.category_id,
          name: product.category_name,
          description: product.category_description
        },
        price: parseFloat(product.price),
        quantity: product.quantity,
        lowStockThreshold: product.low_stock_threshold,
        supplierId: product.supplier_id,
        supplier: {
          id: product.supplier_id,
          name: product.supplier_name,
          email: product.supplier_email,
          phone: product.supplier_phone,
          contactPerson: product.supplier_contact_person
        },
        isActive: product.is_active,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create new product
 *     tags: [Products]
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
 *               - sku
 *               - categoryId
 *               - price
 *               - supplierId
 *             properties:
 *               name:
 *                 type: string
 *               sku:
 *                 type: string
 *               categoryId:
 *                 type: integer
 *               price:
 *                 type: number
 *               quantity:
 *                 type: integer
 *               lowStockThreshold:
 *                 type: integer
 *               supplierId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post('/', authenticateToken, requireRole(['admin', 'user']), async (req, res, next) => {
  try {
    const { error, value } = productSchema.validate(req.body);
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

    const {
      name,
      description,
      sku,
      categoryId,
      price,
      quantity,
      lowStockThreshold,
      supplierId
    } = value;

    // Check if SKU already exists
    const existingProduct = await pool.query(
      'SELECT id FROM products WHERE sku = $1',
      [sku]
    );

    if (existingProduct.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'SKU_EXISTS',
          message: 'SKU already exists'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if category exists
    const categoryResult = await pool.query(
      'SELECT id FROM categories WHERE id = $1',
      [categoryId]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if supplier exists
    const supplierResult = await pool.query(
      'SELECT id FROM suppliers WHERE id = $1',
      [supplierId]
    );

    if (supplierResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SUPPLIER_NOT_FOUND',
          message: 'Supplier not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Create product
    const result = await pool.query(`
      INSERT INTO products (
        name, description, sku, category_id, price, quantity, 
        low_stock_threshold, supplier_id, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      name, description, sku, categoryId, price, quantity,
      lowStockThreshold, supplierId
    ]);

    const newProduct = result.rows[0];

    logger.info(`Product created: ${newProduct.name} (SKU: ${newProduct.sku}) by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: {
        id: newProduct.id,
        name: newProduct.name,
        description: newProduct.description,
        sku: newProduct.sku,
        categoryId: newProduct.category_id,
        price: parseFloat(newProduct.price),
        quantity: newProduct.quantity,
        lowStockThreshold: newProduct.low_stock_threshold,
        supplier: {
          id: newProduct.supplier_id,
          name: newProduct.supplier_name,
          email: newProduct.supplier_email,
          phone: newProduct.supplier_phone
        },
        createdAt: newProduct.created_at,
        updatedAt: newProduct.updated_at
      },
      message: 'Product created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
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
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 */
router.put('/:id', authenticateToken, requireRole(['admin', 'user']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = productSchema.validate(req.body);
    
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

    const {
      name,
      description,
      sku,
      categoryId,
      price,
      quantity,
      lowStockThreshold,
      supplierId
    } = value;

    // Check if product exists
    const existingProduct = await pool.query(
      'SELECT id FROM products WHERE id = $1 AND is_active = true',
      [id]
    );

    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if SKU already exists (excluding current product)
    const skuCheck = await pool.query(
      'SELECT id FROM products WHERE sku = $1 AND id != $2',
      [sku, id]
    );

    if (skuCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'SKU_EXISTS',
          message: 'SKU already exists'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Check if supplier exists
    const supplierResult = await pool.query(
      'SELECT id FROM suppliers WHERE id = $1',
      [supplierId]
    );

    if (supplierResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SUPPLIER_NOT_FOUND',
          message: 'Supplier not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Update product
    const result = await pool.query(`
      UPDATE products SET
        name = $1, description = $2, sku = $3, category_id = $4,
        price = $5, quantity = $6, low_stock_threshold = $7,
        supplier_id = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 AND is_active = true
      RETURNING *
    `, [
      name, description, sku, categoryId, price, quantity,
      lowStockThreshold, supplierId, id
    ]);

    const updatedProduct = result.rows[0];

    logger.info(`Product updated: ${updatedProduct.name} (ID: ${id}) by user ${req.user.id}`);

    res.json({
      success: true,
      data: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        description: updatedProduct.description,
        sku: updatedProduct.sku,
        categoryId: updatedProduct.category_id,
        price: parseFloat(updatedProduct.price),
        quantity: updatedProduct.quantity,
        lowStockThreshold: updatedProduct.low_stock_threshold,
        supplier: {
          id: updatedProduct.supplier_id,
          name: updatedProduct.supplier_name,
          email: updatedProduct.supplier_email,
          phone: updatedProduct.supplier_phone
        },
        updatedAt: updatedProduct.updated_at
      },
      message: 'Product updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete product (soft delete)
 *     tags: [Products]
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
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = true
      RETURNING id, name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    const deletedProduct = result.rows[0];

    logger.info(`Product deleted: ${deletedProduct.name} (ID: ${id}) by user ${req.user.id}`);

    res.json({
      success: true,
      data: {
        id: deletedProduct.id,
        name: deletedProduct.name
      },
      message: 'Product deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
