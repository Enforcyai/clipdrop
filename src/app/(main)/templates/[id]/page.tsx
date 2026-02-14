'use client'

import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FUNNY_TEMPLATES } from '@/lib/templates'
import { ArrowLeft, Plus, Sparkles, Zap, Ghost } from 'lucide-react'

export default function TemplateDetailPage() {
    const params = useParams()
    const router = useRouter()

    const template = FUNNY_TEMPLATES.find(t => t.id === params.id)

    if (!template) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <Ghost className="h-12 w-12 text-gray-700 mb-4" />
                <h1 className="text-xl font-bold mb-2">Template not found</h1>
                <Button onClick={() => router.push('/templates')}>Go Back</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="flex items-center justify-between p-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="font-black italic uppercase tracking-tight text-white/90">Preview</h1>
                    <div className="w-10" />
                </div>
            </div>

            {/* Video preview */}
            <div className="relative aspect-[9/16] max-h-[70vh] w-full bg-gray-900 border-b border-white/10">
                <video
                    src={template.videoUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                />

                {/* Composition hint overlay */}
                <div className="absolute inset-x-0 bottom-0 p-8 pt-20 bg-gradient-to-t from-black via-black/40 to-transparent">
                    <div className="flex items-center gap-4 animate-bounce">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full border-2 border-dashed border-purple-500 flex items-center justify-center">
                                <Plus className="h-6 w-6 text-purple-400" />
                            </div>
                        </div>
                        <p className="text-sm font-black italic uppercase tracking-wider text-purple-400">
                            Your video goes here!
                        </p>
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="p-6 space-y-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="bg-purple-600/20 text-purple-400 text-[10px] font-black uppercase px-2 py-1 rounded-md border border-purple-500/30">
                            {template.category}
                        </span>
                        {template.tags.map(tag => (
                            <span key={tag} className="text-gray-500 text-[10px] font-bold uppercase">#{tag}</span>
                        ))}
                    </div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">{template.name}</h2>
                    <p className="text-gray-400 text-sm font-medium leading-relaxed">{template.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        <span className="text-xs font-bold text-gray-500 uppercase">Style</span>
                        <span className="text-sm font-bold">{template.compositionType === 'pip' ? 'Side-by-Side' : 'Full Overlap'}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        <span className="text-xs font-bold text-gray-500 uppercase">Difficulty</span>
                        <span className="text-sm font-bold">Very Easy</span>
                    </div>
                </div>

                {/* CTA */}
                <div className="space-y-4 pt-4 pb-12">
                    <Button
                        size="lg"
                        className="w-full h-16 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black italic uppercase tracking-widest text-lg shadow-[0_0_30px_rgba(168,85,247,0.3)] group transition-all"
                        onClick={() => router.push(`/create?templateId=${template.id}`)}
                    >
                        <Plus className="h-6 w-6 mr-3 group-hover:rotate-90 transition-transform" />
                        Add Yourself
                    </Button>
                    <p className="text-center text-[10px] font-bold uppercase text-gray-600 tracking-widest">
                        Join the viral wave in seconds
                    </p>
                </div>
            </div>
        </div>
    )
}
