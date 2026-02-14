'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FUNNY_TEMPLATES } from '@/lib/templates'
import { Search, Sparkles, Play, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const CATEGORIES = ['All', 'Funny', 'Reaction', 'Viral', 'Meme']

export default function TemplatesPage() {
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('All')

    const filtered = FUNNY_TEMPLATES.filter((t) => {
        const matchesCategory = activeCategory === 'All' || t.category === activeCategory
        const matchesSearch =
            search === '' ||
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
        return matchesCategory && matchesSearch
    })

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-black italic tracking-tighter uppercase text-white">
                            Funny <span className="text-purple-500">Templates</span>
                        </h1>
                        <Sparkles className="h-6 w-6 text-purple-400 animate-pulse" />
                    </div>

                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Find something funny..."
                            className="pl-12 bg-white/5 border-white/10 h-12 rounded-2xl focus:ring-purple-500/50"
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="flex gap-3 px-6 pb-4 overflow-x-auto no-scrollbar">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-6 py-2 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 border",
                                activeCategory === cat
                                    ? "bg-purple-600 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="p-4 sm:p-6 pb-24">
                <div className="grid grid-cols-2 gap-4">
                    {filtered.map((template) => (
                        <Link
                            key={template.id}
                            href={`/templates/${template.id}`}
                            className="group relative aspect-[9/16] rounded-3xl overflow-hidden bg-gray-900 border border-white/5 hover:border-purple-500/50 transition-all active:scale-[0.98]"
                        >
                            {/* Preview Image */}
                            <img
                                src={template.previewUrl}
                                alt={template.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />

                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60" />

                            {/* Info */}
                            <div className="absolute inset-x-0 bottom-0 p-4 space-y-2">
                                <h3 className="font-bold text-sm leading-tight line-clamp-2">{template.name}</h3>

                                <div className="flex items-center gap-2">
                                    <div className="bg-purple-600 rounded-full p-1.5 shadow-lg shadow-purple-900/40">
                                        <Plus className="h-4 w-4 text-white" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Add Yourself</span>
                                </div>
                            </div>

                            {/* Play Indicator */}
                            <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="h-4 w-4 text-white fill-white" />
                            </div>
                        </Link>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="bg-white/5 rounded-full p-6 mb-4">
                            <Sparkles className="h-10 w-10 text-gray-700" />
                        </div>
                        <p className="text-gray-400 font-medium">Nothing funny here... yet.</p>
                        <button
                            onClick={() => { setSearch(''); setActiveCategory('All') }}
                            className="text-purple-400 text-sm mt-2 hover:underline"
                        >
                            Show all templates
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
