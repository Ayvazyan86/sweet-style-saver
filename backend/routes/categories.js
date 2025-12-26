import express from 'express';
import { pool } from '../server.js';

const router = express.Router();

// GET /api/categories - получить список категорий
router.get('/', async (req, res) => {
  try {
    const { is_active } = req.query;
    
    let query = 'SELECT * FROM categories WHERE 1=1';
    const params = [];
    
    if (is_active !== undefined) {
      query += ' AND is_active = $1';
      params.push(is_active === 'true');
    }
    
    query += ' ORDER BY sort_order ASC, name ASC';
    
    const result = await pool.query(query, params);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
