import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')

interface PartnerData {
  name: string
  profession?: string | null
  city?: string | null
  age?: number | null
  agency_name?: string | null
  agency_description?: string | null
  office_address?: string | null
  photo_url?: string | null
  categories?: string[]
}

async function generateCardImage(partner: PartnerData, templateUrl: string): Promise<string> {
  // Формируем текстовое описание для генерации карточки
  const locationAge = [partner.city, partner.age ? `${partner.age} лет` : null]
    .filter(Boolean)
    .join('. ')

  const prompt = `Create a professional business card image based on this template background. 
The card should have:
- Left side: A circular photo placeholder with grey avatar icon (centered vertically)
- Below the photo: Name "${partner.name}" in large white bold text
- Below name: "${locationAge}" in smaller white text
- Right side (on the silver/metallic area):
  ${partner.agency_name ? `- "Агентство:" label followed by "${partner.agency_name}" in teal text` : ''}
  ${partner.profession ? `- "Профессия:" label followed by "${partner.profession}" in teal text` : ''}
  ${partner.office_address ? `- "Офис:" label followed by "${partner.office_address}" in teal text` : ''}

Style: Modern, professional, clean typography. White text on dark teal background, teal text on silver area.
Keep the elegant wave design from the template.
Text should be clearly readable.
DO NOT add any extra elements or text not specified above.`

  console.log('Generating card with prompt:', prompt)

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
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: templateUrl
              }
            }
          ]
        }
      ],
      modalities: ['image', 'text']
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('AI Gateway error:', error)
    throw new Error(`AI Gateway error: ${error}`)
  }

  const data = await response.json()
  console.log('AI Gateway response received')

  // Извлекаем base64 изображение из ответа
  const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url
  if (!imageUrl) {
    console.error('No image in response:', JSON.stringify(data))
    throw new Error('No image generated')
  }

  return imageUrl
}

async function uploadImageToStorage(
  supabase: any,
  base64Image: string,
  partnerId: string
): Promise<string> {
  // Извлекаем base64 данные (убираем prefix data:image/png;base64,)
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')
  const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

  const fileName = `cards/${partnerId}-${Date.now()}.png`

  const { data, error } = await supabase.storage
    .from('partner-photos')
    .upload(fileName, imageBuffer, {
      contentType: 'image/png',
      upsert: true
    })

  if (error) {
    console.error('Storage upload error:', error)
    throw new Error(`Storage upload error: ${error.message}`)
  }

  // Получаем публичный URL
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
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured')
    }

    const { partner_profile_id } = await req.json()
    console.log('Generating card for partner:', partner_profile_id)

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

    // Формируем данные для генерации
    const categories = partner.partner_profile_categories?.map(
      (pc: { categories: { name: string } }) => pc.categories.name
    ) || []

    const photoUrl = partner.partner_applications?.[0]?.photo_url

    const partnerData: PartnerData = {
      name: partner.name,
      profession: partner.profession,
      city: partner.city,
      age: partner.age,
      agency_name: partner.agency_name,
      agency_description: partner.agency_description,
      office_address: partner.office_address,
      photo_url: photoUrl,
      categories
    }

    // URL шаблона из публичного хранилища или статический
    // Используем прямой URL к шаблону в репозитории
    const templateUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/partner-photos/template/partner-card-template.png`

    console.log('Using template URL:', templateUrl)

    // Генерируем изображение карточки
    const generatedImageBase64 = await generateCardImage(partnerData, templateUrl)

    // Загружаем в storage
    const cardImageUrl = await uploadImageToStorage(supabase, generatedImageBase64, partner_profile_id)

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
