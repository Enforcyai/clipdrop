'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Template, VideoStyle, AspectRatio, Intensity, GenerationMode } from '@/types/database'
import {
    ArrowLeft,
    Sparkles,
    Type,
    ImageIcon,
    Film,
    Upload,
    Zap,
    AlertTriangle,
} from 'lucide-react'

const DURATIONS = [
    { value: 5, label: '5s' },
    { value: 8, label: '8s' },
    { value: 10, label: '10s' },
    { value: 15, label: '15s' },
]

const STYLES: { value: VideoStyle; label: string; emoji: string }[] = [
    { value: 'Realistic', label: 'Realistic', emoji: '📸' },
    { value: 'Cartoon', label: 'Cartoon', emoji: '🎨' },
    { value: 'Anime', label: 'Anime', emoji: '⛩️' },
    { value: 'Neon', label: 'Neon', emoji: '💜' },
    { value: 'Vintage', label: 'Vintage', emoji: '📼' },
]

const RATIOS: { value: AspectRatio; label: string }[] = [
    { value: '9:16', label: '9:16 Portrait' },
    { value: '1:1', label: '1:1 Square' },
    { value: '16:9', label: '16:9 Landscape' },
]

const INTENSITIES: { value: Intensity; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
]

const PROMPT_HELPERS = [
    'A dancer performing hip hop moves in a neon-lit street',
    'A person doing a smooth transition between two outfits',
    'An anime character doing a dramatic power pose',
    'A retro 80s dance scene with disco lights',
    'A cyberpunk character walking through rain',
    'A funny cat-like dance celebration',
]

function AICreateContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [mode, setMode] = useState<Exclude<GenerationMode, 'recorded'>>('text2video')
    const [prompt, setPrompt] = useState(searchParams.get('prompt') || '')
    const [duration, setDuration] = useState(10)
    const [style, setStyle] = useState<VideoStyle>('Realistic')
    const [ratio, setRatio] = useState<AspectRatio>('9:16')
    const [intensity, setIntensity] = useState<Intensity>('medium')
    const [template, setTemplate] = useState<Template | null>(null)

    const [generating, setGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Load template if templateId is in URL
    useEffect(() => {
        const templateId = searchParams.get('templateId')
        if (templateId) {
            const supabase = createClient()
            supabase
                .from('templates')
                .select('*')
                .eq('id', templateId)
                .single()
                .then(({ data }) => {
                    if (data) {
                        setTemplate(data)
                        const settings = data.default_settings as Record<string, unknown>
                        if (settings.duration) setDuration(settings.duration as number)
                        if (settings.style) setStyle(settings.style as VideoStyle)
                        if (settings.intensity) setIntensity(settings.intensity as Intensity)
                    }
                })
        }
    }, [searchParams])



    const canGenerate = prompt.trim().length > 0

    const handleGenerate = async () => {
        if (!canGenerate) return
        setGenerating(true)
        setError(null)

        try {
            const res = await fetch('/api/generation/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode,
                    prompt: prompt.trim(),
                    duration,
                    style,
                    aspectRatio: ratio,
                    intensity,
                    templateId: template?.id,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to start generation')
                setGenerating(false)
                return
            }

            // Navigate to progress screen
            router.push(`/create/ai/generate/${data.generationId}`)
        } catch {
            setError('Network error. Please try again.')
            setGenerating(false)
        }
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-gray-800">
                <div className="flex items-center justify-between p-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="font-semibold">AI Generate</h1>
                    <span className="text-sm text-green-400 font-medium">✨ Free</span>
                </div>
            </div>

            <div className="p-4 pb-32 space-y-5 max-w-lg mx-auto">
                {/* Error */}
                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        {error}
                    </div>
                )}

                {/* Template badge */}
                {template && (
                    <div className="flex items-center gap-2 p-2 bg-purple-600/10 border border-purple-600/20 rounded-lg">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        <span className="text-sm text-purple-300">
                            Using template: <strong>{template.name}</strong>
                        </span>
                        <button
                            onClick={() => setTemplate(null)}
                            className="ml-auto text-xs text-gray-500 hover:text-gray-300"
                        >
                            Remove
                        </button>
                    </div>
                )}

                {/* Mode */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Mode</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { value: 'text2video' as const, icon: Type, label: 'Text → Video' },
                            { value: 'image2video' as const, icon: ImageIcon, label: 'Image → Video' },
                            { value: 'video2video' as const, icon: Film, label: 'Video → Video' },
                        ].map((m) => (
                            <button
                                key={m.value}
                                onClick={() => setMode(m.value)}
                                className={`p-3 rounded-lg border text-center transition-colors ${mode === m.value
                                    ? 'border-purple-500 bg-purple-600/10 text-white'
                                    : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-700'
                                    }`}
                            >
                                <m.icon className="h-5 w-5 mx-auto mb-1" />
                                <span className="text-xs">{m.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Upload for image2video / video2video */}
                {(mode === 'image2video' || mode === 'video2video') && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                                <Upload className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                                <p className="text-sm text-gray-400">
                                    {mode === 'image2video' ? 'Upload an image' : 'Upload a video clip'}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Feature available when connected to Supabase Storage
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Prompt */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Prompt</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the video you want to create..."
                        rows={3}
                        maxLength={1000}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                    />
                    <p className="text-xs text-gray-600 text-right">{prompt.length}/1000</p>
                </div>

                {/* Prompt helpers */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500">💡 Prompt Ideas</label>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {(template?.prompt_suggestions || PROMPT_HELPERS).map((hint, i) => (
                            <button
                                key={i}
                                onClick={() => setPrompt(hint)}
                                className="shrink-0 text-xs bg-gray-800 text-gray-400 px-3 py-1.5 rounded-full hover:bg-gray-700 hover:text-gray-300 transition-colors max-w-[200px] truncate"
                            >
                                {hint}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Duration</label>
                    <div className="flex gap-2">
                        {DURATIONS.map((d) => (
                            <button
                                key={d.value}
                                onClick={() => setDuration(d.value)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${duration === d.value
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Style */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Style</label>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {STYLES.map((s) => (
                            <button
                                key={s.value}
                                onClick={() => setStyle(s.value)}
                                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${style === s.value
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {s.emoji} {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Aspect Ratio</label>
                    <div className="flex gap-2">
                        {RATIOS.map((r) => (
                            <button
                                key={r.value}
                                onClick={() => setRatio(r.value)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${ratio === r.value
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Intensity */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Intensity</label>
                    <div className="flex gap-2">
                        {INTENSITIES.map((int) => (
                            <button
                                key={int.value}
                                onClick={() => setIntensity(int.value)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${intensity === int.value
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {int.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Generate CTA - fixed bottom */}
            <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent">
                <div className="max-w-lg mx-auto">
                    <Button
                        variant="primary"
                        size="xl"
                        className="w-full"
                        disabled={!canGenerate || generating}
                        onClick={handleGenerate}
                    >
                        {generating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Starting...
                            </>
                        ) : (
                            <>
                                <Zap className="h-5 w-5" />
                                Generate — Free
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default function AICreatePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <AICreateContent />
        </Suspense>
    )
}
