import express from 'express';
import { pool } from '../server.js';

const router = express.Router();

// GET /api/questions - получить список вопросов
router.get('/', async (req, res) => {
  try {
    const { status, category, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT q.*,
        c.name as category_name
      FROM questions q
      LEFT JOIN categories c ON q.category_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND q.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (category) {
      query += ` AND q.category_id = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    
    query += ` ORDER BY q.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    res.json({ data: result.rows, count: result.rowCount });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/questions - создать вопрос
router.post('/', async (req, res) => {
  try {
    const { user_id, category_id, text, details } = req.body;
    
    const query = `
      INSERT INTO questions (
        user_id, category_id, text, details,
        status, created_at
      )
      VALUES ($1, $2, $3, $4, 'pending', NOW())
      RETURNING *
    `;
    
    const result = await pool.query(query, [user_id, category_id, text, details]);
    
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
