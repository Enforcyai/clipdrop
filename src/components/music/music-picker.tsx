import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Search, Music, Play, Pause, ExternalLink } from 'lucide-react'
import { useSpotifySearch } from '@/lib/hooks/use-spotify-search'
import { useSpotifyAuth } from '@/lib/hooks/use-spotify-auth'
import { SpotifyTrack } from '@/lib/spotify'
import { formatDuration } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface MusicPickerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (track: SpotifyTrack, config: MusicConfig) => void
    currentTrack?: SpotifyTrack | null
}

export interface MusicConfig {
    startMs: number
    volume: number
    mode: 'preview_overlay' | 'in_app_playback'
}

export function MusicPicker({ open, onOpenChange, onSelect, currentTrack }: MusicPickerProps) {
    const { isConnected } = useSpotifyAuth()
    const { query, setQuery, results, isLoading } = useSpotifySearch()
    const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(currentTrack || null)

    // Config State
    const [startMs, setStartMs] = useState(0)
    const [volume, setVolume] = useState(0.8)
    const [mode, setMode] = useState<'preview_overlay' | 'in_app_playback'>('preview_overlay')

    // Audio Preview
    const [isPlaying, setIsPlaying] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        if (!open) {
            stopPreview()
        }
    }, [open])

    const handlePlayPreview = (track: SpotifyTrack) => {
        if (selectedTrack?.id === track.id && isPlaying) {
            stopPreview()
            return
        }

        stopPreview()
        setSelectedTrack(track)

        if (track.preview_url) {
            audioRef.current = new Audio(track.preview_url)
            audioRef.current.volume = volume
            audioRef.current.play()
            setIsPlaying(true)
            audioRef.current.onended = () => setIsPlaying(false)
        }
    }

    const stopPreview = () => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current = null
        }
        setIsPlaying(false)
    }

    const handleSave = () => {
        if (!selectedTrack) return
        onSelect(selectedTrack, { startMs, volume, mode })
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-gray-900 border-gray-800 text-white max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b border-gray-800">
                    <DialogTitle className="flex items-center gap-2">
                        <Music className="w-5 h-5 text-purple-400" />
                        Select Music
                    </DialogTitle>
                </DialogHeader>

                <div className="p-4 flex-1 overflow-y-auto space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search songs, artists..."
                            className="pl-10 bg-gray-800 border-gray-700 focus:border-purple-500 rounded-xl"
                        />
                    </div>

                    {/* Results List */}
                    <div className="space-y-2 min-h-[200px]">
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-500">Searching...</div>
                        ) : results.length > 0 ? (
                            results.map(track => (
                                <div
                                    key={track.id}
                                    onClick={() => handlePlayPreview(track)}
                                    className={cn(
                                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-800/50",
                                        selectedTrack?.id === track.id ? "bg-gray-800 border border-purple-500/30" : ""
                                    )}
                                >
                                    <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                        <img src={track.image_url} alt={track.name} className="w-full h-full object-cover" />
                                        {selectedTrack?.id === track.id && isPlaying && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="w-1 bar-anim h-3 bg-green-400 mx-[1px] animate-bounce" />
                                                <div className="w-1 bar-anim h-4 bg-green-400 mx-[1px] animate-bounce delay-75" />
                                                <div className="w-1 bar-anim h-2 bg-green-400 mx-[1px] animate-bounce delay-150" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={cn("text-sm font-medium truncate", selectedTrack?.id === track.id ? "text-purple-400" : "text-white")}>
                                            {track.name}
                                        </h4>
                                        <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                                    </div>
                                    {!track.preview_url && (
                                        <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">No Preview</span>
                                    )}
                                </div>
                            ))
                        ) : query ? (
                            <div className="text-center py-8 text-gray-500">No results found</div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-2">
                                <Music className="w-8 h-8 opacity-20" />
                                <p>Search for your favorite tracks</p>
                            </div>
                        )}
                    </div>

                    {/* Configuration Panel (only if track selected) */}
                    {selectedTrack && (
                        <div className="pt-4 border-t border-gray-800 space-y-4 animate-in slide-in-from-bottom-5">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-300">Playback Mode</h4>
                                <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-lg">
                                    <button
                                        onClick={() => setMode('preview_overlay')}
                                        className={cn(
                                            "px-3 py-1 text-xs rounded-md transition-all",
                                            mode === 'preview_overlay' ? "bg-purple-600 text-white shadow" : "text-gray-400 hover:text-white"
                                        )}
                                    >
                                        Preview
                                    </button>
                                    <button
                                        onClick={() => setMode('in_app_playback')}
                                        disabled={!isConnected}
                                        className={cn(
                                            "px-3 py-1 text-xs rounded-md transition-all flex items-center gap-1",
                                            mode === 'in_app_playback' ? "bg-green-600 text-white shadow" : "text-gray-400 hover:text-white",
                                            !isConnected && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        Full Playback
                                        {!isConnected && <span className="sr-only">(Connect Spotify first)</span>}
                                    </button>
                                </div>
                            </div>

                            {mode === 'preview_overlay' && selectedTrack.preview_url ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>Preview Volume</span>
                                        <span>{Math.round(volume * 100)}%</span>
                                    </div>
                                    <Slider
                                        value={[volume]}
                                        max={1}
                                        step={0.1}
                                        onValueChange={([v]: number[]) => {
                                            setVolume(v)
                                            if (audioRef.current) audioRef.current.volume = v
                                        }}
                                        className="py-2"
                                    />
                                </div>
                            ) : mode === 'in_app_playback' ? (
                                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-300">
                                    This mode will open Spotify to play the full track when users view your post.
                                </div>
                            ) : (
                                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-300">
                                    Preview not available for this track. Use "Full Playback" mode instead.
                                </div>
                            )}

                            {/* Start Offset - Simplified for MVP (just 0 for now unless we implement waveform) */}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-800 bg-gray-900/95 backdrop-blur z-10">
                    <Button
                        onClick={handleSave}
                        disabled={!selectedTrack}
                        className="w-full bg-purple-600 hover:bg-purple-500 font-bold"
                    >
                        Use Track
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
