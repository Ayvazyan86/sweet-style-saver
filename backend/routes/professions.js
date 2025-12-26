import express from 'express';
import { pool } from '../server.js';

const router = express.Router();

// GET /api/professions - Get all professions
router.get('/', async (req, res) => {
  try {
    const { is_active } = req.query;
    
    let query = 'SELECT * FROM professions';
    const params = [];
    
    if (is_active !== undefined) {
      query += ' WHERE is_active = $1';
      params.push(is_active === 'true');
    }
    
    query += ' ORDER BY sort_order ASC';
    
    const result = await pool.query(query, params);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching professions:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/professions - Create profession
router.post('/', async (req, res) => {
  try {
    const { name, category_id, is_active } = req.body;
    
    // Get max sort_order
    const maxSort = await pool.query('SELECT MAX(sort_order) as max FROM professions');
    const sortOrder = (maxSort.rows[0].max || 0) + 1;
    
    const result = await pool.query(
      `INSERT INTO professions (name, category_id, sort_order, is_active) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, category_id || null, sortOrder, is_active !== false]
    );

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error creating profession:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/professions/:id - Update profession
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, is_active, sort_order } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (category_id !== undefined) {
      updates.push(`category_id = $${paramCount++}`);
      values.push(category_id);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
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
      `UPDATE professions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profession not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error updating profession:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/professions/:id - Delete profession
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM professions WHERE id = $1', [id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting profession:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
