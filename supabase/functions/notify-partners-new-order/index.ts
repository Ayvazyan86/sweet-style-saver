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

interface Partner {
  id: string
  name: string
  partner_type: 'star' | 'paid' | 'free' | null
  discussion_message_id: number | null
  channel_post_id: number | null
}

// Порядок сортировки по типу партнёра
const PARTNER_TYPE_ORDER: Record<string, number> = {
  'star': 1,
  'paid': 2,
  'free': 3,
}

async function sendTelegramMessage(chatId: string | number, text: string, replyToMessageId?: number) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
  
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
  }
  
  if (replyToMessageId) {
    body.reply_to_message_id = replyToMessageId
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Telegram API error:', error)
    return { success: false, error }
  }

  const result = await response.json()
  return { success: true, messageId: result.result?.message_id }
}

async function logError(
  supabase: any,
  errorType: string,
  partnerId: string | null,
  entityType: 'order' | 'question',
  entityId: string,
  errorMessage: string
) {
  try {
    await supabase.from('notification_errors').insert({
      error_type: errorType,
      partner_profile_id: partnerId,
      entity_type: entityType,
      entity_id: entityId,
      error_message: errorMessage,
    })
    console.log(`Error logged: ${errorType} for ${entityType} ${entityId}`)
  } catch (e) {
    console.error('Failed to log error:', e)
  }
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

    const partnerIds = [...new Set(partnerCategories.map(pc => pc.profile_id))]
    console.log('Found partner IDs:', partnerIds.length)

    // Получаем ВСЕХ активных партнёров (включая без discussion_message_id для логирования ошибок)
    const { data: allPartners } = await supabase
      .from('partner_profiles')
      .select('id, name, partner_type, discussion_message_id, channel_post_id')
      .in('id', partnerIds)
      .eq('status', 'active')

    if (!allPartners || allPartners.length === 0) {
      console.log('No active partners found')
      return new Response(
        JSON.stringify({ message: 'No active partners' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Сортируем партнёров по типу: star → paid → free
    const sortedPartners = (allPartners as Partner[]).sort((a, b) => {
      const orderA = PARTNER_TYPE_ORDER[a.partner_type || 'free'] || 3
      const orderB = PARTNER_TYPE_ORDER[b.partner_type || 'free'] || 3
      return orderA - orderB
    })

    console.log('Sorted partners:', sortedPartners.map(p => `${p.name} (${p.partner_type})`))

    // Формируем сообщение для комментариев
    const orderMessage = `
🛒 <b>Новый заказ!</b>

📂 <b>Категория:</b> ${category?.name || 'Не указана'}
📝 <b>Заголовок:</b> ${record.title}

${record.text}

${record.city ? `📍 <b>Город:</b> ${record.city}` : ''}
${record.budget ? `💰 <b>Бюджет:</b> ${record.budget} ₽` : ''}
${record.contact ? `📞 <b>Контакт:</b> ${record.contact}` : ''}
    `.trim()

    // Отправляем и записываем публикации
    let sentCount = 0
    const successfulPartners: { name: string; channelPostId: number | null }[] = []

    for (const partner of sortedPartners) {
      // Проверяем наличие discussion_message_id
      if (!partner.discussion_message_id) {
        await logError(
          supabase,
          'missing_discussion_message_id',
          partner.id,
          'order',
          record.id,
          `Partner ${partner.name} has no discussion_message_id`
        )
        continue
      }

      // Проверяем наличие channel_post_id для ссылки пользователю
      if (!partner.channel_post_id) {
        await logError(
          supabase,
          'missing_channel_post_id',
          partner.id,
          'order',
          record.id,
          `Partner ${partner.name} has no channel_post_id for user link`
        )
      }

      const result = await sendTelegramMessage(
        TELEGRAM_DISCUSSION_CHAT_ID,
        orderMessage,
        partner.discussion_message_id
      )

      if (result.success) {
        sentCount++
        successfulPartners.push({ name: partner.name, channelPostId: partner.channel_post_id })
        console.log(`Sent to partner ${partner.name} (${partner.partner_type}) comments`)

        // Записываем в order_publications
        await supabase.from('order_publications').insert({
          order_id: record.id,
          partner_profile_id: partner.id,
          message_id: result.messageId,
        })
      } else {
        await logError(
          supabase,
          'telegram_send_failed',
          partner.id,
          'order',
          record.id,
          `Failed to send to ${partner.name}: ${result.error}`
        )
      }
    }

    console.log(`Notifications sent to ${sentCount}/${sortedPartners.length} partners`)

    // Отправляем уведомление пользователю
    if (sentCount > 0) {
      // Получаем telegram_id пользователя
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('telegram_id')
        .eq('id', record.user_id)
        .single()

      if (userProfile?.telegram_id) {
        // Формируем ссылки на карточки партнёров
        const partnerLinks = successfulPartners
          .filter(p => p.channelPostId)
          .map(p => `🔹 <a href="https://t.me/c/${TELEGRAM_DISCUSSION_CHAT_ID?.replace('-100', '')}/${p.channelPostId}">${p.name}</a>`)
          .join('\n')

        const userMessage = `
✅ <b>Ваш заказ отправлен кандидатам!</b>

${partnerLinks || 'Ссылки на кандидатов будут доступны позже.'}

Ожидайте ответа в комментариях к их карточкам.
        `.trim()

        await sendTelegramMessage(userProfile.telegram_id, userMessage)
        console.log(`User notification sent to telegram_id: ${userProfile.telegram_id}`)
      }
    }

    return new Response(
      JSON.stringify({ success: true, sentCount, totalPartners: sortedPartners.length }),
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
