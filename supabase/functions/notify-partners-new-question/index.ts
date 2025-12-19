import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface QuestionPayload {
  type: 'INSERT'
  table: string
  record: {
    id: string
    user_id: string
    category_id: string
    text: string
    details?: string
    created_at: string
  }
}

async function sendTelegramMessage(chatId: number, text: string) {
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
    return false
  }

  return true
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

    const payload: QuestionPayload = await req.json()
    console.log('Received question payload:', JSON.stringify(payload))

    if (payload.type !== 'INSERT' || payload.table !== 'questions') {
      return new Response(
        JSON.stringify({ message: 'Ignored: not a new question' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { record } = payload
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Получаем все категории вопроса
    const { data: questionCategories } = await supabase
      .from('question_categories')
      .select('category_id')
      .eq('question_id', record.id)

    const categoryIds = questionCategories?.map(c => c.category_id) || [record.category_id]
    console.log('Question categories:', categoryIds)

    // Получаем название категории
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', record.category_id)
      .single()

    // Находим партнёров с совпадающими категориями
    const { data: partnerCategories } = await supabase
      .from('partner_profile_categories')
      .select('profile_id')
      .in('category_id', categoryIds)

    if (!partnerCategories || partnerCategories.length === 0) {
      console.log('No partners found for these categories')
      return new Response(
        JSON.stringify({ message: 'No partners for these categories' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Уникальные ID партнёров
    const partnerIds = [...new Set(partnerCategories.map(pc => pc.profile_id))]
    console.log('Found partners:', partnerIds.length)

    // Получаем активных партнёров с их telegram_id
    const { data: partners } = await supabase
      .from('partner_profiles')
      .select('id, user_id, name')
      .in('id', partnerIds)
      .eq('status', 'active')

    if (!partners || partners.length === 0) {
      console.log('No active partners found')
      return new Response(
        JSON.stringify({ message: 'No active partners' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Получаем telegram_id для каждого партнёра
    const userIds = partners.map(p => p.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, telegram_id')
      .in('id', userIds)

    const telegramIdMap = new Map(profiles?.map(p => [p.id, p.telegram_id]) || [])

    // Формируем сообщение
    const message = `
❓ <b>Новый вопрос!</b>

📂 <b>Категория:</b> ${category?.name || 'Не указана'}

${record.text}

${record.details ? `\n📝 <b>Детали:</b>\n${record.details}` : ''}
    `.trim()

    // Отправляем каждому партнёру
    let sentCount = 0
    for (const partner of partners) {
      const telegramId = telegramIdMap.get(partner.user_id)
      if (telegramId) {
        const success = await sendTelegramMessage(telegramId, message)
        if (success) {
          sentCount++
          console.log(`Sent to partner ${partner.name} (${telegramId})`)
        }
      }
    }

    console.log(`Notifications sent to ${sentCount}/${partners.length} partners`)

    return new Response(
      JSON.stringify({ success: true, sentCount, totalPartners: partners.length }),
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
