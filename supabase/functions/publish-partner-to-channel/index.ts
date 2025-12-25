import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')

interface PublishRequest {
  partner_profile_id: string
}

interface PartnerData {
  name: string
  profession?: string | null
  profession_descriptions?: Record<string, string> | null
  city?: string | null
  age?: number | null
  agency_name?: string | null
  agency_description?: string | null
  self_description?: string | null
  office_address?: string | null
  photo_url?: string | null
  phone?: string | null
  tg_channel?: string | null
  website?: string | null
  youtube?: string | null
  rutube?: string | null
  dzen?: string | null
  vk_video?: string | null
  tg_video?: string | null
  categories?: { name: string }[]
  card_template_id?: string | null
}

interface CardTemplate {
  id: string
  image_url: string
  text_x: number
  text_y: number
  text_color: string
  font_size: number
}

async function getCardTemplate(supabase: any, templateId: string | null): Promise<CardTemplate | null> {
  // Try to get specific template
  if (templateId) {
    const { data } = await supabase
      .from('card_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single()
    if (data) return data
  }

  // Fallback to default template
  const { data: defaultTemplate } = await supabase
    .from('card_templates')
    .select('*')
    .eq('is_default', true)
    .eq('is_active', true)
    .single()
  
  if (defaultTemplate) return defaultTemplate

  // Fallback to any active template
  const { data: anyTemplate } = await supabase
    .from('card_templates')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .single()

  return anyTemplate || null
}

// Helper to ensure HTTPS URL (Telegram requires HTTPS)
function ensureHttps(url: string | null | undefined): string | null {
  if (!url) return null
  
  // Trim whitespace
  url = url.trim()
  
  // If already HTTPS, return as is
  if (url.startsWith('https://')) return url
  
  // If HTTP, convert to HTTPS
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://')
  }
  
  // If no protocol, add HTTPS
  if (!url.startsWith('http')) {
    return `https://${url}`
  }
  
  return url
}

// Validate URL format
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

async function sendPhotoToChannel(chatId: string | number, photoUrl: string, caption: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`
  
  // Ensure photo URL uses HTTPS
  const httpsPhotoUrl = ensureHttps(photoUrl)
  
  if (!httpsPhotoUrl) {
    throw new Error('Invalid photo URL: URL is empty')
  }
  
  // Validate URL format
  if (!isValidUrl(httpsPhotoUrl)) {
    throw new Error(`Invalid photo URL format: ${httpsPhotoUrl}`)
  }
  
  console.log('Sending photo with URL:', httpsPhotoUrl)
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      photo: httpsPhotoUrl,
      caption: caption,
      parse_mode: 'HTML',
      show_caption_above_media: true,  // Show caption above photo for better readability
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Telegram API error:', error)
    console.error('Photo URL was:', httpsPhotoUrl)
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
      link_preview_options: {
        is_disabled: false,
        prefer_large_media: true,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Telegram API error:', error)
    throw new Error(`Telegram API error: ${error}`)
  }

  return response.json()
}

// Custom emoji IDs from telegram packs
const CUSTOM_EMOJI = {
  star: '5370869711888194012',        // ⭐ from G5ART pack
  fire: '5368324170671202286',       // 🔥 from G5ART pack
  heart: '5370984529235089419',      // ❤️ from G5ART pack
  sparkles: '5372981976452164567',   // ✨ from G5ART pack
  diamond: '5377599288861913143',    // 💎 from minec_emoji
  crown: '5370869711888194013',      // 👑 from G5ART pack
  check: '5368324170671202290',      // ✅ from G5ART pack
  location: '5372981976452164570',   // 📍 from G5ART pack
  phone: '5370984529235089420',      // 📞 from G5ART pack
  link: '5368324170671202288',       // 🔗 from G5ART pack
}

// Helper function to create custom emoji
function customEmoji(emojiId: string): string {
  return `<tg-emoji emoji-id="${emojiId}"></tg-emoji>`
}

function formatPartnerCaption(partner: PartnerData) {
  let message = ''
  
  // Header with name and decorative line
  message += `${customEmoji(CUSTOM_EMOJI.crown)} <b>${partner.name}</b> ${customEmoji(CUSTOM_EMOJI.star)}\n`
  message += `<i>═══════════════════</i>\n`
  
  // Info line with profession, city, age - enhanced formatting
  const info: string[] = []
  if (partner.profession) {
    info.push(`${customEmoji(CUSTOM_EMOJI.diamond)} <b>${partner.profession}</b>`)
  }
  if (partner.city) {
    info.push(`${customEmoji(CUSTOM_EMOJI.location)} ${partner.city}`)
  }
  if (partner.age) {
    info.push(`${partner.age} лет`)
  }
  
  if (info.length > 0) {
    message += info.join(' • ') + '\n'
  }
  message += '\n'
  
  // Profession descriptions in expandable spoilers
  if (partner.profession_descriptions && typeof partner.profession_descriptions === 'object') {
    const professions = partner.profession ? partner.profession.split(', ').map(p => p.trim()) : []
    
    for (const prof of professions) {
      const desc = partner.profession_descriptions[prof]
      if (desc && desc.trim()) {
        message += `${customEmoji(CUSTOM_EMOJI.sparkles)} <b>${prof}:</b>\n`
        message += `${desc.trim()}\n\n`
      }
    }
  }
  
  // About section
  if (partner.self_description) {
    message += `${customEmoji(CUSTOM_EMOJI.heart)} <b>О себе:</b>\n`
    message += `${partner.self_description.trim()}\n\n`
  }
  
  // Agency info with enhanced formatting
  if (partner.agency_name) {
    message += `${customEmoji(CUSTOM_EMOJI.fire)} <b>${partner.agency_name}</b>\n`
    if (partner.agency_description) {
      message += `${partner.agency_description.trim()}\n`
    }
    message += '\n'
  }
  
  // Contacts section with separator
  message += `<i>═══════════════════</i>\n`
  message += `${customEmoji(CUSTOM_EMOJI.link)} <b>Контакты:</b>\n\n`
  
  if (partner.phone) {
    message += `${customEmoji(CUSTOM_EMOJI.phone)} <code>${partner.phone}</code>\n`
  }
  
  // Links with enhanced formatting
  const links: string[] = []
  
  if (partner.tg_channel) {
    const channelLink = partner.tg_channel.startsWith('@') 
      ? `https://t.me/${partner.tg_channel.slice(1)}`
      : partner.tg_channel.startsWith('http') ? partner.tg_channel : `https://t.me/${partner.tg_channel}`
    links.push(`<a href="${channelLink}">💬 Telegram</a>`)
  }
  
  if (partner.website) {
    const websiteUrl = partner.website.startsWith('http') ? partner.website : `https://${partner.website}`
    links.push(`<a href="${websiteUrl}">🌐 Сайт</a>`)
  }
  
  if (partner.youtube) {
    links.push(`<a href="${partner.youtube}">▶️ YouTube</a>`)
  }
  
  if (partner.rutube) {
    links.push(`<a href="${partner.rutube}">📺 Rutube</a>`)
  }
  
  if (partner.dzen) {
    links.push(`<a href="${partner.dzen}">📰 Дзен</a>`)
  }
  
  if (partner.vk_video) {
    links.push(`<a href="${partner.vk_video}">📹 VK Видео</a>`)
  }
  
  if (links.length > 0) {
    message += '\n' + links.join(' <b>|</b> ') + '\n'
  }
  
  // Office address with location emoji
  if (partner.office_address) {
    message += `\n${customEmoji(CUSTOM_EMOJI.location)} <b>Адрес:</b> <i>${partner.office_address}</i>\n`
  }
  
  // Hashtags from professions with enhanced styling
  if (partner.profession) {
    const hashtags = partner.profession
      .split(', ')
      .map(p => p.trim())
      .filter(p => p)
      .map(p => '#' + p.replace(/[\s-]+/g, '').replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, ''))
    
    if (hashtags.length > 0) {
      message += '\n<i>═══════════════════</i>\n'
      message += hashtags.join(' ') + ' '
      message += customEmoji(CUSTOM_EMOJI.sparkles)
    }
  }
  
  return message.trim()
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

    // Получаем URL фото из заявки
    const photoUrl = partner.partner_applications?.[0]?.photo_url

    const partnerData: PartnerData = {
      ...partner,
      photo_url: photoUrl,
      categories
    }

    // Получаем шаблон карточки
    const template = await getCardTemplate(supabase, partner.card_template_id)
    console.log('Using template:', template?.id || 'none')

    // Форматируем текстовый caption
    const caption = formatPartnerCaption(partnerData)
    console.log('Generated caption:', caption)

    let result: { result: { message_id: number } }

    // Публикуем на канале - с шаблоном, фото или без
    const imageToSend = template?.image_url || photoUrl
    
    if (imageToSend) {
      // Ensure HTTPS and validate URL
      const validImageUrl = ensureHttps(imageToSend)
      
      if (validImageUrl && isValidUrl(validImageUrl)) {
        console.log('Publishing with image:', validImageUrl)
        try {
          result = await sendPhotoToChannel(channelId, validImageUrl, caption)
        } catch (photoError) {
          console.error('Failed to send photo, falling back to text-only:', photoError)
          console.log('Publishing without image (fallback)')
          result = await sendMessageToChannel(channelId, caption)
        }
      } else {
        console.warn('Invalid image URL, publishing text-only:', imageToSend)
        result = await sendMessageToChannel(channelId, caption)
      }
    } else {
      console.log('Publishing without image')
      result = await sendMessageToChannel(channelId, caption)
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
      JSON.stringify({ 
        success: true, 
        channel_post_id: channelPostId,
        template_used: template?.id || null
      }),
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
