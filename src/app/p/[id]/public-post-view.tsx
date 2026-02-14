'use client'

import { useState } from 'react'
import Link from 'next/link'
import { VideoPlayer } from '@/components/video/video-player'
import { ShareSheet } from '@/components/share/share-sheet'
import { Button } from '@/components/ui/button'
import { Generation, Profile, VideoMusic } from '@/types/database'
import { Share2, Download, Video, Music, ExternalLink } from 'lucide-react'

type PostWithProfile = Generation & {
  profiles: Partial<Profile> | null
}

interface PublicPostViewProps {
  post: PostWithProfile
  music?: VideoMusic | null
}

export function PublicPostView({ post, music }: PublicPostViewProps) {
  const [showShareSheet, setShowShareSheet] = useState(false)

  const handleDownload = async () => {
    if (!post.output_video_url) return

    try {
      const response = await fetch(post.output_video_url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clipdrop-${post.id}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/p/${post.id}`
    : `/p/${post.id}`

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-gray-800">
        <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <Video className="h-6 w-6 text-purple-500" />
            <span className="font-bold text-white">ClipDrop</span>
          </Link>
          <Button variant="primary" size="sm" asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto">
        {/* Video */}
        <div className="aspect-[9/16] bg-gray-900">
          {post.output_video_url && (
            <VideoPlayer
              src={post.output_video_url}
              poster={post.thumbnail_url || undefined}
              autoPlay
              className="w-full h-full"
            />
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-4">
          {/* User */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              {post.profiles?.avatar_url ? (
                <img
                  src={post.profiles.avatar_url}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-white">
                  {post.profiles?.display_name?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium text-white">
                {post.profiles?.display_name || 'User'}
              </p>
              {post.profiles?.username && (
                <p className="text-sm text-gray-400">@{post.profiles.username}</p>
              )}
            </div>
          </div>

          {/* Caption */}
          {post.caption && (
            <p className="text-white">{post.caption}</p>
          )}

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.hashtags.map((tag, i) => (
                <span key={i} className="text-purple-400 text-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-800">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowShareSheet(true)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          {/* CTA */}
          <div className="text-center pt-4">
            <p className="text-gray-400 text-sm mb-3">
              Create your own videos with ClipDrop
            </p>
            <Button variant="primary" asChild>
              <Link href="/signup">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Share Sheet */}
      <ShareSheet
        open={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        url={publicUrl}
        title={post.caption || 'Check out this video on ClipDrop!'}
        videoUrl={post.output_video_url || undefined}
      />
    </div>
  )
}
