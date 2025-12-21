import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface ApplicationPayload {
  type: 'INSERT'
  table: string
  record: {
    id: string
    name: string
    phone?: string
    city?: string
    profession?: string
    created_at: string
  }
}

interface InlineKeyboardButton {
  text: string
  url?: string
  callback_data?: string
}

interface InlineKeyboard {
  inline_keyboard: InlineKeyboardButton[][]
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

async function sendTelegramMessage(chatId: string, text: string, replyMarkup?: InlineKeyboard) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
  
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
  }
  
  if (replyMarkup) {
    body.reply_markup = replyMarkup
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
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

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials are not configured')
    }

    const payload: ApplicationPayload = await req.json()
    console.log('Received payload:', JSON.stringify(payload))

    if (payload.type !== 'INSERT' || payload.table !== 'partner_applications') {
      return new Response(
        JSON.stringify({ message: 'Ignored: not a new application' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { record } = payload
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get admin chat ID from settings
    const { data: adminChatSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'telegram_admin_chat_id')
      .single()

    const adminChatId = adminChatSetting?.value || '264133466'
    console.log('Admin chat ID:', adminChatId)

    // Get notification template from database
    const { data: templateData } = await supabase
      .from('notification_templates')
      .select('template')
      .eq('key', 'new_application')
      .single()

    let message: string

    if (templateData?.template) {
      // Use template from database
      const variables: Record<string, string> = {
        name: record.name,
        profession_line: record.profession ? `💼 <b>Профессия:</b> ${record.profession}` : '',
        city_line: record.city ? `📍 <b>Город:</b> ${record.city}` : '',
        phone_line: record.phone ? `📞 <b>Телефон:</b> ${record.phone}` : '',
      }
      message = replaceVariables(templateData.template, variables)
    } else {
      // Fallback to hardcoded message
      message = `
🆕 <b>Новая заявка партнёра!</b>

👤 <b>Имя:</b> ${record.name}
${record.profession ? `💼 <b>Профессия:</b> ${record.profession}` : ''}
${record.city ? `📍 <b>Город:</b> ${record.city}` : ''}
${record.phone ? `📞 <b>Телефон:</b> ${record.phone}` : ''}
      `.trim()
    }

    const inlineKeyboard: InlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: '📋 Перейти в админку',
            url: 'https://style-keeper-hub.lovable.app/admin/applications'
          }
        ]
      ]
    }

    await sendTelegramMessage(adminChatId, message, inlineKeyboard)
    console.log('Notification sent successfully to admin via bot')

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }),
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