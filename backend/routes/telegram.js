import express from 'express';
import { pool } from '../server.js';
import {
  sendPhotoToChannel,
  sendMessageToChannel,
  updateChannelPost,
  deleteChannelPost,
  sendNotification,
  buildPartnerCaption
} from '../services/telegram.js';

const router = express.Router();

// POST /api/telegram/publish-partner - опубликовать партнёра в канал
router.post('/publish-partner', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { partner_id } = req.body;
    
    // Получаем данные партнёра
    const partnerQuery = `
      SELECT p.*,
        pa.photo_url,
        json_agg(DISTINCT c.*) FILTER (WHERE c.id IS NOT NULL) as categories
      FROM partner_profiles p
      LEFT JOIN partner_applications pa ON p.application_id = pa.id
      LEFT JOIN partner_profile_categories ppc ON p.id = ppc.profile_id
      LEFT JOIN categories c ON ppc.category_id = c.id
      WHERE p.id = $1
      GROUP BY p.id, pa.photo_url
    `;
    
    const partnerResult = await client.query(partnerQuery, [partner_id]);
    
    if (partnerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    const partner = partnerResult.rows[0];
    const caption = buildPartnerCaption(partner);
    
    // Публикуем в канал
    let result;
    if (partner.photo_url) {
      result = await sendPhotoToChannel(partner.photo_url, caption);
    } else {
      result = await sendMessageToChannel(caption);
    }
    
    const messageId = result.result.message_id;
    
    // Сохраняем ID поста
    await client.query(
      'UPDATE partner_profiles SET channel_post_id = $1, updated_at = NOW() WHERE id = $2',
      [messageId, partner_id]
    );
    
    res.json({
      success: true,
      channel_post_id: messageId,
      message: 'Partner published to channel'
    });
  } catch (error) {
    console.error('Error publishing partner:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// POST /api/telegram/update-partner-post - обновить пост партнёра
router.post('/update-partner-post', async (req, res) => {
  try {
    const { partner_id } = req.body;
    
    const partnerQuery = `
      SELECT p.*,
        pa.photo_url
      FROM partner_profiles p
      LEFT JOIN partner_applications pa ON p.application_id = pa.id
      WHERE p.id = $1
    `;
    
    const result = await pool.query(partnerQuery, [partner_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    const partner = result.rows[0];
    
    if (!partner.channel_post_id) {
      return res.status(400).json({ error: 'Partner not published yet' });
    }
    
    const caption = buildPartnerCaption(partner);
    await updateChannelPost(partner.channel_post_id, caption, partner.photo_url);
    
    res.json({
      success: true,
      message: 'Partner post updated'
    });
  } catch (error) {
    console.error('Error updating partner post:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/telegram/delete-partner-post/:partner_id - удалить пост партнёра
router.delete('/delete-partner-post/:partner_id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { partner_id } = req.params;
    
    const result = await client.query(
      'SELECT channel_post_id FROM partner_profiles WHERE id = $1',
      [partner_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    const { channel_post_id } = result.rows[0];
    
    if (!channel_post_id) {
      return res.status(400).json({ error: 'Partner not published' });
    }
    
    // Удаляем пост из канала
    await deleteChannelPost(channel_post_id);
    
    // Убираем ID поста из БД
    await client.query(
      'UPDATE partner_profiles SET channel_post_id = NULL WHERE id = $1',
      [partner_id]
    );
    
    res.json({
      success: true,
      message: 'Partner post deleted from channel'
    });
  } catch (error) {
    console.error('Error deleting partner post:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// POST /api/telegram/notify - отправить уведомление пользователю
router.post('/notify', async (req, res) => {
  try {
    const { user_id, text } = req.body;
    
    await sendNotification(user_id, text);
    
    res.json({
      success: true,
      message: 'Notification sent'
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/telegram/check-channel - проверка подписки на канал
router.post('/check-channel', async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id required' });
    }

    // Get channel ID from settings
    const settingsResult = await pool.query(
      "SELECT value FROM settings WHERE key = 'telegram_channel_id'"
    );

    if (settingsResult.rows.length === 0) {
      return res.status(500).json({ error: 'Channel not configured' });
    }

    const channelId = settingsResult.rows[0].value;

    // Check if user is subscribed
    const response = await axios.get(
      `${TELEGRAM_API_URL}/getChatMember`,
      {
        params: {
          chat_id: channelId,
          user_id: user_id
        }
      }
    );

    const status = response.data.result.status;
    const isSubscribed = ['creator', 'administrator', 'member'].includes(status);

    res.json({ 
      isSubscribed,
      status 
    });
  } catch (error) {
    console.error('Error checking channel:', error);
    if (error.response?.data?.description?.includes('user not found')) {
      return res.json({ isSubscribed: false });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
