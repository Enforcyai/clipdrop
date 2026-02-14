export interface SpotifyTrack {
    id: string
    name: string
    artist: string
    album: string
    uri: string
    duration_ms: number
}

import { createClient } from '@/lib/supabase/client'

export interface SpotifyTrack {
    id: string
    name: string
    artist: string
    album: string
    preview_url: string | null
    image_url: string
    uri: string
    duration_ms: number
}

export class SpotifyService {
    private supabase = createClient()

    async startAuth() {
        const { data, error } = await this.supabase.functions.invoke('spotify-auth', {
            body: { action: 'start' }
        })
        if (error) throw error
        return data.url
    }

    async exchangeCode(code: string) {
        const { data, error } = await this.supabase.functions.invoke('spotify-auth', {
            body: { action: 'callback', code }
        })
        if (error) throw error
        return data
    }

    async search(query: string): Promise<SpotifyTrack[]> {
        if (!query || query.length < 2) return []

        const { data, error } = await this.supabase.functions.invoke('spotify-api', {
            body: { action: 'search', query }
        })

        if (error) {
            console.error('Spotify Search Error:', error)
            return []
        }

        return data.tracks || []
    }

    async getTrack(id: string): Promise<SpotifyTrack | null> {
        const { data, error } = await this.supabase.functions.invoke('spotify-api', {
            body: { action: 'get_track', id }
        })

        if (error) {
            console.error('Spotify GetTrack Error:', error)
            return null
        }

        return data.track || null
    }
}

export const spotify = new SpotifyService()
