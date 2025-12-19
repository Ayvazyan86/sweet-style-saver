import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const TELEGRAM_DISCUSSION_CHAT_ID = Deno.env.get('TELEGRAM_DISCUSSION_CHAT_ID')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface OrderPayload {
  type: 'INSERT'
  table: string
  record: {
    id: string
    user_id: string
    category_id: string
    title: string
    text: string
    city?: string
    budget?: string
    contact?: string
    created_at: string
  }
}

async function sendTelegramComment(chatId: string, replyToMessageId: number, text: string) {
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
      reply_to_message_id: replyToMessageId,
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

    if (!TELEGRAM_DISCUSSION_CHAT_ID) {
      throw new Error('TELEGRAM_DISCUSSION_CHAT_ID is not configured')
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials are not configured')
    }

    const payload: OrderPayload = await req.json()
    console.log('Received order payload:', JSON.stringify(payload))

    if (payload.type !== 'INSERT' || payload.table !== 'orders') {
      return new Response(
        JSON.stringify({ message: 'Ignored: not a new order' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { record } = payload
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Получаем все категории заказа
    const { data: orderCategories } = await supabase
      .from('order_categories')
      .select('category_id')
      .eq('order_id', record.id)

    // Используем категории из order_categories или основную категорию заказа
    const categoryIds = orderCategories && orderCategories.length > 0
      ? orderCategories.map(c => c.category_id) 
      : [record.category_id]
    console.log('Order categories:', categoryIds)

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

    // Получаем активных партнёров с discussion_message_id
    const { data: partners } = await supabase
      .from('partner_profiles')
      .select('id, name, discussion_message_id')
      .in('id', partnerIds)
      .eq('status', 'active')
      .not('discussion_message_id', 'is', null)

    if (!partners || partners.length === 0) {
      console.log('No active partners with discussion_message_id found')
      return new Response(
        JSON.stringify({ message: 'No active partners with discussion posts' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Формируем сообщение
    const message = `
🛒 <b>Новый заказ!</b>

📂 <b>Категория:</b> ${category?.name || 'Не указана'}
📝 <b>Заголовок:</b> ${record.title}

${record.text}

${record.city ? `📍 <b>Город:</b> ${record.city}` : ''}
${record.budget ? `💰 <b>Бюджет:</b> ${record.budget} ₽` : ''}
${record.contact ? `📞 <b>Контакт:</b> ${record.contact}` : ''}
    `.trim()

    // Отправляем в комментарии каждого партнёра
    let sentCount = 0
    for (const partner of partners) {
      if (partner.discussion_message_id) {
        const success = await sendTelegramComment(
          TELEGRAM_DISCUSSION_CHAT_ID,
          partner.discussion_message_id,
          message
        )
        if (success) {
          sentCount++
          console.log(`Sent to partner ${partner.name} comments (message_id: ${partner.discussion_message_id})`)
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