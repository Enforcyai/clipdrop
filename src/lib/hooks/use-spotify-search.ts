import { useState, useEffect } from 'react'
import { spotify, SpotifyTrack } from '@/lib/spotify'

export function useSpotifySearch(initialQuery: string = '') {
    const [query, setQuery] = useState(initialQuery)
    const [results, setResults] = useState<SpotifyTrack[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length < 2) {
                setResults([])
                return
            }

            setIsLoading(true)
            setError(null)

            try {
                const tracks = await spotify.search(query)
                setResults(tracks)
            } catch (err: any) {
                console.error('Spotify Search Error:', err)
                setError(err.message || 'Failed to search tracks')
                setResults([])
            } finally {
                setIsLoading(false)
            }
        }, 500) // 500ms debounce

        return () => clearTimeout(timer)
    }, [query])

    return {
        query,
        setQuery,
        results,
        isLoading,
        error
    }
}
