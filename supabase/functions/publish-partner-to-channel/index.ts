import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')

interface PublishRequest {
  partner_profile_id: string
}

async function sendPhotoToChannel(chatId: string | number, photoUrl: string, caption: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption: caption,
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

async function sendMessageToChannel(chatId: string | number, text: string) {
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
  rutube?: string | null
  dzen?: string | null
  vk_video?: string | null
  tg_video?: string | null
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
  
  // Видеоплатформы
  const videoLinks: string[] = []
  
  if (partner.youtube) {
    videoLinks.push(`<a href="${partner.youtube}">YouTube</a>`)
  }
  
  if (partner.rutube) {
    videoLinks.push(`<a href="${partner.rutube}">Rutube</a>`)
  }
  
  if (partner.dzen) {
    videoLinks.push(`<a href="${partner.dzen}">Дзен</a>`)
  }
  
  if (partner.vk_video) {
    videoLinks.push(`<a href="${partner.vk_video}">VK Видео</a>`)
  }
  
  if (partner.tg_video) {
    const tgVideoLink = partner.tg_video.startsWith('@') 
      ? `https://t.me/${partner.tg_video.slice(1)}`
      : partner.tg_video
    videoLinks.push(`<a href="${tgVideoLink}">TG Видео</a>`)
  }
  
  if (videoLinks.length > 0) {
    message += `▶️ ${videoLinks.join(' | ')}\n`
  }
  
  if (partner.office_address) {
    message += `🏠 ${partner.office_address}\n`
  }
  
  return message
}

async function getSettings(supabase: any) {
  const { data: settings, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['telegram_channel_id', 'telegram_discussion_chat_id'])

  if (error) {
    console.error('Error fetching settings:', error)
    throw new Error('Failed to fetch settings')
  }

  const settingsMap: Record<string, string> = {}
  settings?.forEach((s: { key: string; value: string }) => {
    settingsMap[s.key] = s.value
  })

  return settingsMap
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured')
    }

    const { partner_profile_id }: PublishRequest = await req.json()
    console.log('Publishing partner to channel:', partner_profile_id)

    if (!partner_profile_id) {
      throw new Error('partner_profile_id is required')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Получаем настройки из базы данных
    const settings = await getSettings(supabase)
    const channelId = settings['telegram_channel_id']

    if (!channelId) {
      throw new Error('telegram_channel_id is not configured in settings')
    }

    // Получаем данные партнёра с заявкой (для фото)
    const { data: partner, error: partnerError } = await supabase
      .from('partner_profiles')
      .select(`
        *,
        partner_profile_categories (
          categories (name)
        ),
        partner_applications!partner_profiles_application_id_fkey (
          photo_url
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

    // Проверяем что пост ещё не опубликован
    if (partner.channel_post_id) {
      console.log('Partner already has a channel post:', partner.channel_post_id)
      return new Response(
        JSON.stringify({ success: true, message: 'Already published', channel_post_id: partner.channel_post_id }),
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

    // Получаем URL фото из заявки
    const photoUrl = partner.partner_applications?.[0]?.photo_url

    let result: { result: { message_id: number } }

    // Публикуем на канале - с фото или без
    if (photoUrl) {
      console.log('Publishing with photo:', photoUrl)
      result = await sendPhotoToChannel(channelId, photoUrl, messageText)
    } else {
      console.log('Publishing without photo')
      result = await sendMessageToChannel(channelId, messageText)
    }

    const channelPostId = result.result.message_id
    console.log('Channel post created:', channelPostId)

    // Сохраняем channel_post_id
    const { error: updateError } = await supabase
      .from('partner_profiles')
      .update({ channel_post_id: channelPostId })
      .eq('id', partner_profile_id)

    if (updateError) {
      console.error('Error updating partner with channel_post_id:', updateError)
    }

    return new Response(
      JSON.stringify({ success: true, channel_post_id: channelPostId }),
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
