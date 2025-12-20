import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const CHANNEL_ID = Deno.env.get('ADMIN_TELEGRAM_CHAT_ID')

interface UpdateRequest {
  partner_profile_id: string
}

async function editTelegramMessage(chatId: string | number, messageId: number, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
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

function formatPartnerMessage(partner: {
  name: string
  profession?: string | null
  city?: string | null
  age?: number | null
  agency_name?: string | null
  agency_description?: string | null
  self_description?: string | null
  phone?: string | null
  tg_channel?: string | null
  website?: string | null
  youtube?: string | null
  office_address?: string | null
  categories?: { name: string }[]
}) {
  let message = `👤 <b>${partner.name}</b>\n`
  
  if (partner.profession) {
    message += `💼 ${partner.profession}\n`
  }
  
  if (partner.city) {
    message += `📍 ${partner.city}\n`
  }
  
  if (partner.age) {
    message += `🎂 ${partner.age} лет\n`
  }
  
  message += '\n'
  
  if (partner.agency_name) {
    message += `🏢 <b>${partner.agency_name}</b>\n`
  }
  
  if (partner.agency_description) {
    message += `${partner.agency_description}\n\n`
  }
  
  if (partner.self_description) {
    message += `📝 ${partner.self_description}\n\n`
  }
  
  if (partner.categories && partner.categories.length > 0) {
    const categoryNames = partner.categories.map(c => c.name).join(', ')
    message += `🏷️ <i>${categoryNames}</i>\n\n`
  }
  
  message += '📞 <b>Контакты:</b>\n'
  
  if (partner.phone) {
    message += `📱 ${partner.phone}\n`
  }
  
  if (partner.tg_channel) {
    const channelLink = partner.tg_channel.startsWith('@') 
      ? `https://t.me/${partner.tg_channel.slice(1)}`
      : partner.tg_channel
    message += `💬 <a href="${channelLink}">Telegram</a>\n`
  }
  
  if (partner.website) {
    const websiteUrl = partner.website.startsWith('http') ? partner.website : `https://${partner.website}`
    message += `🌐 <a href="${websiteUrl}">Сайт</a>\n`
  }
  
  if (partner.youtube) {
    message += `▶️ <a href="${partner.youtube}">YouTube</a>\n`
  }
  
  if (partner.office_address) {
    message += `🏠 ${partner.office_address}\n`
  }
  
  return message
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured')
    }

    if (!CHANNEL_ID) {
      throw new Error('ADMIN_TELEGRAM_CHAT_ID is not configured')
    }

    const { partner_profile_id }: UpdateRequest = await req.json()
    console.log('Updating partner post for:', partner_profile_id)

    if (!partner_profile_id) {
      throw new Error('partner_profile_id is required')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Получаем данные партнёра
    const { data: partner, error: partnerError } = await supabase
      .from('partner_profiles')
      .select(`
        *,
        partner_profile_categories (
          categories (name)
        )
      `)
      .eq('id', partner_profile_id)
      .single()

    if (partnerError) {
      console.error('Error fetching partner:', partnerError)
      throw partnerError
    }

    if (!partner) {
      throw new Error('Partner profile not found')
    }

    if (!partner.channel_post_id) {
      console.log('Partner has no channel_post_id, skipping update')
      return new Response(
        JSON.stringify({ success: true, message: 'No channel post to update' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Форматируем категории
    const categories = partner.partner_profile_categories?.map((pc: { categories: { name: string } }) => ({
      name: pc.categories.name
    })) || []

    // Форматируем сообщение
    const messageText = formatPartnerMessage({
      ...partner,
      categories
    })

    // Редактируем сообщение на канале
    await editTelegramMessage(CHANNEL_ID, partner.channel_post_id, messageText)
    console.log('Channel post updated successfully:', partner.channel_post_id)

    return new Response(
      JSON.stringify({ success: true, message: 'Channel post updated' }),
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
