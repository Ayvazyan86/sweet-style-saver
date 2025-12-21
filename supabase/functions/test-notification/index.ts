import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const ADMIN_CHAT_ID = Deno.env.get('ADMIN_TELEGRAM_CHAT_ID') || '264133466'

interface TestNotificationRequest {
  templateKey: string
  template: string
}

// Demo data for testing
const demoData: Record<string, Record<string, string>> = {
  new_application: {
    name: 'Иван Тестов',
    profession_line: '💼 <b>Профессия:</b> Маркетолог',
    city_line: '📍 <b>Город:</b> Москва',
    phone_line: '📞 <b>Телефон:</b> +7 (999) 123-45-67',
  },
  application_approved: {
    name: 'Иван Тестов',
  },
  application_rejected: {
    name: 'Иван Тестов',
    rejection_reason_line: '<b>Причина:</b> Недостаточно информации в анкете',
  },
  new_order: {
    text: 'Нужен маркетолог для продвижения интернет-магазина одежды',
    city_line: '📍 <b>Город:</b> Санкт-Петербург',
    budget_line: '💰 <b>Бюджет:</b> 50 000 ₽',
    contact: '@testuser',
  },
  new_question: {
    text: 'Как правильно настроить таргетированную рекламу для B2B сегмента?',
    details_line: '📝 <b>Детали:</b> Интересует опыт работы с LinkedIn и Facebook',
  },
}

function replaceVariables(template: string, data: Record<string, string>): string {
  let result = template
  
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }
  
  // Remove any remaining variables with _line suffix that weren't replaced
  result = result.replace(/\{[a-z_]+_line\}/g, '')
  
  // Clean up multiple empty lines
  result = result.replace(/\n{3,}/g, '\n\n')
  
  return result.trim()
}

async function sendTelegramMessage(chatId: string, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: `🧪 <b>ТЕСТОВОЕ СООБЩЕНИЕ</b>\n\n${text}`,
      parse_mode: 'HTML',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Telegram API error:', error)
    throw new Error(`Telegram API error: ${error}`)
  }

  return response.json()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured')
    }

    const { templateKey, template }: TestNotificationRequest = await req.json()
    console.log('Testing notification:', templateKey)

    const data = demoData[templateKey] || {}
    const message = replaceVariables(template, data)

    await sendTelegramMessage(ADMIN_CHAT_ID, message)
    console.log('Test notification sent successfully')

    return new Response(
      JSON.stringify({ success: true, message: 'Test notification sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})