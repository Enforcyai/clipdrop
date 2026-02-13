'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Template } from '@/types/database'
import { ArrowLeft, Sparkles, Star, Clock, Zap } from 'lucide-react'

export default function TemplateDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [template, setTemplate] = useState<Template | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchTemplate() {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('templates')
                .select('*')
                .eq('id', params.id as string)
                .single()

            if (error || !data) {
                router.push('/templates')
                return
            }

            setTemplate(data)
            setLoading(false)
        }
        fetchTemplate()
    }, [params.id, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!template) return null

    const settings = template.default_settings as Record<string, unknown>

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-gray-800">
                <div className="flex items-center justify-between p-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="font-semibold">Template</h1>
                    <div className="w-10" />
                </div>
            </div>

            {/* Preview */}
            <div className="aspect-[9/16] max-h-[50vh] bg-gradient-to-br from-gray-800 to-gray-900 relative">
                {template.preview_url ? (
                    <img
                        src={template.preview_url}
                        alt={template.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="h-16 w-16 text-gray-600" />
                    </div>
                )}
                {template.is_featured && (
                    <div className="absolute top-4 left-4 flex items-center gap-1 bg-yellow-500/90 text-black text-sm font-bold px-3 py-1 rounded-full">
                        <Star className="h-4 w-4 fill-current" />
                        Featured
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4 space-y-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">{template.name}</h2>
                    <p className="text-gray-400 mt-1">{template.description}</p>
                </div>

                {/* Meta */}
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                        <Clock className="h-4 w-4" />
                        {(settings?.duration as number) || 10}s
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                        <Zap className="h-4 w-4" />
                        {(settings?.intensity as string) || 'medium'}
                    </div>
                    <div className="bg-gray-800 text-gray-300 text-sm px-3 py-0.5 rounded-full">
                        {template.category}
                    </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                    {template.tags.map((tag) => (
                        <span
                            key={tag}
                            className="text-sm bg-gray-800 text-purple-400 px-3 py-1 rounded-full"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>

                {/* Prompt suggestions */}
                {template.prompt_suggestions && template.prompt_suggestions.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-300">Suggested Prompts</h3>
                        <div className="space-y-2">
                            {template.prompt_suggestions.map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        router.push(
                                            `/create/ai?templateId=${template.id}&prompt=${encodeURIComponent(prompt)}`
                                        )
                                    }}
                                    className="w-full text-left p-3 rounded-lg bg-gray-900/50 border border-gray-800 hover:border-purple-600/50 transition-colors"
                                >
                                    <p className="text-sm text-gray-300">"{prompt}"</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* CTA */}
                <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={() => router.push(`/create/ai?templateId=${template.id}`)}
                >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Use This Template
                </Button>
            </div>
        </div>
    )
}
