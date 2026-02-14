'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { VideoPlayer } from '@/components/video/video-player'
import { ShareSheet } from '@/components/share/share-sheet'
import { createClient } from '@/lib/supabase/client'
import { Generation } from '@/types/database'
import {
  ArrowLeft,
  Download,
  Share2,
  Globe,
  Lock,
  Trash2,
  RotateCcw,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { AUDIOS, OVERLAYS, TEXT_STYLES } from '@/lib/creative-studio'

export default function ResultPage() {
  const params = useParams()
  const router = useRouter()
  const [generation, setGeneration] = useState<Generation | null>(null)
  const [loading, setLoading] = useState(true)
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [showShareSheet, setShowShareSheet] = useState(false)

  // Get creative settings from JSONB
  const settings = generation?.settings as any || {}
  const audioAsset = AUDIOS.find(a => a.id === settings.audio_id)
  const overlayAsset = OVERLAYS.find(o => o.id === settings.overlay_id)
  const textStyle = TEXT_STYLES.find(t => t.id === settings.text_style_id)

  // Spotify/Music State
  const [musicConfig, setMusicConfig] = useState<any>(null)

  useEffect(() => {
    async function fetchGeneration() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('id', params.id as string)
        .single()

      if (error || !data) {
        router.push('/create')
        return
      }

      setGeneration(data)
      setCaption(data.caption || '')
      setHashtags(data.hashtags?.join(' ') || '')

      setLoading(false)

      // Fetch music if exists
      const { data: musicData } = await supabase
        .from('video_music')
        .select('*')
        .eq('generation_id', data.id)
        .single()

      if (musicData) {
        setMusicConfig(musicData)
      }
    }

    fetchGeneration()
  }, [params.id, router])

  const handlePublish = async () => {
    if (!generation) return
    setIsPublishing(true)

    try {
      const supabase = createClient()
      const hashtagArray = hashtags
        .split(/[\s,]+/)
        .filter(t => t.startsWith('#') || t.length > 0)
        .map(t => t.startsWith('#') ? t : `#${t}`)

      const { error } = await supabase
        .from('generations')
        .update({
          caption,
          hashtags: hashtagArray.length > 0 ? hashtagArray : null,
          is_published: true,
        })
        .eq('id', generation.id)

      if (error) throw error

      setGeneration({ ...generation, is_published: true, caption, hashtags: hashtagArray })
      setShowShareSheet(true)
    } catch (error) {
      console.error('Publish error:', error)
      alert('Failed to publish. Please try again.')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    if (!generation) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('generations')
        .update({ is_published: false })
        .eq('id', generation.id)

      if (error) throw error

      setGeneration({ ...generation, is_published: false })
    } catch (error) {
      console.error('Unpublish error:', error)
    }
  }

  const handleDelete = async () => {
    if (!generation || !confirm('Are you sure you want to delete this video?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('generations')
        .delete()
        .eq('id', generation.id)

      if (error) throw error

      router.push('/create')
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const handleDownload = async () => {
    if (!generation?.output_video_url) return

    try {
      const response = await fetch(generation.output_video_url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clipdrop-${generation.id}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!generation) return null

  const publicUrl = `${window.location.origin}/p/${generation.id}`

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">
            {generation.mode === 'recorded' ? 'Your Video' : 'Generated Video'}
          </h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Video with Creative Studio Overlays */}
      <div className={`aspect-[9/16] max-h-[60vh] bg-gray-900 relative ${overlayAsset?.className || ''}`}>
        {generation.output_video_url && (
          <>
            <VideoPlayer
              src={generation.output_video_url}
              poster={generation.thumbnail_url || undefined}
              autoPlay
              className="w-full h-full"
              audioSrc={musicConfig?.preview_url || audioAsset?.url}
              overlayClassName={overlayAsset?.className}
              volume={musicConfig?.volume || 1}
            />

            {/* Spotify Overlay for In-App Playback */}
            {musicConfig?.mode === 'in_app_playback' && (
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-green-500/30">
                <img src={musicConfig.album_image_url} className="w-4 h-4 rounded-full" />
                <span className="text-[10px] text-green-400 font-medium max-w-[100px] truncate">
                  {musicConfig.track_name}
                </span>
              </div>
            )}

            {/* Text Overlay */}
            {settings.text_overlay && (
              <div className="absolute inset-x-0 bottom-20 px-6 z-20 pointer-events-none">
                <p className={`text-xl text-center break-words ${textStyle?.className || ''}`}>
                  {settings.text_overlay}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 space-y-4">
        {/* Quick actions */}
        <div className="flex gap-2">
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

        {/* AI-specific actions */}
        {generation.mode !== 'recorded' && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                const params = new URLSearchParams()
                if (generation.prompt) params.set('prompt', generation.prompt)
                if (generation.template_id) params.set('templateId', generation.template_id)
                router.push(`/create/ai?${params.toString()}`)
              }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Again
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => router.push(`/create/ai?mode=video2video`)}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Remix
            </Button>
          </div>
        )}

        {/* Caption & Hashtags */}
        {!generation.is_published && (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Caption</label>
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                maxLength={280}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Hashtags</label>
              <Input
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#fun #video #clipdrop"
              />
            </div>
          </div>
        )}

        {/* Publish/Unpublish */}
        {generation.is_published ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <Globe className="h-4 w-4" />
              Published • Anyone with the link can view
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleUnpublish}
            >
              <Lock className="h-4 w-4 mr-2" />
              Make Private
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            className="w-full"
            onClick={handlePublish}
            disabled={isPublishing}
          >
            <Globe className="h-4 w-4 mr-2" />
            {isPublishing ? 'Publishing...' : 'Publish'}
          </Button>
        )}

        {/* Secondary actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-800">
          {generation.mode === 'recorded' && (
            <Button
              variant="ghost"
              className="flex-1 text-gray-400"
              onClick={() => router.push('/create')}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Record Again
            </Button>
          )}
          <Button
            variant="ghost"
            className="flex-1 text-red-400"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Share Sheet */}
      <ShareSheet
        open={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        url={publicUrl}
        title={caption || 'Check out my video on ClipDrop!'}
        videoUrl={generation.output_video_url || undefined}
      />
    </div>
  )
}
