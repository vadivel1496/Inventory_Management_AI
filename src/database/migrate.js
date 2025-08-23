const fs = require('fs');
const path = require('path');
const pool = require('./connection');
const logger = require('../utils/logger');

async function runMigrations() {
  try {
    logger.info('Starting database migration...');

    // Read the init.sql file
    const initSqlPath = path.join(__dirname, 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');

    // Split the SQL file into individual statements
    const statements = initSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
          logger.info(`Executed SQL statement: ${statement.substring(0, 50)}...`);
        } catch (error) {
          // Ignore errors for statements that might already exist (like tables)
          if (error.code === '42P07') { // duplicate_table
            logger.warn(`Table already exists, skipping: ${error.message}`);
          } else {
            throw error;
          }
        }
      }
    }

    logger.info('Database migration completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
