import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface ModerationPayload {
  type: 'UPDATE'
  table: string
  old_record: {
    id: string
    status: string
  }
  record: {
    id: string
    user_id: string
    name: string
    status: string
    rejection_reason?: string
  }
}

function replaceVariables(template: string, data: Record<string, string>): string {
  let result = template
  
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }
  
  // Remove any remaining variables with _line suffix that weren't replaced
  result = result.replace(/\{[a-z_]+_line\}/g, '')
  
  // Clean up multiple empty lines
  result = result.replace(/\n{3,}/g, '\n\n')
  
  return result.trim()
}

async function sendTelegramMessage(chatId: string | number, text: string) {
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

async function publishPartnerToChannel(supabaseUrl: string, serviceRoleKey: string, partnerProfileId: string) {
  const url = `${supabaseUrl}/functions/v1/publish-partner-to-channel`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ partner_profile_id: partnerProfileId }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Error publishing to channel:', error)
    throw new Error(`Error publishing to channel: ${error}`)
  }

  return response.json()
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

    const payload: ModerationPayload = await req.json()
    console.log('Received payload:', JSON.stringify(payload))

    // Only process status changes
    if (payload.type !== 'UPDATE' || payload.table !== 'partner_applications') {
      return new Response(
        JSON.stringify({ message: 'Ignored: not an application update' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if status actually changed to approved or rejected
    const oldStatus = payload.old_record.status
    const newStatus = payload.record.status
    
    if (oldStatus === newStatus || (newStatus !== 'approved' && newStatus !== 'rejected')) {
      return new Response(
        JSON.stringify({ message: 'Ignored: status not changed to approved/rejected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get user's telegram_id from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('telegram_id')
      .eq('id', payload.record.user_id)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      throw profileError
    }

    if (!profile?.telegram_id) {
      console.log('No telegram_id found for user:', payload.record.user_id)
      return new Response(
        JSON.stringify({ message: 'User has no telegram_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get notification templates from database
    const templateKey = newStatus === 'approved' ? 'application_approved' : 'application_rejected'
    const { data: templateData } = await supabase
      .from('notification_templates')
      .select('template')
      .eq('key', templateKey)
      .single()

    let message: string
    
    if (newStatus === 'approved') {
      // При одобрении - создаём профиль партнёра и публикуем на канале
      const { data: application, error: appError } = await supabase
        .from('partner_applications')
        .select('*')
        .eq('id', payload.record.id)
        .single()

      if (appError) {
        console.error('Error fetching application:', appError)
        throw appError
      }

      // Проверяем, есть ли уже профиль партнёра
      const { data: existingProfile } = await supabase
        .from('partner_profiles')
        .select('id')
        .eq('application_id', payload.record.id)
        .maybeSingle()

      let partnerProfileId: string

      if (existingProfile) {
        partnerProfileId = existingProfile.id
      } else {
        // Создаём профиль партнёра
        const { data: newProfile, error: createError } = await supabase
          .from('partner_profiles')
          .insert({
            user_id: application.user_id,
            application_id: application.id,
            name: application.name,
            age: application.age,
            profession: application.profession,
            city: application.city,
            agency_name: application.agency_name,
            agency_description: application.agency_description,
            self_description: application.self_description,
            phone: application.phone,
            tg_channel: application.tg_channel,
            website: application.website,
            youtube: application.youtube,
            rutube: application.rutube,
            dzen: application.dzen,
            vk_video: application.vk_video,
            tg_video: application.tg_video,
            office_address: application.office_address,
            status: 'active',
            partner_type: 'free',
          })
          .select('id')
          .single()

        if (createError) {
          console.error('Error creating partner profile:', createError)
          throw createError
        }

        partnerProfileId = newProfile.id

        // Копируем категории из заявки в профиль
        const { data: appCategories } = await supabase
          .from('partner_application_categories')
          .select('category_id')
          .eq('application_id', application.id)

        if (appCategories && appCategories.length > 0) {
          const categoryInserts = appCategories.map(c => ({
            profile_id: partnerProfileId,
            category_id: c.category_id,
          }))

          await supabase
            .from('partner_profile_categories')
            .insert(categoryInserts)
        }
      }

      // Публикуем карточку на канале
      try {
        await publishPartnerToChannel(
          SUPABASE_URL,
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          partnerProfileId
        )
        console.log('Partner published to channel:', partnerProfileId)
      } catch (publishError) {
        console.error('Error publishing to channel:', publishError)
        // Продолжаем даже если публикация не удалась
      }

      // Use template from database or fallback
      if (templateData?.template) {
        const variables: Record<string, string> = {
          name: payload.record.name,
        }
        message = replaceVariables(templateData.template, variables)
      } else {
        message = `
✅ <b>Ваша заявка одобрена!</b>

Поздравляем, ${payload.record.name}! Ваша заявка на партнёрство успешно прошла модерацию.

Ваша карточка опубликована на канале. Теперь вы можете получать заказы и вопросы от клиентов.

Добро пожаловать в команду! 🎉
        `.trim()
      }
    } else {
      // Use template from database or fallback
      if (templateData?.template) {
        const variables: Record<string, string> = {
          name: payload.record.name,
          rejection_reason_line: payload.record.rejection_reason 
            ? `<b>Причина:</b> ${payload.record.rejection_reason}` 
            : '',
        }
        message = replaceVariables(templateData.template, variables)
      } else {
        message = `
❌ <b>Ваша заявка отклонена</b>

К сожалению, ${payload.record.name}, ваша заявка на партнёрство не прошла модерацию.

${payload.record.rejection_reason ? `<b>Причина:</b> ${payload.record.rejection_reason}` : ''}

Вы можете подать новую заявку, исправив указанные замечания.
        `.trim()
      }
    }

    await sendTelegramMessage(profile.telegram_id, message)
    console.log('User notification sent successfully to:', profile.telegram_id)

    return new Response(
      JSON.stringify({ success: true, message: 'User notification sent' }),
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