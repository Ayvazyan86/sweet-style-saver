import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')

interface UpdateRequest {
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
  if (templateId) {
    const { data } = await supabase
      .from('card_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single()
    if (data) return data
  }

  const { data: defaultTemplate } = await supabase
    .from('card_templates')
    .select('*')
    .eq('is_default', true)
    .eq('is_active', true)
    .single()
  
  if (defaultTemplate) return defaultTemplate

  const { data: anyTemplate } = await supabase
    .from('card_templates')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .single()

  return anyTemplate || null
}

async function editMessageCaption(chatId: string | number, messageId: number, caption: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageCaption`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
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

async function editMessageMedia(chatId: string | number, messageId: number, photoUrl: string, caption: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageMedia`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      media: {
        type: 'photo',
        media: photoUrl,
        caption: caption,
        parse_mode: 'HTML'
      }
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Telegram API error:', error)
    throw new Error(`Telegram API error: ${error}`)
  }

  return response.json()
}

function formatPartnerCaption(partner: PartnerData) {
  let message = ''
  
  // Header with name
  message += `<b>${partner.name}</b>\n`
  
  // Info line with profession, city, age
  const info: string[] = []
  if (partner.profession) info.push(partner.profession)
  if (partner.city) info.push(`📍 ${partner.city}`)
  if (partner.age) info.push(`${partner.age} лет`)
  
  if (info.length > 0) {
    message += info.join(' • ') + '\n'
  }
  message += '\n'
  
  // Profession descriptions in quote blocks
  if (partner.profession_descriptions && typeof partner.profession_descriptions === 'object') {
    const professions = partner.profession ? partner.profession.split(', ').map(p => p.trim()) : []
    
    for (const prof of professions) {
      const desc = partner.profession_descriptions[prof]
      if (desc && desc.trim()) {
        message += `❝ <b>${prof}:</b> ${desc.trim()} ❞\n\n`
      }
    }
  }
  
  // About section in quote block
  if (partner.self_description) {
    message += `❝ <b>О себе:</b>\n${partner.self_description.trim()} ❞\n\n`
  }
  
  // Agency info
  if (partner.agency_name) {
    message += `🏢 <b>${partner.agency_name}</b>\n`
    if (partner.agency_description) {
      message += `❝ ${partner.agency_description.trim()} ❞\n`
    }
    message += '\n'
  }
  
  // Contacts section
  message += '<b>Контакты:</b>\n'
  
  if (partner.phone) {
    message += `📞 ${partner.phone}\n`
  }
  
  // Links on one line with separators
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
    message += links.join(' | ') + '\n'
  }
  
  // Office address
  if (partner.office_address) {
    message += `\n<b>Адрес офиса:</b> ${partner.office_address}\n`
  }
  
  // Hashtags from professions
  if (partner.profession) {
    const hashtags = partner.profession
      .split(', ')
      .map(p => p.trim())
      .filter(p => p)
      .map(p => '#' + p.replace(/[\s-]+/g, '').replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, ''))
    
    if (hashtags.length > 0) {
      message += '\n' + hashtags.join(' ')
    }
  }
  
  return message.trim()
}

async function getSettings(supabase: any) {
  const { data: settings, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['telegram_channel_id'])

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

    const { partner_profile_id }: UpdateRequest = await req.json()
    console.log('Updating partner post for:', partner_profile_id)

    if (!partner_profile_id) {
      throw new Error('partner_profile_id is required')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const settings = await getSettings(supabase)
    const channelId = settings['telegram_channel_id']

    if (!channelId) {
      throw new Error('telegram_channel_id is not configured in settings')
    }

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

    const categories = partner.partner_profile_categories?.map((pc: { categories: { name: string } }) => ({
      name: pc.categories.name
    })) || []

    const partnerData: PartnerData = {
      ...partner,
      categories
    }

    // Get template
    const template = await getCardTemplate(supabase, partner.card_template_id)
    console.log('Using template:', template?.id || 'none')

    const caption = formatPartnerCaption(partnerData)
    console.log('Generated caption:', caption)

    // Update post - with template image if available
    if (template?.image_url) {
      try {
        await editMessageMedia(channelId, partner.channel_post_id, template.image_url, caption)
        console.log('Channel post media updated successfully')
      } catch (mediaError) {
        console.warn('Failed to edit media, trying caption only:', mediaError)
        await editMessageCaption(channelId, partner.channel_post_id, caption)
      }
    } else {
      await editMessageCaption(channelId, partner.channel_post_id, caption)
    }

    console.log('Channel post updated successfully:', partner.channel_post_id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Channel post updated',
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
