'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useVideoRecorder, RecordingState } from '@/lib/hooks/use-video-recorder'
import { formatDuration, cn } from '@/lib/utils'
import {
  SwitchCamera,
  Zap,
  ZapOff,
  Circle,
  Square,
  X,
  Sparkles,
  Maximize,
  Minimize,
  Music,
  Search,
  Loader2,
} from 'lucide-react'
import { AUDIOS, OVERLAYS } from '@/lib/creative-studio'
import { FUNNY_TEMPLATES } from '@/lib/templates'
import { spotify, SpotifyTrack } from '@/lib/spotify'

import { MusicPicker, MusicConfig } from '@/components/music/music-picker'

interface VideoRecorderProps {
  maxDuration: number
  useCountdown: boolean
  audioId?: string
  overlayId?: string
  templateId?: string
  onRecordingComplete: (
    blob: Blob,
    thumbnailBlob: Blob,
    audioId: string,
    overlayId: string,
    musicConfig?: { track: SpotifyTrack, config: MusicConfig }
  ) => void
  onCancel: () => void
}

export function VideoRecorder({
  maxDuration,
  useCountdown,
  audioId: initialAudioId = 'none',
  overlayId: initialOverlayId = 'none',
  templateId,
  onRecordingComplete,
  onCancel,
}: VideoRecorderProps) {
  const [currentAudioId, setCurrentAudioId] = useState(initialAudioId)
  const [currentOverlayId, setCurrentOverlayId] = useState(initialOverlayId)
  const [showCreativeStudio, setShowCreativeStudio] = useState(false)
  const [fillMode, setFillMode] = useState<'cover' | 'contain'>('contain')

  // Music State
  const [showMusicPicker, setShowMusicPicker] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null)
  const [musicConfig, setMusicConfig] = useState<MusicConfig>({ startMs: 0, volume: 0.8, mode: 'preview_overlay' })

  const template = FUNNY_TEMPLATES.find(t => t.id === templateId)

  const {
    videoRef,
    state,
    recordedBlob,
    recordedUrl,
    duration,
    countdown,
    cameraFacing,
    hasFlash,
    flashEnabled,
    zoom,
    maxZoom,
    setZoom,
    error,
    startCamera,
    stopCamera,
    startRecording,
    stopRecording,
    flipCamera,
    toggleFlash,
    reset,
  } = useVideoRecorder({ maxDuration })

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  const handleRecordingComplete = async () => {
    if (!recordedBlob || !recordedUrl) throw new Error('No recording found')

    // Generate thumbnail from first frame
    const video = document.createElement('video')
    video.src = recordedUrl
    video.muted = true
    video.playsInline = true

    await new Promise<void>((resolve) => {
      video.onloadeddata = () => {
        video.currentTime = 0
        resolve()
      }
    })

    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve()
    })

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0)

    const thumbnailBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob!),
        'image/jpeg',
        0.8
      )
    })

    return { videoBlob: recordedBlob, thumbBlob: thumbnailBlob }
  }

  const audioAsset = AUDIOS.find(a => a.id === currentAudioId)
  const overlayAsset = OVERLAYS.find(o => o.id === currentOverlayId)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Priority: Spotify Track > Audio Asset
    const url = selectedTrack?.preview_url || audioAsset?.url

    if (url) {
      // Only recreate if url changed
      if (audioRef.current?.src !== url) {
        audioRef.current = new Audio(url)
      }

      // Apply volume if spotify track
      if (selectedTrack && audioRef.current) {
        audioRef.current.volume = musicConfig.volume
      } else if (audioRef.current) {
        audioRef.current.volume = 1.0
      }
    } else {
      audioRef.current = null
    }

    return () => {
      audioRef.current?.pause()
    }
  }, [audioAsset, selectedTrack, musicConfig])

  useEffect(() => {
    const shouldPlay = state === 'recording' || (showCreativeStudio && (currentAudioId !== 'none' || selectedTrack))

    if (shouldPlay && audioRef.current) {
      audioRef.current.play().catch(err => {
        if (err.name !== 'AbortError') console.warn('Audio monitor error:', err)
      })
    } else {
      audioRef.current?.pause()
      if (audioRef.current && state !== 'recording') {
        audioRef.current.currentTime = 0
      }
    }
  }, [state, showCreativeStudio, currentAudioId, selectedTrack])

  useEffect(() => {
    if (videoRef.current && state !== 'stopped') {
      videoRef.current.play().catch(err => {
        if (err.name !== 'AbortError') console.warn('Video preview error:', err)
      })
    }
  }, [state, videoRef])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Button onClick={startCamera}>Try Again</Button>
      </div>
    )
  }

  // Preview mode after recording
  if (state === 'stopped' && recordedUrl) {
    return (
      <div className={`relative h-full bg-black ${overlayAsset?.className || ''}`}>
        <video
          src={recordedUrl}
          className={cn(
            "w-full h-full bg-black transition-all duration-300",
            fillMode === 'cover' ? 'object-cover' : 'object-contain'
          )}
          autoPlay
          loop
          muted
          playsInline
        />

        <div className="absolute bottom-20 left-0 right-0 flex items-center justify-center gap-4 px-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              reset()
              startCamera()
            }}
            className="flex-1 max-w-32 bg-white/10 border-white/20 text-white"
          >
            Re-record
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={async () => {
              const { videoBlob, thumbBlob } = await handleRecordingComplete()
              onRecordingComplete(
                videoBlob,
                thumbBlob,
                currentAudioId,
                currentOverlayId,
                selectedTrack ? { track: selectedTrack, config: musicConfig } : undefined
              )
            }}
            className="flex-1 max-w-32"
          >
            Use Video
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative h-full bg-black overflow-hidden safe-area-bottom ${overlayAsset?.className || ''}`}>
      {/* Template Video Layer */}
      {template && (
        <video
          src={template.videoUrl}
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-80"
          autoPlay
          loop
          muted
          playsInline
        />
      )}

      {/* Camera viewfinder */}
      <video
        ref={videoRef}
        className={cn(
          "relative w-full h-full bg-black transition-all duration-300 z-0",
          template ? "opacity-60" : "opacity-100",
          fillMode === 'cover' ? 'object-cover' : 'object-contain'
        )}
        autoPlay
        muted
        playsInline
        style={{
          transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none',
          ...(template?.compositionType === 'pip' ? {
            position: 'absolute',
            bottom: '2rem',
            right: '1rem',
            width: '30%',
            height: 'auto',
            border: '2px solid white',
            borderRadius: '1rem',
            zIndex: 20
          } : {})
        }}
      />

      <div
        className={cn(
          "absolute inset-0 pointer-events-none z-[100] transition-all duration-500",
          overlayAsset?.className,
          fillMode === 'cover' ? 'scale-100' : 'scale-[0.5625]'
        )}
      />

      {/* Creative Studio Panel */}
      {showCreativeStudio && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col justify-end">
          <div className="p-6 bg-gray-900/90 rounded-t-3xl border-t border-white/10 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                Creative Studio
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCreativeStudio(false)}>
                Done
              </Button>
            </div>

            <div className="space-y-6">
              {/* Soundtrack Section */}
              <div className="space-y-3">
                <label className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Music className="h-4 w-4 text-purple-400" />
                  Soundtrack
                </label>

                <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 items-center">
                  <button
                    onClick={() => {
                      setShowMusicPicker(true)
                    }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold whitespace-nowrap border transition-all ${selectedTrack
                      ? 'bg-[#1DB954]/20 border-[#1DB954] text-[#1DB954]'
                      : 'bg-white/5 border-white/10 text-white'
                      }`}
                  >
                    {selectedTrack ? (
                      <>
                        <img src={selectedTrack.image_url} className="w-5 h-5 rounded" />
                        <div className="max-w-[100px] truncate">{selectedTrack.name}</div>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Choose Music
                      </>
                    )}
                  </button>

                  <div className="w-[1px] h-8 bg-white/10 mx-2" />

                  {AUDIOS.map((audio) => (
                    <button
                      key={audio.id}
                      onClick={() => {
                        setCurrentAudioId(audio.id)
                        setSelectedTrack(null)
                      }}
                      className={`px-4 py-3 rounded-2xl text-sm font-bold whitespace-nowrap border transition-all ${currentAudioId === audio.id && !selectedTrack
                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                    >
                      {audio.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Overlay Section */}
              <div className="space-y-3">
                <label className="text-sm font-black text-gray-500 uppercase tracking-widest">Visual Overlay</label>
                <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                  {OVERLAYS.map((overlay) => (
                    <button
                      key={overlay.id}
                      onClick={() => setCurrentOverlayId(overlay.id)}
                      className={`px-4 py-3 rounded-2xl text-sm font-medium whitespace-nowrap border transition-all ${currentOverlayId === overlay.id
                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                    >
                      {overlay.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="h-8" />
          </div>
        </div>
      )}

      {/* Countdown overlay */}
      {state === 'countdown' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <span className="text-8xl font-bold text-white animate-countdown">
            {countdown}
          </span>
        </div>
      )}

      {/* Recording indicator */}
      {state === 'recording' && (
        <div className="absolute top-6 left-0 right-0 flex items-center justify-center gap-2 z-20">
          <div className="flex items-center gap-2 bg-black/50 rounded-full px-4 py-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse-recording" />
            <span className="text-white font-mono">
              {formatDuration(duration)} / {formatDuration(maxDuration)}
            </span>
          </div>
        </div>
      )}

      {/* Zoom Slider */}
      {maxZoom > 1 && state !== 'stopped' && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-20">
          <div className="h-48 w-1.5 bg-black/30 backdrop-blur rounded-full relative">
            {/* Slider logic same as before */}
            <input
              type="range"
              min={1}
              max={maxZoom}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none -rotate-180 [writing-mode:vertical-lr]"
              style={{ direction: 'rtl' }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 bg-white/80 rounded-full transition-all"
              style={{ height: `${((zoom - 1) / (maxZoom - 1)) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-white bg-black/40 px-2 py-1 rounded-full backdrop-blur">
            {zoom.toFixed(1)}x
          </span>
        </div>
      )}

      {/* Top controls */}
      <div className="absolute top-6 left-4 right-4 flex items-center justify-between">
        {/* ... (Existing top controls) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="bg-black/30 backdrop-blur"
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => setShowCreativeStudio(true)}
            className="bg-black/40 backdrop-blur-xl border border-white/10 pl-2 pr-4 h-12 rounded-2xl flex items-center gap-2 hover:bg-white/10 transition-all font-black uppercase tracking-tighter italic text-[10px]"
            disabled={state === 'recording'}
          >
            <div className="bg-purple-600 rounded-lg p-1.5 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            Creative Studio
          </Button>
          {hasFlash && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFlash}
              className="bg-black/30 backdrop-blur"
              disabled={state === 'recording'}
            >
              {flashEnabled ? (
                <Zap className="h-6 w-6 text-yellow-400" />
              ) : (
                <ZapOff className="h-6 w-6" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFillMode(fillMode === 'cover' ? 'contain' : 'cover')}
            className="bg-black/30 backdrop-blur"
            disabled={state === 'recording'}
          >
            {fillMode === 'cover' ? (
              <Minimize className="h-6 w-6" />
            ) : (
              <Maximize className="h-6 w-6" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={flipCamera}
            className="bg-black/30 backdrop-blur"
            disabled={state === 'recording'}
          >
            <SwitchCamera className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-16 left-0 right-0 flex items-center justify-center">
        {state === 'idle' || state === 'countdown' ? (
          <button
            onClick={() => startRecording(useCountdown)}
            disabled={state === 'countdown'}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50"
          >
            <Circle className="h-14 w-14 text-red-500 fill-red-500" />
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-red-500 transition-transform active:scale-95"
          >
            <Square className="h-8 w-8 text-white fill-white" />
          </button>
        )}
      </div>

      {/* Duration progress bar */}
      {state === 'recording' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
            style={{ width: `${(duration / maxDuration) * 100}%` }}
          />
        </div>
      )}

      <MusicPicker
        open={showMusicPicker}
        onOpenChange={setShowMusicPicker}
        onSelect={(track, config) => {
          setSelectedTrack(track)
          setMusicConfig(config)
          setCurrentAudioId('spotify')
        }}
        currentTrack={selectedTrack}
      />
    </div>
  )
}
