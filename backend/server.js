import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, timestamp: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Import routes
import partnersRouter from './routes/partners.js';
import applicationsRouter from './routes/applications.js';
import ordersRouter from './routes/orders.js';
import questionsRouter from './routes/questions.js';
import categoriesRouter from './routes/categories.js';
import adminRouter from './routes/admin.js';
import uploadRouter from './routes/upload.js';
import telegramRouter from './routes/telegram.js';
import professionsRouter from './routes/professions.js';
import settingsRouter from './routes/settings.js';
import cardTemplatesRouter from './routes/card-templates.js';

// Use routes
app.use('/api/partners', partnersRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/telegram', telegramRouter);
app.use('/api/professions', professionsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/card-templates', cardTemplatesRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME}`);
});

export { pool };
