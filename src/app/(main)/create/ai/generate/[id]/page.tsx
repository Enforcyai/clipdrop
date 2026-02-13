'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sparkles, AlertTriangle, RotateCcw } from 'lucide-react'

type GenerationStatus = 'pending' | 'processing' | 'succeeded' | 'failed'

const FUN_MESSAGES = [
    'Teaching AI to dance... 💃',
    'Mixing pixels and vibes... 🎨',
    'Adding extra sparkle... ✨',
    'Rendering your masterpiece... 🎬',
    'Making magic happen... 🪄',
    'Almost there, stay tuned... 🎵',
    'Polishing the final frames... 🖼️',
    'Your video is coming to life... 🌟',
]

export default function GenerateProgressPage() {
    const params = useParams()
    const router = useRouter()
    const [status, setStatus] = useState<GenerationStatus>('pending')
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [funMessage, setFunMessage] = useState(FUN_MESSAGES[0])
    const pollCountRef = useRef(0)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    // Rotate fun messages
    useEffect(() => {
        const msgInterval = setInterval(() => {
            setFunMessage(FUN_MESSAGES[Math.floor(Math.random() * FUN_MESSAGES.length)])
        }, 3000)
        return () => clearInterval(msgInterval)
    }, [])

    // Poll with exponential backoff
    useEffect(() => {
        const generationId = params.id as string

        const poll = async () => {
            try {
                const res = await fetch(`/api/generation/poll?id=${generationId}`)
                const data = await res.json()

                if (!res.ok) {
                    setError(data.error || 'Failed to check status')
                    return
                }

                setStatus(data.status)
                setProgress(data.progress || 0)

                if (data.status === 'succeeded') {
                    if (intervalRef.current) clearInterval(intervalRef.current)
                    // Navigate to result
                    router.replace(`/create/result/${generationId}`)
                    return
                }

                if (data.status === 'failed') {
                    if (intervalRef.current) clearInterval(intervalRef.current)
                    setError(data.errorMessage || 'Generation failed. Please try again.')
                    return
                }
            } catch {
                // Network error, will retry on next poll
            }

            pollCountRef.current += 1
        }

        // Start polling - exponential backoff: 2s, 3s, 4s, 5s (cap at 5s)
        const getInterval = () => {
            const base = 2000
            const backoff = Math.min(base + pollCountRef.current * 1000, 5000)
            return backoff
        }

        // Initial poll
        poll()

        // Set up interval
        intervalRef.current = setInterval(() => {
            poll()
        }, getInterval())

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [params.id, router])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
            {error ? (
                /* Error state */
                <div className="text-center space-y-4 animate-fade-in">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                        <AlertTriangle className="h-10 w-10 text-red-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Generation Failed</h2>
                    <p className="text-gray-400 max-w-xs">{error}</p>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => router.push('/create/ai')}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                        <Button variant="ghost" onClick={() => router.push('/create')}>
                            Back
                        </Button>
                    </div>
                </div>
            ) : (
                /* Progress state */
                <div className="text-center space-y-8 animate-fade-in">
                    {/* Animated loader */}
                    <div className="relative w-32 h-32 mx-auto">
                        {/* Outer ring */}
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                            <circle
                                cx="60"
                                cy="60"
                                r="54"
                                fill="none"
                                stroke="#1f2937"
                                strokeWidth="6"
                            />
                            <circle
                                cx="60"
                                cy="60"
                                r="54"
                                fill="none"
                                stroke="url(#gradient)"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={`${339.292 * (progress / 100)} 339.292`}
                                className="transition-all duration-500"
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#a855f7" />
                                    <stop offset="100%" stopColor="#ec4899" />
                                </linearGradient>
                            </defs>
                        </svg>
                        {/* Center icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="h-10 w-10 text-purple-400 animate-pulse" />
                        </div>
                    </div>

                    {/* Progress text */}
                    <div>
                        <p className="text-4xl font-bold gradient-text">{progress}%</p>
                        <p className="text-gray-400 mt-2">{funMessage}</p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        <span className="text-sm text-gray-500 capitalize">
                            {status === 'pending' ? 'Queued' : status === 'processing' ? 'Generating' : status}
                        </span>
                    </div>

                    <p className="text-xs text-gray-600">
                        This usually takes 10-20 seconds. Don&apos;t close this page.
                    </p>
                </div>
            )}
        </div>
    )
}
