
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getAccessToken(user_id: string, supabaseClient: any) {
    // 1. Get refresh token from DB
    const { data, error } = await supabaseClient
        .from('spotify_connections')
        .select('refresh_token')
        .eq('user_id', user_id)
        .single()

    if (error || !data) throw new Error('Spotify not connected')

    // 2. Refresh Token
    const client_id = Deno.env.get('SPOTIFY_CLIENT_ID')
    const client_secret = Deno.env.get('SPOTIFY_CLIENT_SECRET')

    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: data.refresh_token,
        client_id: client_id!,
        client_secret: client_secret!,
    })

    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
    })

    const tokens = await tokenRes.json()

    if (tokens.error) {
        // If refresh token is invalid, maybe delete connection?
        throw new Error(`Spotify Token Error: ${tokens.error_description}`)
    }

    // Optionally update refresh token if a new one is returned
    if (tokens.refresh_token) {
        await supabaseClient
            .from('spotify_connections')
            .update({ refresh_token: tokens.refresh_token, updated_at: new Date().toISOString() })
            .eq('user_id', user_id)
    }

    return tokens.access_token
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const { action, ...params } = await req.json()
        const accessToken = await getAccessToken(user.id, supabaseClient)

        if (action === 'search') {
            const q = encodeURIComponent(params.query)
            const type = 'track'
            const limit = params.limit || 20

            const res = await fetch(`https://api.spotify.com/v1/search?q=${q}&type=${type}&limit=${limit}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
            const data = await res.json()

            // Normalize
            const tracks = data.tracks.items.map((t: any) => ({
                id: t.id,
                name: t.name,
                artist: t.artists.map((a: any) => a.name).join(', '),
                album: t.album.name,
                image_url: t.album.images[0]?.url,
                preview_url: t.preview_url,
                uri: t.uri,
                duration_ms: t.duration_ms
            }))

            return new Response(JSON.stringify({ tracks }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (action === 'get_track') {
            const res = await fetch(`https://api.spotify.com/v1/tracks/${params.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
            const t = await res.json()

            const track = {
                id: t.id,
                name: t.name,
                artist: t.artists.map((a: any) => a.name).join(', '),
                album: t.album.name,
                image_url: t.album.images[0]?.url,
                preview_url: t.preview_url,
                uri: t.uri,
                duration_ms: t.duration_ms
            }

            return new Response(JSON.stringify({ track }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Helper to get access token for client-side player if needed (short lived)
        if (action === 'get_token') {
            return new Response(JSON.stringify({ access_token: accessToken }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        throw new Error('Invalid action')

    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
