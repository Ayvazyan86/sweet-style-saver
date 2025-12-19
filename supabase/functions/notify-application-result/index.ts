import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')

interface ModerationPayload {
  type: 'UPDATE'
  table: string
  old_record: {
    id: string
    status: string
  }
  record: {
    id: string
    user_id: string
    name: string
    status: string
    rejection_reason?: string
  }
}

async function sendTelegramMessage(chatId: string | number, text: string) {
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured')
    }

    const payload: ModerationPayload = await req.json()
    console.log('Received payload:', JSON.stringify(payload))

    // Only process status changes
    if (payload.type !== 'UPDATE' || payload.table !== 'partner_applications') {
      return new Response(
        JSON.stringify({ message: 'Ignored: not an application update' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if status actually changed to approved or rejected
    const oldStatus = payload.old_record.status
    const newStatus = payload.record.status
    
    if (oldStatus === newStatus || (newStatus !== 'approved' && newStatus !== 'rejected')) {
      return new Response(
        JSON.stringify({ message: 'Ignored: status not changed to approved/rejected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's telegram_id from profiles
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('telegram_id')
      .eq('id', payload.record.user_id)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      throw profileError
    }

    if (!profile?.telegram_id) {
      console.log('No telegram_id found for user:', payload.record.user_id)
      return new Response(
        JSON.stringify({ message: 'User has no telegram_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format message based on status
    let message: string
    
    if (newStatus === 'approved') {
      message = `
✅ <b>Ваша заявка одобрена!</b>

Поздравляем, ${payload.record.name}! Ваша заявка на партнёрство успешно прошла модерацию.

Теперь вы можете получать заказы и вопросы от клиентов.

Добро пожаловать в команду! 🎉
      `.trim()
    } else {
      message = `
❌ <b>Ваша заявка отклонена</b>

К сожалению, ${payload.record.name}, ваша заявка на партнёрство не прошла модерацию.

${payload.record.rejection_reason ? `<b>Причина:</b> ${payload.record.rejection_reason}` : ''}

Вы можете подать новую заявку, исправив указанные замечания.
      `.trim()
    }

    await sendTelegramMessage(profile.telegram_id, message)
    console.log('User notification sent successfully to:', profile.telegram_id)

    return new Response(
      JSON.stringify({ success: true, message: 'User notification sent' }),
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
