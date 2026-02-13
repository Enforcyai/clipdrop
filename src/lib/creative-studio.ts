export interface AudioAsset {
    id: string
    name: string
    artist: string
    url: string
    category: string
}

export interface OverlayAsset {
    id: string
    name: string
    className: string
    previewColor: string
}

export interface TextStyleAsset {
    id: string
    name: string
    className: string
}

export const AUDIOS: AudioAsset[] = [
    { id: 'none', name: 'Original', artist: 'Camera Audio', url: '', category: 'None' },
    { id: 'pop-1', name: 'Neon Dreams', artist: 'HyperPop', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', category: 'Pop' },
    { id: 'cinematic-1', name: 'Epic Journey', artist: 'CinemaScore', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', category: 'Cinematic' },
    { id: 'chill-1', name: 'Lo-fi Sunset', artist: 'StudyBeats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', category: 'Chill' },
    { id: 'trap-1', name: 'Street Vibes', artist: 'Metro808', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', category: 'Trap' },
]

export const OVERLAYS: OverlayAsset[] = [
    { id: 'none', name: 'None', className: '', previewColor: 'bg-gray-800' },
    { id: 'vhs', name: 'VHS Retro', className: 'overlay-vhs', previewColor: 'bg-indigo-900' },
    { id: 'grain', name: 'Film Grain', className: 'overlay-grain', previewColor: 'bg-amber-900' },
    { id: 'leak', name: 'Light Leak', className: 'overlay-leak', previewColor: 'bg-orange-800' },
    { id: 'glitch', name: 'Cyber Glitch', className: 'overlay-glitch', previewColor: 'bg-purple-900' },
]

export const TEXT_STYLES: TextStyleAsset[] = [
    { id: 'modern', name: 'Modern', className: 'font-sans font-bold italic text-white drop-shadow-lg' },
    { id: 'neon', name: 'Neon Glow', className: 'font-mono text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]' },
    { id: 'retro', name: 'Retro Block', className: 'font-serif text-yellow-400 uppercase tracking-tighter' },
    { id: 'minimal', name: 'Minimal', className: 'font-light text-white/80 tracking-widest' },
]
