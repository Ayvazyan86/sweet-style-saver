import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { pool } from '../server.js';

const router = express.Router();

// Middleware для проверки JWT токена
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// POST /api/admin/login - вход админа
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Для упрощения - хардкодим админа
    // В продакшене нужна таблица admins с хешированными паролями
    const adminEmail = 'admin_264133466@ayvazyan-rekomenduet.ru';
    const adminPassword = 'uCrj55U7AGX54sCL';
    
    if (email === adminEmail && password === adminPassword) {
      const token = jwt.sign(
        { email, role: 'admin', telegram_id: 264133466 },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.json({
        success: true,
        token,
        user: { email, role: 'admin' }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/stats - статистика (защищено)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM partner_profiles WHERE status = 'active') as active_partners,
        (SELECT COUNT(*) FROM partner_applications WHERE status = 'pending') as pending_applications,
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
        (SELECT COUNT(*) FROM questions WHERE status = 'pending') as pending_questions
    `);
    
    res.json({ data: stats.rows[0] });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
