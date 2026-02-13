'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Send, Trash2 } from 'lucide-react'

interface CommentData {
    id: string
    content: string
    created_at: string
    user_id: string
    profiles: { username: string | null; display_name: string | null; avatar_url: string | null } | null
}

interface CommentSheetProps {
    postId: string
    isOpen: boolean
    onClose: () => void
    currentUserId: string | null
}

export function CommentSheet({ postId, isOpen, onClose, currentUserId }: CommentSheetProps) {
    const [comments, setComments] = useState<CommentData[]>([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            fetchComments()
            setTimeout(() => inputRef.current?.focus(), 300)
        }
    }, [isOpen, postId])

    const fetchComments = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data } = await supabase
            .from('comments')
            .select('*, profiles(username, display_name, avatar_url)')
            .eq('post_id', postId)
            .order('created_at', { ascending: true })

        if (data) setComments(data as unknown as CommentData[])
        setLoading(false)
    }

    const handleSubmit = async () => {
        if (!newComment.trim() || !currentUserId || submitting) return
        setSubmitting(true)

        const supabase = createClient()
        const { data, error } = await supabase
            .from('comments')
            .insert({
                post_id: postId,
                user_id: currentUserId,
                content: newComment.trim(),
            })
            .select('*, profiles(username, display_name, avatar_url)')
            .single()

        if (!error && data) {
            setComments((prev) => [...prev, data as unknown as CommentData])
            setNewComment('')
        }
        setSubmitting(false)
    }

    const handleDelete = async (commentId: string) => {
        const supabase = createClient()
        await supabase.from('comments').delete().eq('id', commentId)
        setComments((prev) => prev.filter((c) => c.id !== commentId))
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />

            {/* Sheet */}
            <div className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-2xl max-h-[70vh] flex flex-col animate-slide-up safe-area-bottom">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h3 className="font-semibold text-white">
                        Comments {comments.length > 0 && `(${comments.length})`}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Comments list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : comments.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No comments yet. Be the first!</p>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400 shrink-0">
                                    {comment.profiles?.avatar_url ? (
                                        <img src={comment.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        (comment.profiles?.username?.[0] || '?').toUpperCase()
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-300">
                                            @{comment.profiles?.username || 'user'}
                                        </span>
                                        <span className="text-xs text-gray-600">
                                            {new Date(comment.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 mt-0.5">{comment.content}</p>
                                </div>
                                {currentUserId === comment.user_id && (
                                    <button
                                        onClick={() => handleDelete(comment.id)}
                                        className="text-gray-600 hover:text-red-400 transition-colors shrink-0"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Input */}
                {currentUserId && (
                    <div className="p-4 border-t border-gray-800 flex gap-2">
                        <Input
                            ref={inputRef}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            className="flex-1"
                        />
                        <Button
                            variant="primary"
                            size="icon"
                            onClick={handleSubmit}
                            disabled={!newComment.trim() || submitting}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
