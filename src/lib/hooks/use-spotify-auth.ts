import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { spotify } from '@/lib/spotify'
import { useRouter } from 'next/navigation'

export function useSpotifyAuth() {
    const [isConnected, setIsConnected] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [spotifyUser, setSpotifyUser] = useState<string | null>(null)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        checkConnection()
    }, [])

    const checkConnection = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setIsLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('spotify_connections')
                .select('spotify_user_id')
                .eq('user_id', user.id)
                .single()

            if (data) {
                setIsConnected(true)
                setSpotifyUser(data.spotify_user_id)
            } else {
                setIsConnected(false)
                setSpotifyUser(null)
            }
        } catch (error) {
            console.error('Error checking Spotify connection:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const connect = async () => {
        try {
            const url = await spotify.startAuth()
            // Save current path to return to after auth? 
            // For now, redirect to Spotify. 
            // The callback page should handle the exchange and then redirect back to app.
            // We can pass a 'next' param if we want, but let's keep it simple for now.
            window.location.href = url
        } catch (error) {
            console.error('Error starting Spotify auth:', error)
        }
    }

    const disconnect = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('spotify_connections')
                .delete()
                .eq('user_id', user.id)

            if (!error) {
                setIsConnected(false)
                setSpotifyUser(null)
            }
        } catch (error) {
            console.error('Error disconnecting Spotify:', error)
        }
    }

    return {
        isConnected,
        isLoading,
        spotifyUser,
        connect,
        disconnect,
        refresh: checkConnection
    }
}
