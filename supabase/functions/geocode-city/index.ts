const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const YANDEX_API_KEY = Deno.env.get('YANDEX_GEOCODER_API_KEY')

interface GeocodeResponse {
  response: {
    GeoObjectCollection: {
      featureMember: Array<{
        GeoObject: {
          metaDataProperty: {
            GeocoderMetaData: {
              kind: string
              text: string
              Address: {
                formatted: string
                Components: Array<{
                  kind: string
                  name: string
                }>
              }
            }
          }
          Point: {
            pos: string
          }
          name: string
          description?: string
        }
      }>
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!YANDEX_API_KEY) {
      throw new Error('YANDEX_GEOCODER_API_KEY is not configured')
    }

    const { city } = await req.json()
    
    if (!city || typeof city !== 'string') {
      return new Response(
        JSON.stringify({ error: 'City is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Geocoding city:', city)

    // Call Yandex Geocoder API
    const url = new URL('https://geocode-maps.yandex.ru/1.x/')
    url.searchParams.set('apikey', YANDEX_API_KEY)
    url.searchParams.set('geocode', city)
    url.searchParams.set('format', 'json')
    url.searchParams.set('lang', 'ru_RU')
    url.searchParams.set('results', '5')

    const response = await fetch(url.toString())
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Yandex Geocoder API error:', errorText)
      throw new Error(`Yandex API error: ${response.status}`)
    }

    const data: GeocodeResponse = await response.json()
    const features = data.response.GeoObjectCollection.featureMember

    if (features.length === 0) {
      return new Response(
        JSON.stringify({ 
          found: false, 
          suggestions: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filter to only cities/towns/localities
    const cityKinds = ['locality', 'province', 'area']
    const citySuggestions = features
      .filter(f => {
        const kind = f.GeoObject.metaDataProperty.GeocoderMetaData.kind
        return cityKinds.includes(kind)
      })
      .map(f => {
        const geo = f.GeoObject
        const meta = geo.metaDataProperty.GeocoderMetaData
        const components = meta.Address.Components
        
        // Extract city and region
        const cityName = components.find(c => c.kind === 'locality')?.name || geo.name
        const region = components.find(c => c.kind === 'province')?.name
        const country = components.find(c => c.kind === 'country')?.name
        
        const [lon, lat] = geo.Point.pos.split(' ').map(Number)
        
        return {
          name: cityName,
          fullName: meta.Address.formatted,
          region,
          country,
          coordinates: { lat, lon },
          kind: meta.kind
        }
      })

    // If exact match found
    const exactMatch = citySuggestions.find(s => 
      s.name.toLowerCase() === city.toLowerCase()
    )

    console.log('Found suggestions:', citySuggestions.length, 'exact match:', !!exactMatch)

    return new Response(
      JSON.stringify({
        found: citySuggestions.length > 0,
        exactMatch: exactMatch || null,
        suggestions: citySuggestions.slice(0, 5)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Geocode error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})