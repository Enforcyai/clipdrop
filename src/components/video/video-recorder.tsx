'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useVideoRecorder, RecordingState } from '@/lib/hooks/use-video-recorder'
import { formatDuration } from '@/lib/utils'
import {
  SwitchCamera,
  Zap,
  ZapOff,
  Circle,
  Square,
  X,
} from 'lucide-react'

interface VideoRecorderProps {
  maxDuration: number
  useCountdown: boolean
  onRecordingComplete: (blob: Blob, thumbnailBlob: Blob) => void
  onCancel: () => void
}

export function VideoRecorder({
  maxDuration,
  useCountdown,
  onRecordingComplete,
  onCancel,
}: VideoRecorderProps) {
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
    if (!recordedBlob || !recordedUrl) return

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

    onRecordingComplete(recordedBlob, thumbnailBlob)
  }

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
      <div className="relative h-full bg-black">
        <video
          src={recordedUrl}
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />

        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4 px-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              reset()
              startCamera()
            }}
            className="flex-1 max-w-32"
          >
            Re-record
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleRecordingComplete}
            className="flex-1 max-w-32"
          >
            Use Video
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full bg-black">
      {/* Camera viewfinder */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
        style={{ transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none' }}
      />

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
        <div className="absolute top-6 left-0 right-0 flex items-center justify-center gap-2">
          <div className="flex items-center gap-2 bg-black/50 rounded-full px-4 py-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse-recording" />
            <span className="text-white font-mono">
              {formatDuration(duration)} / {formatDuration(maxDuration)}
            </span>
          </div>
        </div>
      )}

      {/* Top controls */}
      <div className="absolute top-6 left-4 right-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="bg-black/30 backdrop-blur"
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="flex gap-2">
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
            onClick={flipCamera}
            className="bg-black/30 backdrop-blur"
            disabled={state === 'recording'}
          >
            <SwitchCamera className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center">
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
    </div>
  )
}
