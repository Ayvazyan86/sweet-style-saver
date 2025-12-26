import express from 'express';
import { pool } from '../server.js';

const router = express.Router();

// GET /api/settings - Get all settings
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings');
    
    // Convert to key-value object
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    res.json({ data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/settings/:key - Get specific setting
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const result = await pool.query('SELECT value FROM settings WHERE key = $1', [key]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ data: result.rows[0].value });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/settings/:key - Update setting
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    const result = await pool.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2
       RETURNING *`,
      [key, value]
    );
    
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/form-field-settings - Get form field settings
router.get('/form-fields/:formType', async (req, res) => {
  try {
    const { formType } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM form_field_settings 
       WHERE form_type = $1 
       ORDER BY sort_order ASC`,
      [formType]
    );
    
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching form field settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/form-field-settings/:id - Update form field setting
router.patch('/form-fields/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { label, label_en, is_visible, is_required, sort_order } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (label !== undefined) {
      updates.push(`label = $${paramCount++}`);
      values.push(label);
    }
    if (label_en !== undefined) {
      updates.push(`label_en = $${paramCount++}`);
      values.push(label_en);
    }
    if (is_visible !== undefined) {
      updates.push(`is_visible = $${paramCount++}`);
      values.push(is_visible);
    }
    if (is_required !== undefined) {
      updates.push(`is_required = $${paramCount++}`);
      values.push(is_required);
    }
    if (sort_order !== undefined) {
      updates.push(`sort_order = $${paramCount++}`);
      values.push(sort_order);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    values.push(id);
    
    const result = await pool.query(
      `UPDATE form_field_settings SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Field setting not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error updating form field setting:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
