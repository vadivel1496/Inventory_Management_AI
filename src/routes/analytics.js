const express = require('express');
const pool = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get dashboard analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics data
 */
router.get('/dashboard', authenticateToken, async (req, res, next) => {
  try {
    // Get total products
    const totalProductsResult = await pool.query(
      'SELECT COUNT(*) FROM products WHERE is_active = true'
    );
    const totalProducts = parseInt(totalProductsResult.rows[0].count);

    // Get total categories
    const totalCategoriesResult = await pool.query(
      'SELECT COUNT(*) FROM categories WHERE status = \'active\''
    );
    const totalCategories = parseInt(totalCategoriesResult.rows[0].count);

    // Get total suppliers
    const totalSuppliersResult = await pool.query(
      'SELECT COUNT(*) FROM suppliers WHERE status = \'active\''
    );
    const totalSuppliers = parseInt(totalSuppliersResult.rows[0].count);

    // Get total users
    const totalUsersResult = await pool.query(
      'SELECT COUNT(*) FROM users WHERE status = \'active\''
    );
    const totalUsers = parseInt(totalUsersResult.rows[0].count);

    // Get total inventory value
    const totalValueResult = await pool.query(`
      SELECT COALESCE(SUM(price * quantity), 0) as total_value
      FROM products 
      WHERE is_active = true
    `);
    const totalValue = parseFloat(totalValueResult.rows[0].total_value);

    // Get low stock items
    const lowStockResult = await pool.query(`
      SELECT COUNT(*) 
      FROM products 
      WHERE is_active = true AND quantity <= low_stock_threshold AND quantity > 0
    `);
    const lowStockItems = parseInt(lowStockResult.rows[0].count);

    // Get out of stock items
    const outOfStockResult = await pool.query(`
      SELECT COUNT(*) 
      FROM products 
      WHERE is_active = true AND quantity = 0
    `);
    const outOfStockItems = parseInt(outOfStockResult.rows[0].count);

    // Get recent stock movements
    const recentMovementsResult = await pool.query(`
      SELECT 
        sm.*,
        p.name as product_name,
        p.sku as product_sku,
        u.name as user_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      ORDER BY sm.created_at DESC
      LIMIT 10
    `);

    const recentMovements = recentMovementsResult.rows.map(row => ({
      id: row.id,
      product: {
        id: row.product_id,
        name: row.product_name,
        sku: row.product_sku
      },
      quantity: row.quantity,
      type: row.type,
      reason: row.reason,
      user: {
        id: row.user_id,
        name: row.user_name
      },
      createdAt: row.created_at
    }));

    // Get category distribution
    const categoryDistributionResult = await pool.query(`
      SELECT 
        c.name as category_name,
        COUNT(p.id) as product_count,
        COALESCE(SUM(p.price * p.quantity), 0) as category_value
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
      GROUP BY c.id, c.name
      ORDER BY product_count DESC
    `);

    const categoryDistribution = categoryDistributionResult.rows.map(row => ({
      category: row.category_name,
      productCount: parseInt(row.product_count),
      value: parseFloat(row.category_value)
    }));

    // Get top products by value
    const topProductsResult = await pool.query(`
      SELECT 
        id,
        name,
        sku,
        quantity,
        price,
        (price * quantity) as total_value
      FROM products 
      WHERE is_active = true
      ORDER BY (price * quantity) DESC
      LIMIT 10
    `);

    const topProducts = topProductsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      quantity: row.quantity,
      price: parseFloat(row.price),
      totalValue: parseFloat(row.total_value)
    }));

    res.json({
      success: true,
      data: {
        totalProducts,
        totalCategories,
        totalSuppliers,
        totalUsers,
        totalValue,
        lowStockItems,
        outOfStockItems,
        recentMovements,
        categoryDistribution,
        topProducts
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /analytics/search:
 *   get:
 *     summary: Advanced search with multiple criteria
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', authenticateToken, async (req, res, next) => {
  try {
    const { q, fields, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SEARCH_QUERY_REQUIRED',
          message: 'Search query is required'
        },
        timestamp: new Date().toISOString()
      });
    }

    let searchFields = ['name', 'sku', 'description'];
    if (fields) {
      searchFields = fields.split(',').map(field => field.trim());
    }

    const searchConditions = searchFields.map(field => {
      if (field === 'name' || field === 'sku' || field === 'description') {
        return `p.${field} ILIKE $1`;
      }
      return null;
    }).filter(Boolean);

    if (searchConditions.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SEARCH_FIELDS',
          message: 'Invalid search fields'
        },
        timestamp: new Date().toISOString()
      });
    }

    const whereClause = `WHERE p.is_active = true AND (${searchConditions.join(' OR ')})`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM products p
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, [`%${q}%`]);
    const total = parseInt(countResult.rows[0].count);

    // Get search results
    const searchQuery = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN p.name ILIKE $1 THEN 1
          WHEN p.sku ILIKE $1 THEN 2
          ELSE 3
        END,
        p.name
      LIMIT $2 OFFSET $3
    `;
    
    const searchResult = await pool.query(searchQuery, [`%${q}%`, limit, offset]);

    const products = searchResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      sku: row.sku,
      category: {
        id: row.category_id,
        name: row.category_name
      },
      price: parseFloat(row.price),
      quantity: row.quantity,
      lowStockThreshold: row.low_stock_threshold,
      supplier: {
        name: row.supplier_name,
        email: row.supplier_email,
        phone: row.supplier_phone
      },
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      data: {
        query: q,
        fields: searchFields,
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
 * /analytics/reports/stock-value:
 *   get:
 *     summary: Get stock value report by category
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stock value report
 */
router.get('/reports/stock-value', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.name as category_name,
        COUNT(p.id) as product_count,
        COALESCE(SUM(p.quantity), 0) as total_quantity,
        COALESCE(SUM(p.price * p.quantity), 0) as total_value,
        COALESCE(AVG(p.price), 0) as avg_price
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
      GROUP BY c.id, c.name
      ORDER BY total_value DESC
    `);

    const stockValueReport = result.rows.map(row => ({
      category: row.category_name,
      productCount: parseInt(row.product_count),
      totalQuantity: parseInt(row.total_quantity),
      totalValue: parseFloat(row.total_value),
      averagePrice: parseFloat(row.avg_price)
    }));

    const totalValue = stockValueReport.reduce((sum, item) => sum + item.totalValue, 0);

    res.json({
      success: true,
      data: {
        report: stockValueReport,
        summary: {
          totalCategories: stockValueReport.length,
          totalValue,
          totalProducts: stockValueReport.reduce((sum, item) => sum + item.productCount, 0)
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
 * /analytics/reports/movements:
 *   get:
 *     summary: Get stock movement report
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *     responses:
 *       200:
 *         description: Stock movement report
 */
router.get('/reports/movements', authenticateToken, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateCondition = '';
    const params = [];
    
    if (startDate && endDate) {
      dateCondition = 'WHERE sm.created_at BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    } else if (startDate) {
      dateCondition = 'WHERE sm.created_at >= $1';
      params.push(startDate);
    } else if (endDate) {
      dateCondition = 'WHERE sm.created_at <= $1';
      params.push(endDate);
    }

    const result = await pool.query(`
      SELECT 
        DATE(sm.created_at) as date,
        sm.type,
        COUNT(*) as movement_count,
        SUM(sm.quantity) as total_quantity
      FROM stock_movements sm
      ${dateCondition}
      GROUP BY DATE(sm.created_at), sm.type
      ORDER BY date DESC, sm.type
    `, params);

    const movementsReport = result.rows.map(row => ({
      date: row.date,
      type: row.type,
      movementCount: parseInt(row.movement_count),
      totalQuantity: parseInt(row.total_quantity)
    }));

    // Calculate summary
    const summary = {
      totalMovements: movementsReport.reduce((sum, item) => sum + item.movementCount, 0),
      totalIn: movementsReport
        .filter(item => item.type === 'in')
        .reduce((sum, item) => sum + item.totalQuantity, 0),
      totalOut: movementsReport
        .filter(item => item.type === 'out')
        .reduce((sum, item) => sum + item.totalQuantity, 0)
    };

    res.json({
      success: true,
      data: {
        report: movementsReport,
        summary,
        dateRange: {
          startDate,
          endDate
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
 * /analytics/products/top:
 *   get:
 *     summary: Get top products by stock value
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top products data
 */
router.get('/products/top', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        sku,
        quantity,
        price,
        (price * quantity) as total_value
      FROM products 
      WHERE is_active = true
      ORDER BY (price * quantity) DESC
      LIMIT 10
    `);

    const topProducts = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      quantity: row.quantity,
      price: parseFloat(row.price),
      value: parseFloat(row.total_value)
    }));

    res.json({
      success: true,
      data: topProducts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /analytics/movements:
 *   get:
 *     summary: Get recent stock movements
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *     responses:
 *       200:
 *         description: Recent stock movements
 */
router.get('/movements', authenticateToken, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateCondition = '';
    const params = [];
    
    if (startDate && endDate) {
      dateCondition = 'WHERE sm.created_at BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    } else if (startDate) {
      dateCondition = 'WHERE sm.created_at >= $1';
      params.push(startDate);
    } else if (endDate) {
      dateCondition = 'WHERE sm.created_at <= $1';
      params.push(endDate);
    }

    const result = await pool.query(`
      SELECT 
        sm.*,
        p.name as product_name,
        p.sku as product_sku,
        u.name as user_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      ${dateCondition}
      ORDER BY sm.created_at DESC
      LIMIT 20
    `, params);

    const movements = result.rows.map(row => ({
      id: row.id,
      product: {
        id: row.product_id,
        name: row.product_name,
        sku: row.product_sku
      },
      quantity: row.quantity,
      type: row.type,
      reason: row.reason,
      user: {
        id: row.user_id,
        name: row.user_name
      },
      createdAt: row.created_at
    }));

    res.json({
      success: true,
      data: movements,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
