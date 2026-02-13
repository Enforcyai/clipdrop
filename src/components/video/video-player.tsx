'use client'

import { useRef, useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
  src: string
  poster?: string
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  className?: string
  showControls?: boolean
  audioSrc?: string
}

export function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  loop = true,
  muted = true,
  className,
  showControls = true,
  audioSrc,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(muted)
  const [progress, setProgress] = useState(0)
  const [videoError, setVideoError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (audioSrc) {
      audioRef.current = new Audio(audioSrc)
      audioRef.current.loop = loop
    }
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [audioSrc, loop])

  useEffect(() => {
    const video = videoRef.current
    const audio = audioRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration) * 100
      setProgress(progress)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      if (audio) {
        audio.currentTime = video.currentTime
        audio.play()
      }
    }
    const handlePause = () => {
      setIsPlaying(false)
      audio?.pause()
    }
    const handleSeeking = () => {
      if (audio) audio.currentTime = video.currentTime
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('seeking', handleSeeking)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('seeking', handleSeeking)
    }
  }, [audioSrc])

  // Reset error state when src changes
  useEffect(() => {
    setVideoError(false)
  }, [src])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  // If video fails to load and we have a poster image, show that instead
  if (videoError && poster) {
    return (
      <div className={cn('relative group', className)}>
        <img
          src={poster}
          alt="Video preview"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur flex items-center justify-center mb-2">
            <Play className="h-8 w-8 text-white/70 ml-1" />
          </div>
          <span className="text-white/60 text-xs">Preview (mock mode)</span>
        </div>
      </div>
    )
  }

  // Check if the src is an SVG/image endpoint rather than a video
  const isSVGSource = src.includes('/api/sample-video')

  if (isSVGSource) {
    return (
      <div className={cn('relative group', className)}>
        {poster ? (
          <img
            src={poster}
            alt="Video preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <object
            data={src}
            type="image/svg+xml"
            className="w-full h-full object-cover"
          >
            <div className="w-full h-full bg-gradient-to-br from-purple-900 to-gray-900 flex items-center justify-center">
              <span className="text-white/60">AI Generated Video</span>
            </div>
          </object>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur flex items-center justify-center mb-2">
            <Play className="h-8 w-8 text-white/70 ml-1" />
          </div>
          <span className="text-white/50 text-xs bg-black/30 px-3 py-1 rounded-full">Mock AI Preview</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative group', className)}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline
        className="w-full h-full object-cover"
        onClick={togglePlay}
      />

      {showControls && (
        <>
          {/* Play/Pause overlay */}
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity',
              isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
            )}
          >
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-black/50 backdrop-blur flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause className="h-8 w-8 text-white" />
              ) : (
                <Play className="h-8 w-8 text-white ml-1" />
              )}
            </button>
          </div>

          {/* Mute button */}
          <button
            onClick={toggleMute}
            className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5 text-white" />
            ) : (
              <Volume2 className="h-5 w-5 text-white" />
            )}
          </button>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800/50">
            <div
              className="h-full bg-white/80 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}
    </div>
  )
}
