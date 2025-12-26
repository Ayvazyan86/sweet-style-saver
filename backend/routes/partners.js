import express from 'express';
import { pool } from '../server.js';

const router = express.Router();

// GET /api/partners - получить список партнёров
router.get('/', async (req, res) => {
  try {
    const { status, city, category, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT p.*, 
        json_agg(DISTINCT c.*) FILTER (WHERE c.id IS NOT NULL) as categories
      FROM partner_profiles p
      LEFT JOIN partner_profile_categories ppc ON p.id = ppc.profile_id
      LEFT JOIN categories c ON ppc.category_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (city) {
      query += ` AND p.city ILIKE $${paramCount}`;
      params.push(`%${city}%`);
      paramCount++;
    }
    
    query += ` GROUP BY p.id ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    res.json({ data: result.rows, count: result.rowCount });
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/partners/:id - получить партнёра по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT p.*, 
        json_agg(DISTINCT c.*) FILTER (WHERE c.id IS NOT NULL) as categories
      FROM partner_profiles p
      LEFT JOIN partner_profile_categories ppc ON p.id = ppc.profile_id
      LEFT JOIN categories c ON ppc.category_id = c.id
      WHERE p.id = $1
      GROUP BY p.id
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching partner:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/partners - создать партнёра (из одобренной заявки)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      application_id,
      user_id,
      name,
      age,
      profession,
      city,
      phone,
      categories,
      ...otherFields
    } = req.body;
    
    // Создаём профиль партнёра
    const insertQuery = `
      INSERT INTO partner_profiles (
        application_id, user_id, name, age, profession, city, phone,
        status, partner_type, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', 'free', NOW())
      RETURNING *
    `;
    
    const result = await client.query(insertQuery, [
      application_id,
      user_id,
      name,
      age,
      profession,
      city,
      phone
    ]);
    
    const partnerId = result.rows[0].id;
    
    // Добавляем категории
    if (categories && categories.length > 0) {
      for (const categoryId of categories) {
        await client.query(
          'INSERT INTO partner_profile_categories (profile_id, category_id) VALUES ($1, $2)',
          [partnerId, categoryId]
        );
      }
    }
    
    await client.query('COMMIT');
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating partner:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// PATCH /api/partners/:id - обновить партнёра
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const setClause = fields.map((field, idx) => `${field} = $${idx + 2}`).join(', ');
    const query = `UPDATE partner_profiles SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;
    
    const result = await pool.query(query, [id, ...values]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error updating partner:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/partners/:id - удалить/архивировать партнёра
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    
    let query;
    if (permanent === 'true') {
      query = 'DELETE FROM partner_profiles WHERE id = $1 RETURNING id';
    } else {
      query = "UPDATE partner_profiles SET status = 'archived', updated_at = NOW() WHERE id = $1 RETURNING *";
    }
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting partner:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
