
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Authenticate User
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        const { action, code, redirect_uri } = await req.json()

        if (action === 'start') {
            const client_id = Deno.env.get('SPOTIFY_CLIENT_ID')
            const configured_redirect_uri = Deno.env.get('SPOTIFY_REDIRECT_URI')
            const state = crypto.randomUUID()
            const scope = 'user-read-private user-read-email streaming user-read-playback-state user-modify-playback-state'

            // Allow client to pass redirect_uri if needed, or use env default
            const final_redirect_uri = redirect_uri || configured_redirect_uri

            const params = new URLSearchParams({
                response_type: 'code',
                client_id: client_id!,
                scope: scope,
                redirect_uri: final_redirect_uri!,
                state: state,
            })

            const url = `https://accounts.spotify.com/authorize?${params.toString()}`

            return new Response(JSON.stringify({ url }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        if (action === 'callback') {
            if (!code) throw new Error('Missing code')

            const client_id = Deno.env.get('SPOTIFY_CLIENT_ID')
            const client_secret = Deno.env.get('SPOTIFY_CLIENT_SECRET')
            const configured_redirect_uri = Deno.env.get('SPOTIFY_REDIRECT_URI')
            const final_redirect_uri = redirect_uri || configured_redirect_uri

            const body = new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: final_redirect_uri!,
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
                throw new Error(`Spotify Error: ${tokens.error_description || tokens.error}`)
            }

            // Get Spotify User Profile
            const userRes = await fetch('https://api.spotify.com/v1/me', {
                headers: { Authorization: `Bearer ${tokens.access_token}` }
            })
            const spotifyUser = await userRes.json()

            // Store in DB
            const { error: dbError } = await supabaseClient
                .from('spotify_connections')
                .upsert({
                    user_id: user.id,
                    spotify_user_id: spotifyUser.id,
                    refresh_token: tokens.refresh_token,
                    scopes: tokens.scope ? tokens.scope.split(' ') : [],
                    updated_at: new Date().toISOString()
                })

            if (dbError) throw dbError

            return new Response(JSON.stringify({ success: true, spotify_user: spotifyUser }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        throw new Error('Invalid action')

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
