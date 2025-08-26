const pool = require('./connection');
const logger = require('../utils/logger');

async function updateProductSuppliers() {
  try {
    logger.info('Starting to update product supplier relationships...');

    // Update products with appropriate supplier IDs based on their category or name
    const updates = [
      // Electronics products -> Tech Solutions Inc. (ID: 1)
      {
        query: `UPDATE products SET supplier_id = 1 WHERE category_id = 1 AND supplier_id IS NULL`,
        description: 'Electronics products to Tech Solutions Inc.'
      },
      // Clothing products -> Fashion Forward Ltd. (ID: 2)
      {
        query: `UPDATE products SET supplier_id = 2 WHERE category_id = 2 AND supplier_id IS NULL`,
        description: 'Clothing products to Fashion Forward Ltd.'
      },
      // Books -> Book World Publishers (ID: 3)
      {
        query: `UPDATE products SET supplier_id = 3 WHERE category_id = 3 AND supplier_id IS NULL`,
        description: 'Books to Book World Publishers'
      },
      // Home & Garden -> Home & Garden Supply Co. (ID: 4)
      {
        query: `UPDATE products SET supplier_id = 4 WHERE category_id = 4 AND supplier_id IS NULL`,
        description: 'Home & Garden products to Home & Garden Supply Co.'
      },
      // Sports & Outdoors -> Fashion Forward Ltd. (ID: 2) for apparel, Tech Solutions Inc. (ID: 1) for equipment
      {
        query: `UPDATE products SET supplier_id = 2 WHERE category_id = 5 AND name ILIKE '%shoes%' AND supplier_id IS NULL`,
        description: 'Sports shoes to Fashion Forward Ltd.'
      },
      {
        query: `UPDATE products SET supplier_id = 1 WHERE category_id = 5 AND name ILIKE '%ball%' AND supplier_id IS NULL`,
        description: 'Sports equipment to Tech Solutions Inc.'
      }
    ];

    for (const update of updates) {
      const result = await pool.query(update.query);
      logger.info(`${update.description}: ${result.rowCount} rows updated`);
    }

    // Set default supplier for any remaining products
    const defaultResult = await pool.query(
      `UPDATE products SET supplier_id = 1 WHERE supplier_id IS NULL`
    );
    if (defaultResult.rowCount > 0) {
      logger.info(`Set default supplier for ${defaultResult.rowCount} remaining products`);
    }

    logger.info('Product supplier relationships updated successfully');
  } catch (error) {
    logger.error('Failed to update product suppliers:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  updateProductSuppliers()
    .then(() => {
      logger.info('Update script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Update script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateProductSuppliers }; 