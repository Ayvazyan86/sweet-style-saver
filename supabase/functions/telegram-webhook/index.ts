import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "8423349734:AAGaTfgF7GhikunPZ9VwnngPKSrRqz5hcLI";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
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

// Создаём или обновляем профиль пользователя
async function ensureUserProfile(user: TelegramUser) {
  const supabase = createClient(
    SUPABASE_URL ?? '',
    SUPABASE_SERVICE_ROLE_KEY ?? ''
  );

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('telegram_id', user.id)
    .maybeSingle();

  if (existingProfile) {
    // Обновляем данные профиля
    await supabase
      .from('profiles')
      .update({
        username: user.username || null,
        first_name: user.first_name,
        last_name: user.last_name || null,
        language_code: user.language_code || 'ru',
      })
      .eq('telegram_id', user.id);
    
    return existingProfile.id;
  }

  // Создаём новый профиль
  const { data: newProfile, error } = await supabase
    .from('profiles')
    .insert({
      telegram_id: user.id,
      username: user.username || null,
      first_name: user.first_name,
      last_name: user.last_name || null,
      language_code: user.language_code || 'ru',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    return null;
  }

  return newProfile.id;
}

// Получаем URL мини-приложения из переменных окружения или формируем из project_id
function getMiniAppUrl(): string {
  // Используем URL сервера вместо Lovable
  return 'http://85.198.67.7';
}

async function handleStartCommand(message: TelegramMessage) {
  const user = message.from;
  const chatId = message.chat.id;
  
  // Создаём/обновляем профиль пользователя
  await ensureUserProfile(user);
  
  const welcomeText = `👋 <b>Привет, ${user.first_name}!</b>

Добро пожаловать в бот <b>«Айвазян рекомендует»</b>!

Здесь вы можете:
🤝 <b>Стать партнёром</b> — получайте заказы от клиентов
📦 <b>Разместить заказ</b> — найдите исполнителя
❓ <b>Задать вопрос</b> — получите ответ от экспертов

Нажмите кнопку ниже, чтобы открыть меню:`;

  const miniAppUrl = getMiniAppUrl();
  
  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: "🚀 Открыть меню",
          web_app: { url: miniAppUrl }
        }
      ]
    ]
  };
  
  await sendTelegramMessage(chatId, welcomeText, inlineKeyboard);
  console.log(`Welcome message sent to user ${user.id} (${user.first_name})`);
}

async function handleHelpCommand(message: TelegramMessage) {
  const chatId = message.chat.id;
  
  const helpText = `📖 <b>Справка по боту</b>

<b>Доступные команды:</b>
/start — Начать работу с ботом
/help — Показать эту справку
/menu — Открыть главное меню
/status — Проверить статус вашей заявки

<b>Как это работает:</b>
1️⃣ Нажмите "Открыть меню" для доступа к приложению
2️⃣ Заполните заявку на партнёрство или разместите заказ
3️⃣ Ожидайте ответа от модераторов

Есть вопросы? Напишите нам!`;

  await sendTelegramMessage(chatId, helpText);
}

async function handleMenuCommand(message: TelegramMessage) {
  const chatId = message.chat.id;
  const miniAppUrl = getMiniAppUrl();
  
  const menuText = `📱 <b>Главное меню</b>

Нажмите кнопку ниже, чтобы открыть приложение:`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: "🚀 Открыть меню",
          web_app: { url: miniAppUrl }
        }
      ],
      [
        {
          text: "🤝 Стать партнёром",
          web_app: { url: `${miniAppUrl}/partner-form` }
        }
      ],
      [
        {
          text: "📦 Разместить заказ",
          web_app: { url: `${miniAppUrl}/order-form` }
        },
        {
          text: "❓ Задать вопрос",
          web_app: { url: `${miniAppUrl}/question-form` }
        }
      ]
    ]
  };
  
  await sendTelegramMessage(chatId, menuText, inlineKeyboard);
}

async function handleStatusCommand(message: TelegramMessage) {
  const user = message.from;
  const chatId = message.chat.id;
  
  const supabase = createClient(
    SUPABASE_URL ?? '',
    SUPABASE_SERVICE_ROLE_KEY ?? ''
  );

  // Находим профиль пользователя
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('telegram_id', user.id)
    .maybeSingle();

  if (!profile) {
    await sendTelegramMessage(chatId, `ℹ️ Вы ещё не зарегистрированы. Нажмите /start для начала.`);
    return;
  }

  // Проверяем статус партнёрства
  const { data: partnerProfile } = await supabase
    .from('partner_profiles')
    .select('name, status, partner_type')
    .eq('user_id', profile.id)
    .maybeSingle();

  if (partnerProfile) {
    const statusEmoji = partnerProfile.status === 'active' ? '✅' : '⏸️';
    const typeLabels: Record<string, string> = {
      star: '⭐ Звёздный партнёр',
      paid: '💎 Платный партнёр',
      free: '🆓 Бесплатный партнёр',
    };
    const typeLabel = typeLabels[partnerProfile.partner_type || 'free'] || '🆓 Бесплатный партнёр';

    await sendTelegramMessage(chatId, `${statusEmoji} <b>Вы партнёр!</b>

👤 <b>${partnerProfile.name}</b>
📊 Статус: ${partnerProfile.status === 'active' ? 'Активен' : 'Неактивен'}
🏷️ Тип: ${typeLabel}

Откройте /menu для управления карточкой.`);
    return;
  }

  // Проверяем заявки
  const { data: application } = await supabase
    .from('partner_applications')
    .select('name, status, rejection_reason, created_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (application) {
    const statusLabels = {
      pending: '⏳ На модерации',
      approved: '✅ Одобрена',
      rejected: '❌ Отклонена',
    };

    let statusText = `📋 <b>Статус вашей заявки</b>

👤 <b>${application.name}</b>
📊 Статус: ${statusLabels[application.status as keyof typeof statusLabels] || application.status}`;

    if (application.status === 'rejected' && application.rejection_reason) {
      statusText += `\n\n❌ <b>Причина отклонения:</b>\n${application.rejection_reason}`;
      statusText += `\n\nВы можете подать новую заявку через /menu`;
    }

    await sendTelegramMessage(chatId, statusText);
    return;
  }

  await sendTelegramMessage(chatId, `ℹ️ У вас нет активных заявок.

Хотите стать партнёром? Используйте /menu для подачи заявки.`);
}

Deno.serve(async (req: Request): Promise<Response> => {
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
      const text = update.message.text.trim();
      
      // Handle commands
      if (text === "/start" || text.startsWith("/start ")) {
        await handleStartCommand(update.message);
      } else if (text === "/help") {
        await handleHelpCommand(update.message);
      } else if (text === "/menu") {
        await handleMenuCommand(update.message);
      } else if (text === "/status") {
        await handleStatusCommand(update.message);
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
