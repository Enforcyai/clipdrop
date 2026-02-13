'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { VideoRecorder } from '@/components/video/video-recorder'
import { createClient } from '@/lib/supabase/client'
import {
  Video,
  Sparkles,
  Image,
  Wand2,
  ChevronLeft,
  Clock,
  Timer,
} from 'lucide-react'

type CreateMode = 'select' | 'record' | 'ai' | 'template' | 'remix'
type Duration = 5 | 10 | 15 | 30

const DURATIONS: { value: Duration; label: string }[] = [
  { value: 5, label: '5s' },
  { value: 10, label: '10s' },
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
]

export default function CreatePage() {
  const router = useRouter()
  const [mode, setMode] = useState<CreateMode>('select')
  const [duration, setDuration] = useState<Duration>(15)
  const [useCountdown, setUseCountdown] = useState(true)
  const [uploading, setUploading] = useState(false)

  const handleRecordingComplete = async (videoBlob: Blob, thumbnailBlob: Blob) => {
    setUploading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Upload video
      const videoFileName = `${user.id}/${Date.now()}.webm`
      const { error: videoError } = await supabase.storage
        .from('user_videos')
        .upload(videoFileName, videoBlob, {
          contentType: 'video/webm',
        })

      if (videoError) throw videoError

      // Upload thumbnail
      const thumbFileName = `${user.id}/${Date.now()}.jpg`
      const { error: thumbError } = await supabase.storage
        .from('thumbnails')
        .upload(thumbFileName, thumbnailBlob, {
          contentType: 'image/jpeg',
        })

      if (thumbError) throw thumbError

      // Get public URLs
      const { data: videoUrlData } = supabase.storage
        .from('user_videos')
        .getPublicUrl(videoFileName)

      const { data: thumbUrlData } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(thumbFileName)

      // Create generation record
      const { data: generation, error: dbError } = await supabase
        .from('generations')
        .insert({
          user_id: user.id,
          mode: 'recorded',
          status: 'succeeded',
          output_video_url: videoUrlData.publicUrl,
          thumbnail_url: thumbUrlData.publicUrl,
          settings: {
            duration,
            camera: 'rear',
          },
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Navigate to result page
      router.push(`/create/result/${generation.id}`)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload video. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  if (mode === 'record') {
    return (
      <div className="fixed inset-0 bg-black z-50">
        {uploading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-400">Uploading video...</p>
          </div>
        ) : (
          <VideoRecorder
            maxDuration={duration}
            useCountdown={useCountdown}
            onRecordingComplete={handleRecordingComplete}
            onCancel={() => setMode('select')}
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-2xl font-bold gradient-text">Create</h1>
          <p className="text-gray-400 mt-2">Choose how you want to create</p>
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-2 gap-4">
          <ModeCard
            icon={Video}
            title="Record Video"
            description="Use your camera"
            onClick={() => setMode('record')}
            gradient="from-purple-600 to-pink-600"
          />
          <ModeCard
            icon={Sparkles}
            title="AI Generate"
            description="From text prompt"
            onClick={() => router.push('/create/ai')}
            gradient="from-blue-600 to-cyan-600"
          />
          <ModeCard
            icon={Image}
            title="Use Template"
            description="Pre-made effects"
            onClick={() => router.push('/templates')}
            gradient="from-orange-600 to-yellow-600"
          />
          <ModeCard
            icon={Wand2}
            title="Remix"
            description="Edit existing video"
            onClick={() => router.push('/create/ai?mode=video2video')}
            gradient="from-green-600 to-emerald-600"
          />
        </div>

        {/* Recording Options */}
        <Card className="mt-8">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-medium text-white flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recording Options
            </h3>

            {/* Duration selector */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Duration</label>
              <div className="flex gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDuration(d.value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${duration === d.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Countdown toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-400">3-2-1 Countdown</span>
              </div>
              <button
                onClick={() => setUseCountdown(!useCountdown)}
                className={`w-12 h-6 rounded-full transition-colors ${useCountdown ? 'bg-purple-600' : 'bg-gray-700'
                  }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${useCountdown ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface ModeCardProps {
  icon: React.ElementType
  title: string
  description: string
  onClick: () => void
  gradient: string
  disabled?: boolean
  comingSoon?: boolean
}

function ModeCard({
  icon: Icon,
  title,
  description,
  onClick,
  gradient,
  disabled,
  comingSoon,
}: ModeCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative p-4 rounded-xl border border-gray-800 bg-gray-900/50 text-left transition-all ${disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:border-gray-700 hover:bg-gray-900 active:scale-98'
        }`}
    >
      <div
        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}
      >
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="font-medium text-white">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
      {comingSoon && (
        <span className="absolute top-2 right-2 text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
          Soon
        </span>
      )}
    </button>
  )
}
