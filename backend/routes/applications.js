import express from 'express';
import { pool } from '../server.js';

const router = express.Router();

// GET /api/applications - получить список заявок
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT pa.*,
        json_agg(DISTINCT c.*) FILTER (WHERE c.id IS NOT NULL) as categories
      FROM partner_applications pa
      LEFT JOIN partner_application_categories pac ON pa.id = pac.application_id
      LEFT JOIN categories c ON pac.category_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND pa.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    query += ` GROUP BY pa.id ORDER BY pa.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    res.json({ data: result.rows, count: result.rowCount });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/applications/:id - получить заявку по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT pa.*,
        json_agg(DISTINCT c.*) FILTER (WHERE c.id IS NOT NULL) as categories
      FROM partner_applications pa
      LEFT JOIN partner_application_categories pac ON pa.id = pac.application_id
      LEFT JOIN categories c ON pac.category_id = c.id
      WHERE pa.id = $1
      GROUP BY pa.id
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/applications - создать заявку
router.post('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      user_id,
      name,
      age,
      profession,
      city,
      phone,
      photo_url,
      logo_url,
      categories,
      ...otherFields
    } = req.body;
    
    // Вычисляем возраст из даты рождения если передана
    const calculatedAge = age || (otherFields.birthDate ? 
      Math.floor((Date.now() - new Date(otherFields.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) 
      : null);
    
    // Создаём заявку
    const insertQuery = `
      INSERT INTO partner_applications (
        user_id, name, age, profession, city, phone, photo_url, logo_url,
        status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW())
      RETURNING *
    `;
    
    const result = await client.query(insertQuery, [
      user_id,
      name,
      calculatedAge,
      profession,
      city,
      phone,
      photo_url,
      logo_url
    ]);
    
    const applicationId = result.rows[0].id;
    
    // Добавляем категории
    if (categories && categories.length > 0) {
      for (const categoryId of categories) {
        await client.query(
          'INSERT INTO partner_application_categories (application_id, category_id) VALUES ($1, $2)',
          [applicationId, categoryId]
        );
      }
    }
    
    await client.query('COMMIT');
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating application:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// PATCH /api/applications/:id/approve - одобрить заявку
router.patch('/:id/approve', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { moderated_by } = req.body;
    
    // Обновляем статус заявки
    const updateQuery = `
      UPDATE partner_applications 
      SET status = 'approved', 
          moderated_at = NOW(),
          moderated_by = $2
      WHERE id = $1 
      RETURNING *
    `;
    
    const result = await client.query(updateQuery, [id, moderated_by]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const application = result.rows[0];
    
    // Создаём профиль партнёра
    const createPartnerQuery = `
      INSERT INTO partner_profiles (
        application_id, user_id, name, age, profession, city, phone,
        status, partner_type, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', 'free', NOW())
      RETURNING *
    `;
    
    const partnerResult = await client.query(createPartnerQuery, [
      application.id,
      application.user_id,
      application.name,
      application.age,
      application.profession,
      application.city,
      application.phone
    ]);
    
    // Копируем категории
    await client.query(`
      INSERT INTO partner_profile_categories (profile_id, category_id)
      SELECT $1, category_id FROM partner_application_categories WHERE application_id = $2
    `, [partnerResult.rows[0].id, application.id]);
    
    await client.query('COMMIT');
    res.json({ 
      success: true, 
      application: result.rows[0],
      partner: partnerResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving application:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// PATCH /api/applications/:id/reject - отклонить заявку
router.patch('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { moderated_by, rejection_reason } = req.body;
    
    const query = `
      UPDATE partner_applications 
      SET status = 'rejected',
          moderated_at = NOW(),
          moderated_by = $2,
          rejection_reason = $3
      WHERE id = $1 
      RETURNING *
    `;
    
    const result = await pool.query(query, [id, moderated_by, rejection_reason]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
