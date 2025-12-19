import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const MINI_APP_URL = "https://zuxikzoyzuiyldbtlsdm.lovable.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
  };
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: object) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
  };
  
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  
  const result = await response.json();
  console.log("Telegram sendMessage response:", JSON.stringify(result));
  return result;
}

async function handleStartCommand(message: TelegramMessage) {
  const firstName = message.from.first_name;
  const chatId = message.chat.id;
  
  const welcomeText = `👋 <b>Привет, ${firstName}!</b>

Добро пожаловать в бот <b>«Айвазян рекомендует»</b>!

Здесь вы можете:
🤝 <b>Стать партнёром</b> — получайте заказы от клиентов
📦 <b>Разместить заказ</b> — найдите исполнителя
❓ <b>Задать вопрос</b> — получите ответ от экспертов

Нажмите кнопку ниже, чтобы открыть меню:`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: "🚀 Открыть меню",
          web_app: { url: MINI_APP_URL }
        }
      ]
    ]
  };
  
  await sendTelegramMessage(chatId, welcomeText, inlineKeyboard);
  console.log(`Welcome message sent to user ${message.from.id} (${firstName})`);
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!TELEGRAM_BOT_TOKEN) {
      console.error("TELEGRAM_BOT_TOKEN is not set");
      return new Response(JSON.stringify({ error: "Bot token not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const update: TelegramUpdate = await req.json();
    console.log("Received Telegram update:", JSON.stringify(update));

    // Handle message updates
    if (update.message?.text) {
      const text = update.message.text;
      
      // Handle /start command
      if (text === "/start" || text.startsWith("/start ")) {
        await handleStartCommand(update.message);
      }
    }

    // Always return 200 OK to Telegram
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    console.error("Error processing webhook:", error);
    // Return 200 to prevent Telegram from retrying
    return new Response(JSON.stringify({ ok: true, error: String(error) }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
