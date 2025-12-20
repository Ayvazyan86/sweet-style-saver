import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
// Personal Telegram ID of @Ayvazyan_VK for direct notifications
const ADMIN_CHAT_ID = '264133466'

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

async function sendTelegramMessage(chatId: string, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured')
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
    
    // Format notification message
    const message = `
🆕 <b>Новая заявка партнёра!</b>

👤 <b>Имя:</b> ${record.name}
${record.profession ? `💼 <b>Профессия:</b> ${record.profession}` : ''}
${record.city ? `📍 <b>Город:</b> ${record.city}` : ''}
${record.phone ? `📞 <b>Телефон:</b> ${record.phone}` : ''}

🔗 <a href="https://style-keeper-hub.lovable.app/admin/applications">Перейти к модерации</a>
    `.trim()

    await sendTelegramMessage(ADMIN_CHAT_ID, message)
    console.log('Notification sent successfully')

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
