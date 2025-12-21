import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')

interface PublishRequest {
  partner_profile_id: string
}

interface PartnerData {
  name: string
  profession?: string | null
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
}

async function generateCardImage(partner: PartnerData): Promise<string | null> {
  if (!LOVABLE_API_KEY) {
    console.log('LOVABLE_API_KEY not configured, skipping card generation')
    return null
  }

  try {
    const locationAge = [partner.city, partner.age ? `${partner.age} лет` : null]
      .filter(Boolean)
      .join('. ')

    const prompt = `Generate a professional business card image with elegant teal and silver wave design background.

Layout:
- LEFT SIDE (dark teal area):
  - Circular avatar placeholder (grey circle with person icon silhouette) positioned in upper-left
  - Below avatar: Name "${partner.name}" in large white bold elegant font
  - Below name: "${locationAge || 'Россия'}" in smaller white text

- RIGHT SIDE (silver metallic curved area):
  ${partner.agency_name ? `- Label "Агентство:" in small grey text, below it "${partner.agency_name}" in teal (#00897B) bold text` : ''}
  ${partner.profession ? `- Label "Профессия:" in small grey text, below it "${partner.profession}" in teal (#00897B) text` : ''}
  ${partner.office_address ? `- Label "Офис:" in small grey text, below it "${partner.office_address}" in teal (#00897B) text` : ''}

Design requirements:
- Background: flowing teal (#0d4d4d) to dark teal gradient with elegant silver metallic wave accent on right side
- Modern, premium, corporate look
- Clean readable white text on dark areas
- Teal text on silver areas
- Aspect ratio: 16:9 (1024x576px)
- NO extra decorations, just clean professional design`

    console.log('Generating card with AI...')

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('AI Gateway error:', error)
      return null
    }

    const data = await response.json()
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url

    if (!imageUrl) {
      console.error('No image in AI response')
      return null
    }

    console.log('Card image generated successfully')
    return imageUrl
  } catch (error) {
    console.error('Error generating card:', error)
    return null
  }
}

async function uploadImageToStorage(
  supabase: any,
  base64Image: string,
  partnerId: string
): Promise<string> {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')
  const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

  const fileName = `cards/${partnerId}-${Date.now()}.png`

  const { error } = await supabase.storage
    .from('partner-photos')
    .upload(fileName, imageBuffer, {
      contentType: 'image/png',
      upsert: true
    })

  if (error) {
    console.error('Storage upload error:', error)
    throw new Error(`Storage upload error: ${error.message}`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from('partner-photos')
    .getPublicUrl(fileName)

  return publicUrl
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

function formatPartnerCaption(partner: PartnerData) {
  let message = ''
  
  // Секция "Об агентстве"
  if (partner.agency_description) {
    message += `<b>Об агентстве:</b>\n「 ${partner.agency_description} 」\n\n`
  }
  
  // Секция "О себе"
  if (partner.self_description) {
    message += `<b>О себе:</b>\n「 ${partner.self_description} 」\n\n`
  }
  
  // Контакты
  message += '<b>Контакты:</b>\n'
  
  if (partner.phone) {
    message += `📞 ${partner.phone}\n`
  }
  
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
    message += links.join(' ')
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

    // Генерируем визуальную карточку через AI
    console.log('Generating partner card image...')
    const cardImageBase64 = await generateCardImage(partnerData)
    
    let cardImageUrl: string | null = null
    if (cardImageBase64) {
      try {
        cardImageUrl = await uploadImageToStorage(supabase, cardImageBase64, partner_profile_id)
        console.log('Card uploaded to storage:', cardImageUrl)
      } catch (uploadError) {
        console.error('Failed to upload card:', uploadError)
      }
    }

    // Форматируем текстовый caption
    const caption = formatPartnerCaption(partnerData)

    let result: { result: { message_id: number } }

    // Публикуем на канале - с карточкой или фото
    const imageToSend = cardImageUrl || photoUrl
    
    if (imageToSend) {
      console.log('Publishing with image:', imageToSend)
      result = await sendPhotoToChannel(channelId, imageToSend, caption)
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
        card_url: cardImageUrl 
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
