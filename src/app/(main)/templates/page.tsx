'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Template } from '@/types/database'
import { Search, Sparkles, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'

const CATEGORIES = ['All', 'Dance', 'Transitions', 'Anime', 'Cyber', 'Funny', 'Retro']

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('All')

    useEffect(() => {
        async function fetchTemplates() {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('templates')
                .select('*')
                .order('is_featured', { ascending: false })
                .order('created_at', { ascending: false })

            if (!error && data) {
                setTemplates(data)
            }
            setLoading(false)
        }
        fetchTemplates()
    }, [])

    const filtered = templates.filter((t) => {
        const matchesCategory = activeCategory === 'All' || t.category === activeCategory
        const matchesSearch =
            search === '' ||
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
        return matchesCategory && matchesSearch
    })

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-gray-800">
                <div className="p-4">
                    <h1 className="text-xl font-bold gradient-text text-center mb-4">Templates</h1>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search templates..."
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Category filter */}
                <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {loading ? (
                    <div className="grid grid-cols-2 gap-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="aspect-[3/4] rounded-xl skeleton" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12">
                        <Sparkles className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No templates found</p>
                        <p className="text-sm text-gray-600 mt-1">Try a different search or category</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {filtered.map((template) => (
                            <Link
                                key={template.id}
                                href={`/templates/${template.id}`}
                                className="group relative rounded-xl overflow-hidden border border-gray-800 bg-gray-900/50 transition-all hover:border-gray-700 active:scale-[0.98]"
                            >
                                {/* Preview */}
                                <div className="aspect-[3/4] bg-gradient-to-br from-gray-800 to-gray-900 relative">
                                    {template.preview_url ? (
                                        <img
                                            src={template.preview_url}
                                            alt={template.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Sparkles className="h-8 w-8 text-gray-600" />
                                        </div>
                                    )}

                                    {/* Featured badge */}
                                    {template.is_featured && (
                                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-yellow-500/90 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                                            <Star className="h-3 w-3 fill-current" />
                                            Featured
                                        </div>
                                    )}

                                    {/* Category badge */}
                                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur text-white text-xs px-2 py-0.5 rounded-full">
                                        {template.category}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-3">
                                    <h3 className="font-medium text-white text-sm truncate">{template.name}</h3>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.description}</p>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {template.tags.slice(0, 3).map((tag) => (
                                            <span
                                                key={tag}
                                                className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
