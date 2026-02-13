'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useLikes(userId: string | null) {
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
    const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})

    const fetchLikes = useCallback(async (postIds: string[]) => {
        const supabase = createClient()

        // Get counts
        const { data: counts } = await supabase
            .from('likes')
            .select('post_id')
            .in('post_id', postIds)

        if (counts) {
            const countMap: Record<string, number> = {}
            counts.forEach((like) => {
                countMap[like.post_id] = (countMap[like.post_id] || 0) + 1
            })
            setLikeCounts(countMap)
        }

        // Check user's likes
        if (userId) {
            const { data: userLikes } = await supabase
                .from('likes')
                .select('post_id')
                .eq('user_id', userId)
                .in('post_id', postIds)

            if (userLikes) {
                setLikedPosts(new Set(userLikes.map((l) => l.post_id)))
            }
        }
    }, [userId])

    const toggleLike = useCallback(async (postId: string) => {
        if (!userId) return

        const supabase = createClient()
        const isLiked = likedPosts.has(postId)

        // Optimistic update
        setLikedPosts((prev) => {
            const next = new Set(prev)
            if (isLiked) next.delete(postId)
            else next.add(postId)
            return next
        })
        setLikeCounts((prev) => ({
            ...prev,
            [postId]: (prev[postId] || 0) + (isLiked ? -1 : 1),
        }))

        if (isLiked) {
            await supabase
                .from('likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', userId)
        } else {
            await supabase
                .from('likes')
                .insert({ post_id: postId, user_id: userId })
        }
    }, [userId, likedPosts])

    return {
        likedPosts,
        likeCounts,
        fetchLikes,
        toggleLike,
        isLiked: (postId: string) => likedPosts.has(postId),
        getLikeCount: (postId: string) => likeCounts[postId] || 0,
    }
}
