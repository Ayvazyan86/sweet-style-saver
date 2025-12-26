import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Отправить сообщение в канал
export async function sendMessageToChannel(text) {
  try {
    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: TELEGRAM_CHANNEL_ID,
      text,
      parse_mode: 'HTML'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sending message to channel:', error.response?.data || error.message);
    throw error;
  }
}

// Отправить фото в канал
export async function sendPhotoToChannel(photoUrl, caption) {
  try {
    const response = await axios.post(`${TELEGRAM_API_URL}/sendPhoto`, {
      chat_id: TELEGRAM_CHANNEL_ID,
      photo: photoUrl,
      caption,
      parse_mode: 'HTML'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sending photo to channel:', error.response?.data || error.message);
    throw error;
  }
}

// Обновить пост в канале
export async function updateChannelPost(messageId, caption, photoUrl = null) {
  try {
    let response;
    
    if (photoUrl) {
      // Обновить медиа и caption
      response = await axios.post(`${TELEGRAM_API_URL}/editMessageMedia`, {
        chat_id: TELEGRAM_CHANNEL_ID,
        message_id: messageId,
        media: {
          type: 'photo',
          media: photoUrl,
          caption,
          parse_mode: 'HTML'
        }
      });
    } else {
      // Обновить только caption
      response = await axios.post(`${TELEGRAM_API_URL}/editMessageCaption`, {
        chat_id: TELEGRAM_CHANNEL_ID,
        message_id: messageId,
        caption,
        parse_mode: 'HTML'
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('Error updating channel post:', error.response?.data || error.message);
    throw error;
  }
}

// Удалить пост из канала
export async function deleteChannelPost(messageId) {
  try {
    const response = await axios.post(`${TELEGRAM_API_URL}/deleteMessage`, {
      chat_id: TELEGRAM_CHANNEL_ID,
      message_id: messageId
    });
    
    return response.data;
  } catch (error) {
    console.error('Error deleting channel post:', error.response?.data || error.message);
    throw error;
  }
}

// Отправить уведомление пользователю
export async function sendNotification(userId, text) {
  try {
    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: userId,
      text,
      parse_mode: 'HTML'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sending notification:', error.response?.data || error.message);
    throw error;
  }
}

// Построить caption для партнёра
export function buildPartnerCaption(partner) {
  let caption = `<b>${partner.name}</b>\n`;
  
  if (partner.age) {
    caption += `Возраст: ${partner.age}\n`;
  }
  
  if (partner.profession) {
    caption += `Профессия: ${partner.profession}\n`;
  }
  
  if (partner.city) {
    caption += `Город: ${partner.city}\n`;
  }
  
  if (partner.phone) {
    caption += `\n📞 ${partner.phone}\n`;
  }
  
  if (partner.tg_channel) {
    caption += `📱 ${partner.tg_channel}\n`;
  }
  
  return caption;
}
