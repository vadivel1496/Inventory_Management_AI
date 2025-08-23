const express = require('express');
const router = express.Router();
const pool = require('../database/connection');
const Joi = require('joi');
const logger = require('../utils/logger');

// Validation schemas
const createSupplierSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(10).max(20).required(),
  address: Joi.string().min(10).max(500).required(),
  contactPerson: Joi.string().min(2).max(255).required()
});

const updateSupplierSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  email: Joi.string().email(),
  phone: Joi.string().min(10).max(20),
  address: Joi.string().min(10).max(500),
  contactPerson: Joi.string().min(2).max(255),
  status: Joi.string().valid('active', 'inactive')
});

// Get all suppliers (with soft delete - only active by default)
router.get('/', async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    
    let query = `
      SELECT id, name, email, phone, address, contact_person, status, created_at, updated_at
      FROM suppliers
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (status && status !== 'all') {
      query += ` AND status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }
    
    query += ` ORDER BY name ASC`;
    
    const result = await pool.query(query, queryParams);
    
    // Transform snake_case to camelCase for frontend
    const suppliers = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      contactPerson: row.contact_person,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json({
      success: true,
      data: suppliers,
      message: 'Suppliers retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error retrieving suppliers:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve suppliers',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Get supplier by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT id, name, email, phone, address, contact_person, status, created_at, updated_at FROM suppliers WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Supplier not found'
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Transform snake_case to camelCase for frontend
    const supplier = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      email: result.rows[0].email,
      phone: result.rows[0].phone,
      address: result.rows[0].address,
      contactPerson: result.rows[0].contact_person,
      status: result.rows[0].status,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };
    
    res.json({
      success: true,
      data: supplier,
      message: 'Supplier retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error retrieving supplier:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve supplier',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Create new supplier
router.post('/', async (req, res) => {
  try {
    const { error, value } = createSupplierSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: error.details[0].message
        },
        timestamp: new Date().toISOString()
      });
    }
    
    const { name, email, phone, address, contactPerson } = value;
    
    // Check if supplier with same email already exists
    const existingSupplier = await pool.query(
      'SELECT id FROM suppliers WHERE email = $1 AND status = $2',
      [email, 'active']
    );
    
    if (existingSupplier.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Supplier with this email already exists'
        },
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await pool.query(
      `INSERT INTO suppliers (name, email, phone, address, contact_person, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, name, email, phone, address, contact_person, status, created_at, updated_at`,
      [name, email, phone, address, contactPerson, 'active']
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Supplier created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error creating supplier:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create supplier',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Update supplier
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateSupplierSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: error.details[0].message
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if supplier exists
    const existingSupplier = await pool.query(
      'SELECT id FROM suppliers WHERE id = $1',
      [id]
    );
    
    if (existingSupplier.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Supplier not found'
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;
    
    if (value.name !== undefined) {
      paramCount++;
      updateFields.push(`name = $${paramCount}`);
      updateValues.push(value.name);
    }
    
    if (value.email !== undefined) {
      paramCount++;
      updateFields.push(`email = $${paramCount}`);
      updateValues.push(value.email);
    }
    
    if (value.phone !== undefined) {
      paramCount++;
      updateFields.push(`phone = $${paramCount}`);
      updateValues.push(value.phone);
    }
    
    if (value.address !== undefined) {
      paramCount++;
      updateFields.push(`address = $${paramCount}`);
      updateValues.push(value.address);
    }
    
    if (value.contactPerson !== undefined) {
      paramCount++;
      updateFields.push(`contact_person = $${paramCount}`);
      updateValues.push(value.contactPerson);
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
          message: 'No fields to update'
        },
        timestamp: new Date().toISOString()
      });
    }
    
    paramCount++;
    updateValues.push(id);
    
    const updateQuery = `
      UPDATE suppliers
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING id, name, email, phone, address, contact_person, status, created_at, updated_at
    `;
    
    const result = await pool.query(updateQuery, updateValues);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Supplier updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error updating supplier:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update supplier',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Toggle supplier status (soft delete/activate)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Status must be either "active" or "inactive"'
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if supplier exists
    const existingSupplier = await pool.query(
      'SELECT id FROM suppliers WHERE id = $1',
      [id]
    );
    
    if (existingSupplier.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Supplier not found'
        },
        timestamp: new Date().toISOString()
      });
    }
    
    const result = await pool.query(
      `UPDATE suppliers
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, phone, address, contact_person, status, created_at, updated_at`,
      [status, id]
    );
    
    res.json({
      success: true,
      data: result.rows[0],
      message: `Supplier ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error updating supplier status:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update supplier status',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Soft delete supplier (mark as inactive)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if supplier exists
    const existingSupplier = await pool.query(
      'SELECT id FROM suppliers WHERE id = $1',
      [id]
    );
    
    if (existingSupplier.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Supplier not found'
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Soft delete by setting status to inactive
    await pool.query(
      'UPDATE suppliers SET status = $1, updated_at = NOW() WHERE id = $2',
      ['inactive', id]
    );
    
    res.json({
      success: true,
      message: 'Supplier deactivated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error deactivating supplier:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to deactivate supplier',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 