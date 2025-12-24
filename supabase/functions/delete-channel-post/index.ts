import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')

interface DeleteRequest {
  channel_id: string
  message_id: number
}

async function deleteMessage(chatId: string | number, messageId: number) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
    }),
  })

  const result = await response.json()
  console.log('Delete message result:', JSON.stringify(result))
  
  if (!result.ok) {
    throw new Error(`Telegram API error: ${result.description}`)
  }

  return result
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured')
    }

    const { channel_id, message_id }: DeleteRequest = await req.json()
    console.log('Deleting message:', message_id, 'from channel:', channel_id)

    if (!channel_id || !message_id) {
      throw new Error('channel_id and message_id are required')
    }

    await deleteMessage(channel_id, message_id)

    return new Response(
      JSON.stringify({ success: true, message: 'Post deleted from channel' }),
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
