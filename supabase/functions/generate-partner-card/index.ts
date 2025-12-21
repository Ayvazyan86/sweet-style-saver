import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PartnerData {
  name: string
  profession?: string | null
  city?: string | null
  age?: number | null
  agency_name?: string | null
  photo_url?: string | null
}

interface TemplateData {
  image_url: string
  text_x: number
  text_y: number
  text_color: string
  font_size: number
}

// Функция для загрузки изображения и конвертации в base64
async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)
  let binary = ''
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i])
  }
  return btoa(binary)
}

// Генерация SVG с текстом поверх шаблона
function generateCardSvg(
  templateBase64: string,
  partner: PartnerData,
  template: TemplateData,
  photoBase64?: string
): string {
  const width = 800
  const height = 450
  
  // Формируем текст для отображения
  const nameText = partner.name || 'Партнёр'
  const locationAge = [partner.city, partner.age ? `${partner.age} лет` : null]
    .filter(Boolean)
    .join(', ')
  
  // Позиция текста из шаблона
  const textX = template.text_x
  const textY = template.text_y
  const fontSize = template.font_size
  const textColor = template.text_color
  
  // Фото партнёра (круг слева)
  const photoSection = photoBase64 
    ? `
      <defs>
        <clipPath id="photoClip">
          <circle cx="120" cy="225" r="80" />
        </clipPath>
      </defs>
      <image 
        href="data:image/jpeg;base64,${photoBase64}" 
        x="40" y="145" 
        width="160" height="160" 
        clip-path="url(#photoClip)"
        preserveAspectRatio="xMidYMid slice"
      />
    `
    : `
      <circle cx="120" cy="225" r="80" fill="#374151" />
      <text x="120" y="235" text-anchor="middle" fill="#9CA3AF" font-size="40" font-family="Arial, sans-serif">👤</text>
    `
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <!-- Фоновое изображение шаблона -->
      <image href="data:image/png;base64,${templateBase64}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>
      
      ${photoSection}
      
      <!-- Имя партнёра -->
      <text 
        x="${textX}" 
        y="${textY}" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="${fontSize}" 
        font-weight="bold" 
        fill="${textColor}"
      >${escapeXml(nameText)}</text>
      
      <!-- Город и возраст -->
      ${locationAge ? `
        <text 
          x="${textX}" 
          y="${textY + fontSize + 10}" 
          font-family="Arial, Helvetica, sans-serif" 
          font-size="${Math.round(fontSize * 0.6)}" 
          fill="${textColor}"
          opacity="0.9"
        >${escapeXml(locationAge)}</text>
      ` : ''}
      
      <!-- Профессия или агентство -->
      ${partner.profession || partner.agency_name ? `
        <text 
          x="${textX}" 
          y="${textY + fontSize * 2 + 20}" 
          font-family="Arial, Helvetica, sans-serif" 
          font-size="${Math.round(fontSize * 0.5)}" 
          fill="${textColor}"
          opacity="0.8"
        >${escapeXml(partner.profession || partner.agency_name || '')}</text>
      ` : ''}
    </svg>
  `
  
  return svg
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Конвертация SVG в PNG через canvas (для Deno)
async function svgToPng(svg: string): Promise<Uint8Array> {
  // Используем resvg-wasm для рендеринга SVG в PNG
  const { Resvg } = await import('https://esm.sh/@aspect-ratio/resvg-wasm@0.1.0')
  
  try {
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: 800 }
    })
    const pngData = resvg.render()
    return pngData.asPng()
  } catch {
    // Fallback: возвращаем SVG как есть, закодированный в base64
    console.log('Using SVG fallback (resvg not available)')
    const encoder = new TextEncoder()
    return encoder.encode(svg)
  }
}

async function uploadImageToStorage(
  supabase: any,
  imageData: Uint8Array,
  partnerId: string,
  contentType: string = 'image/png'
): Promise<string> {
  const extension = contentType.includes('svg') ? 'svg' : 'png'
  const fileName = `cards/${partnerId}-${Date.now()}.${extension}`

  const { error } = await supabase.storage
    .from('partner-photos')
    .upload(fileName, imageData, {
      contentType,
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { partner_profile_id } = await req.json()
    console.log('Generating card for partner:', partner_profile_id)

    if (!partner_profile_id) {
      throw new Error('partner_profile_id is required')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Получаем данные партнёра с шаблоном
    const { data: partner, error: partnerError } = await supabase
      .from('partner_profiles')
      .select(`
        *,
        card_templates (
          image_url,
          text_x,
          text_y,
          text_color,
          font_size
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

    // Получаем шаблон (или дефолтный)
    let template = partner.card_templates
    
    if (!template) {
      // Получаем дефолтный шаблон
      const { data: defaultTemplate } = await supabase
        .from('card_templates')
        .select('image_url, text_x, text_y, text_color, font_size')
        .eq('is_default', true)
        .eq('is_active', true)
        .single()
      
      template = defaultTemplate
    }

    if (!template) {
      throw new Error('No card template found')
    }

    const photoUrl = partner.partner_applications?.[0]?.photo_url

    const partnerData: PartnerData = {
      name: partner.name,
      profession: partner.profession,
      city: partner.city,
      age: partner.age,
      agency_name: partner.agency_name,
      photo_url: photoUrl,
    }

    console.log('Partner data:', partnerData)
    console.log('Template:', template)

    // Загружаем изображение шаблона
    const templateBase64 = await fetchImageAsBase64(template.image_url)
    console.log('Template image loaded')

    // Загружаем фото партнёра если есть
    let photoBase64: string | undefined
    if (photoUrl) {
      try {
        photoBase64 = await fetchImageAsBase64(photoUrl)
        console.log('Partner photo loaded')
      } catch (err) {
        console.log('Could not load partner photo:', err)
      }
    }

    // Генерируем SVG карточки
    const svg = generateCardSvg(templateBase64, partnerData, template, photoBase64)
    console.log('SVG generated')

    // Пробуем конвертировать в PNG
    let imageData: Uint8Array
    let contentType = 'image/svg+xml'
    
    try {
      imageData = await svgToPng(svg)
      contentType = 'image/png'
      console.log('Converted to PNG')
    } catch {
      // Если не получилось - сохраняем как SVG
      const encoder = new TextEncoder()
      imageData = encoder.encode(svg)
      console.log('Saving as SVG')
    }

    // Загружаем в storage
    const cardImageUrl = await uploadImageToStorage(supabase, imageData, partner_profile_id, contentType)
    console.log('Card generated and uploaded:', cardImageUrl)

    return new Response(
      JSON.stringify({ 
        success: true, 
        card_url: cardImageUrl,
        partner_data: partnerData
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
