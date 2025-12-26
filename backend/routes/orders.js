import express from 'express';
import { pool } from '../server.js';

const router = express.Router();

// GET /api/orders - получить список заказов
router.get('/', async (req, res) => {
  try {
    const { status, category, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT o.*,
        c.name as category_name
      FROM orders o
      LEFT JOIN categories c ON o.category_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND o.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (category) {
      query += ` AND o.category_id = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    
    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    res.json({ data: result.rows, count: result.rowCount });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/orders - создать заказ
router.post('/', async (req, res) => {
  try {
    const { user_id, category_id, title, text, budget, city, contact } = req.body;
    
    const query = `
      INSERT INTO orders (
        user_id, category_id, title, text, budget, city, contact,
        status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      user_id, category_id, title, text, budget, city, contact
    ]);
    
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
