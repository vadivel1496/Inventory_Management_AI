const bcrypt = require('bcryptjs');
const pool = require('./connection');
const logger = require('../utils/logger');

async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (email, password, role) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (email) DO NOTHING`,
      ['admin@inventory.com', hashedPassword, 'admin']
    );

    // Create sample categories
    const categories = [
      { name: 'Electronics', description: 'Electronic devices and accessories' },
      { name: 'Clothing', description: 'Apparel and fashion items' },
      { name: 'Books', description: 'Books and publications' },
      { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
      { name: 'Sports & Outdoors', description: 'Sports equipment and outdoor gear' }
    ];

    const categoryIds = [];
    for (const category of categories) {
      const result = await pool.query(
        `INSERT INTO categories (name, description) 
         VALUES ($1, $2) 
         ON CONFLICT (name) DO NOTHING 
         RETURNING id`,
        [category.name, category.description]
      );
      
      if (result.rows.length > 0) {
        categoryIds.push(result.rows[0].id);
        logger.info(`Created category: ${category.name}`);
      }
    }

    // Create sample products
    const products = [
      {
        name: 'Laptop Computer',
        description: 'High-performance laptop with latest specifications',
        sku: 'LAPTOP-001',
        category_id: categoryIds[0] || 1,
        price: 999.99,
        quantity: 25,
        supplier_id: 1 // Tech Solutions Inc.
      },
      {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with precision tracking',
        sku: 'MOUSE-001',
        category_id: categoryIds[0] || 1,
        price: 29.99,
        quantity: 150,
        supplier_id: 1 // Tech Solutions Inc.
      },
      {
        name: 'Cotton T-Shirt',
        description: 'Comfortable cotton t-shirt in various sizes',
        sku: 'TSHIRT-001',
        category_id: categoryIds[1] || 2,
        price: 19.99,
        quantity: 200,
        supplier_id: 2 // Fashion Forward Ltd.
      },
      {
        name: 'Programming Book',
        description: 'Comprehensive guide to modern programming',
        sku: 'BOOK-001',
        category_id: categoryIds[2] || 3,
        price: 49.99,
        quantity: 75,
        supplier_id: 3 // Book World Publishers
      },
      {
        name: 'Garden Hose',
        description: 'Durable garden hose for outdoor use',
        sku: 'HOSE-001',
        category_id: categoryIds[3] || 4,
        price: 39.99,
        quantity: 50,
        supplier_id: 4 // Home & Garden Supply Co.
      },
      {
        name: 'Basketball',
        description: 'Official size basketball for indoor/outdoor use',
        sku: 'BALL-001',
        category_id: categoryIds[4] || 5,
        price: 24.99,
        quantity: 100,
        supplier_id: 2 // Fashion Forward Ltd. (sports apparel)
      },
      {
        name: 'Smartphone',
        description: 'Latest smartphone with advanced features',
        sku: 'PHONE-001',
        category_id: categoryIds[0] || 1,
        price: 799.99,
        quantity: 30,
        supplier_id: 1 // Tech Solutions Inc.
      },
      {
        name: 'Running Shoes',
        description: 'Comfortable running shoes for athletes',
        sku: 'SHOES-001',
        category_id: categoryIds[4] || 5,
        price: 89.99,
        quantity: 80,
        supplier_id: 2 // Fashion Forward Ltd.
      }
    ];

    for (const product of products) {
      await pool.query(
        `INSERT INTO products (name, description, sku, category_id, price, quantity, supplier_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (sku) DO NOTHING`,
        [product.name, product.description, product.sku, product.category_id, product.price, product.quantity, product.supplier_id]
      );
      logger.info(`Created product: ${product.name}`);
    }

    // Create some sample stock movements
    const stockMovements = [
      { product_sku: 'LAPTOP-001', quantity: 10, type: 'in', reason: 'Initial stock' },
      { product_sku: 'MOUSE-001', quantity: 50, type: 'in', reason: 'Bulk order received' },
      { product_sku: 'TSHIRT-001', quantity: 100, type: 'in', reason: 'New collection' },
      { product_sku: 'LAPTOP-001', quantity: 2, type: 'out', reason: 'Customer sales' },
      { product_sku: 'MOUSE-001', quantity: 15, type: 'out', reason: 'Office supply order' }
    ];

    for (const movement of stockMovements) {
      // Get product ID from SKU
      const productResult = await pool.query('SELECT id FROM products WHERE sku = $1', [movement.product_sku]);
      
      if (productResult.rows.length > 0) {
        const productId = productResult.rows[0].id;
        
        // Update product quantity
        if (movement.type === 'in') {
          await pool.query(
            'UPDATE products SET quantity = quantity + $1 WHERE id = $2',
            [movement.quantity, productId]
          );
        } else {
          await pool.query(
            'UPDATE products SET quantity = quantity - $1 WHERE id = $2',
            [movement.quantity, productId]
          );
        }

        // Create stock movement record
        await pool.query(
          `INSERT INTO stock_movements (product_id, quantity, type, reason, user_id) 
           VALUES ($1, $2, $3, $4, (SELECT id FROM users WHERE email = 'admin@inventory.com'))`,
          [productId, movement.quantity, movement.type, movement.reason]
        );
        
        logger.info(`Created stock movement: ${movement.type} ${movement.quantity} units of ${movement.product_sku}`);
      }
    }

    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Seeding failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seed script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
