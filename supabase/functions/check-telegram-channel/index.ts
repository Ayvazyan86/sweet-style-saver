import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channel } = await req.json();
    
    if (!channel) {
      return new Response(
        JSON.stringify({ error: 'Channel is required', exists: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Извлекаем username из разных форматов
    let username = channel.trim();
    
    // Убираем @ если есть
    if (username.startsWith('@')) {
      username = username.slice(1);
    }
    
    // Извлекаем из URL если это ссылка
    const urlMatch = username.match(/(?:t\.me|telegram\.me)\/(@)?([a-zA-Z0-9_]+)/);
    if (urlMatch) {
      username = urlMatch[2];
    }

    console.log(`Checking Telegram channel: ${username}`);

    if (!TELEGRAM_BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN is not set');
      return new Response(
        JSON.stringify({ error: 'Bot token not configured', exists: null }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Используем метод getChat для проверки существования канала
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat?chat_id=@${username}`
    );

    const data = await response.json();
    console.log(`Telegram API response for @${username}:`, JSON.stringify(data));

    if (data.ok) {
      const chat = data.result;
      return new Response(
        JSON.stringify({
          exists: true,
          channel: {
            id: chat.id,
            title: chat.title || chat.first_name || username,
            username: chat.username,
            type: chat.type,
            description: chat.description,
            photo: chat.photo ? true : false,
            members_count: chat.members_count,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Канал не найден или бот не имеет доступа
      console.log(`Channel @${username} not found or not accessible: ${data.description}`);
      return new Response(
        JSON.stringify({
          exists: false,
          error: data.description || 'Channel not found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    console.error('Error checking Telegram channel:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message, exists: null }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
