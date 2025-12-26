import express from 'express';
import { pool } from '../server.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Multer config for template images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = process.env.UPLOAD_DIR || './uploads';
    const templateDir = path.join(dir, 'templates');
    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir, { recursive: true });
    }
    cb(null, templateDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `template-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  }
});

// GET /api/card-templates - Get all templates
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM card_templates ORDER BY created_at DESC'
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/card-templates - Create template with image
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Image required' });
    }

    const imageUrl = `/uploads/templates/${req.file.filename}`;
    
    const result = await pool.query(
      `INSERT INTO card_templates (name, description, image_url) 
       VALUES ($1, $2, $3) RETURNING *`,
      [name, description || null, imageUrl]
    );

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/card-templates/:id - Delete template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get template to delete image file
    const template = await pool.query(
      'SELECT image_url FROM card_templates WHERE id = $1',
      [id]
    );
    
    if (template.rows.length > 0) {
      const imageUrl = template.rows[0].image_url;
      const imagePath = path.join(process.env.UPLOAD_DIR || './uploads', imageUrl.replace('/uploads/', ''));
      
      // Delete file if exists
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await pool.query('DELETE FROM card_templates WHERE id = $1', [id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
