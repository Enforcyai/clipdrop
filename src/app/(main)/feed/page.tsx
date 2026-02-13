'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VideoPlayer } from '@/components/video/video-player'
import { CommentSheet } from '@/components/feed/comment-sheet'
import { ShareSheet } from '@/components/share/share-sheet'
import { Heart, MessageCircle, Share2, MoreHorizontal, Flag } from 'lucide-react'
import { Generation } from '@/types/database'

interface FeedPost extends Generation {
  profiles: { username: string | null; display_name: string | null; avatar_url: string | null } | null
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null)
  const [activeSharePost, setActiveSharePost] = useState<FeedPost | null>(null)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [heartAnimations, setHeartAnimations] = useState<Set<string>>(new Set())
  const [showMenu, setShowMenu] = useState<string | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUser(user.id)

      // Get published posts
      const { data, error } = await supabase
        .from('generations')
        .select('*, profiles(username, display_name, avatar_url)')
        .eq('is_published', true)
        .eq('status', 'succeeded')
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        setPosts(data as unknown as FeedPost[])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const toggleLike = (postId: string) => {
    const isLiked = likedPosts.has(postId)
    setLikedPosts((prev) => {
      const next = new Set(prev)
      if (isLiked) next.delete(postId)
      else next.add(postId)
      return next
    })

    // Heart animation
    if (!isLiked) {
      setHeartAnimations((prev) => new Set(prev).add(postId))
      setTimeout(() => {
        setHeartAnimations((prev) => {
          const next = new Set(prev)
          next.delete(postId)
          return next
        })
      }, 300)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4">
          <Heart className="h-10 w-10 text-gray-600" />
        </div>
        <h2 className="text-xl font-semibold text-white">No posts yet</h2>
        <p className="text-gray-500 mt-2 text-center">Be the first to create and share a video!</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="p-4 pointer-events-auto">
          <h1 className="text-xl font-bold gradient-text text-center">ClipDrop</h1>
        </div>
      </div>

      {/* TikTok-style feed */}
      <div
        ref={feedRef}
        className="snap-y-mandatory h-screen no-scrollbar"
      >
        {posts.map((post) => (
          <div key={post.id} className="snap-start h-screen relative">
            {/* Video */}
            <div className="absolute inset-0">
              {post.output_video_url && (
                <VideoPlayer
                  src={post.output_video_url}
                  poster={post.thumbnail_url || undefined}
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-cover"
                />
              )}
              {/* Gradient overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
            </div>

            {/* Right side action buttons */}
            <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-10">
              {/* Like */}
              <button
                onClick={() => toggleLike(post.id)}
                className="flex flex-col items-center gap-1"
              >
                <div className={heartAnimations.has(post.id) ? 'animate-heart-pop' : ''}>
                  <Heart
                    className={`h-7 w-7 ${likedPosts.has(post.id) ? 'fill-red-500 text-red-500' : 'text-white'
                      }`}
                  />
                </div>
                <span className="text-xs text-white font-medium">
                  {likedPosts.has(post.id) ? '1' : '0'}
                </span>
              </button>

              {/* Comment */}
              <button
                onClick={() => setActiveCommentPost(post.id)}
                className="flex flex-col items-center gap-1"
              >
                <MessageCircle className="h-7 w-7 text-white" />
                <span className="text-xs text-white font-medium">0</span>
              </button>

              {/* Share */}
              <button
                onClick={() => setActiveSharePost(post)}
                className="flex flex-col items-center gap-1"
              >
                <Share2 className="h-7 w-7 text-white" />
                <span className="text-xs text-white font-medium">Share</span>
              </button>

              {/* More */}
              <button
                onClick={() => setShowMenu(showMenu === post.id ? null : post.id)}
                className="flex flex-col items-center gap-1"
              >
                <MoreHorizontal className="h-7 w-7 text-white" />
              </button>

              {/* Menu dropdown */}
              {showMenu === post.id && (
                <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[140px] animate-scale-in">
                  <button
                    onClick={() => {
                      setShowMenu(null)
                      alert('Report submitted. Thank you.')
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-800"
                  >
                    <Flag className="h-4 w-4" />
                    Report
                  </button>
                </div>
              )}
            </div>

            {/* Bottom info overlay */}
            <div className="absolute bottom-20 left-4 right-16 z-10">
              {/* Username */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400 ring-2 ring-purple-500">
                  {post.profiles?.avatar_url ? (
                    <img src={post.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (post.profiles?.username?.[0] || '?').toUpperCase()
                  )}
                </div>
                <span className="font-semibold text-white text-sm">
                  @{post.profiles?.username || 'user'}
                </span>
              </div>

              {/* Caption */}
              {post.caption && (
                <p className="text-sm text-white/90 line-clamp-2 mb-1">{post.caption}</p>
              )}

              {/* Hashtags */}
              {post.hashtags && post.hashtags.length > 0 && (
                <p className="text-sm text-purple-400">
                  {post.hashtags.map((tag) => `#${tag.replace('#', '')}`).join(' ')}
                </p>
              )}

              {/* Mode badge */}
              {post.mode !== 'recorded' && (
                <div className="inline-flex items-center gap-1 mt-2 bg-purple-600/20 text-purple-300 text-xs px-2 py-0.5 rounded-full">
                  ✨ AI Generated
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Comment sheet */}
      <CommentSheet
        postId={activeCommentPost || ''}
        isOpen={!!activeCommentPost}
        onClose={() => setActiveCommentPost(null)}
        currentUserId={currentUser}
      />

      {/* Share sheet */}
      {activeSharePost && (
        <ShareSheet
          open={!!activeSharePost}
          onClose={() => setActiveSharePost(null)}
          url={`${typeof window !== 'undefined' ? window.location.origin : ''}/p/${activeSharePost.id}`}
          title={activeSharePost.caption || 'Check out this video on ClipDrop!'}
          videoUrl={activeSharePost.output_video_url || undefined}
        />
      )}
    </div>
  )
}
