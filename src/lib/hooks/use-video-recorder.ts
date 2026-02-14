'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export type RecordingState = 'idle' | 'countdown' | 'recording' | 'paused' | 'stopped'
export type CameraFacing = 'user' | 'environment'

interface UseVideoRecorderOptions {
  maxDuration?: number // in seconds
  onRecordingComplete?: (blob: Blob) => void
}

interface UseVideoRecorderReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>
  previewRef: React.RefObject<HTMLVideoElement | null>
  state: RecordingState
  recordedBlob: Blob | null
  recordedUrl: string | null
  duration: number
  countdown: number
  cameraFacing: CameraFacing
  hasFlash: boolean
  flashEnabled: boolean
  zoom: number
  maxZoom: number
  error: string | null
  startCamera: () => Promise<void>
  stopCamera: () => void
  startRecording: (withCountdown?: boolean) => void
  stopRecording: () => void
  flipCamera: () => Promise<void>
  toggleFlash: () => void
  setZoom: (value: number) => Promise<void>
  reset: () => void
}

export function useVideoRecorder(options: UseVideoRecorderOptions = {}): UseVideoRecorderReturn {
  const { maxDuration = 15, onRecordingComplete } = options

  const videoRef = useRef<HTMLVideoElement>(null)
  const previewRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  const [state, setState] = useState<RecordingState>('idle')
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('environment')
  const [hasFlash, setHasFlash] = useState(false)
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [zoom, setZoomValue] = useState(1)
  const [maxZoom, setMaxZoom] = useState(1)
  const [error, setError] = useState<string | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl)
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
      }
    }
  }, [recordedUrl])

  const startCamera = useCallback(async () => {
    try {
      setError(null)

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraFacing,
          aspectRatio: { ideal: 0.5625 }, // 9:16
          width: { ideal: 720 },
          height: { ideal: 1280 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Wrap play in a try-catch to handle AbortError
        try {
          await videoRef.current.play()
        } catch (err: any) {
          if (err.name !== 'AbortError') throw err
        }
      }

      // Check for capabilities (flash/torch and zoom)
      const videoTrack = stream.getVideoTracks()[0]
      const capabilities = videoTrack.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean, zoom?: { min: number, max: number } }
      setHasFlash(capabilities?.torch === true)

      if (capabilities?.zoom) {
        setMaxZoom(capabilities.zoom.max)
        setZoomValue(capabilities.zoom.min || 1)
      } else {
        setMaxZoom(1)
        setZoomValue(1)
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      const message = err instanceof Error ? err.message : 'Failed to access camera'
      setError(message)
      console.error('Camera error:', err)
    }
  }, [cameraFacing])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const startRecording = useCallback((withCountdown = true) => {
    if (!streamRef.current) {
      setError('Camera not started')
      return
    }

    const startActualRecording = () => {
      chunksRef.current = []
      setDuration(0)

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'video/mp4'

      const mediaRecorder = new MediaRecorder(streamRef.current!, {
        mimeType,
        videoBitsPerSecond: 2500000,
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setRecordedBlob(blob)
        const url = URL.createObjectURL(blob)
        setRecordedUrl(url)
        setState('stopped')
        onRecordingComplete?.(blob)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(100) // Collect data every 100ms
      setState('recording')

      // Start duration timer
      const startTime = Date.now()
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        setDuration(elapsed)

        if (elapsed >= maxDuration) {
          mediaRecorder.stop()
          if (timerRef.current) {
            clearInterval(timerRef.current)
          }
        }
      }, 100)
    }

    if (withCountdown) {
      setState('countdown')
      setCountdown(3)

      let count = 3
      countdownRef.current = setInterval(() => {
        count -= 1
        setCountdown(count)

        if (count === 0) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current)
          }
          startActualRecording()
        }
      }, 1000)
    } else {
      startActualRecording()
    }
  }, [maxDuration, onRecordingComplete])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
    }
  }, [])

  const flipCamera = useCallback(async () => {
    const newFacing = cameraFacing === 'user' ? 'environment' : 'user'
    setCameraFacing(newFacing)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: newFacing,
            aspectRatio: { ideal: 0.5625 }, // 9:16
            width: { ideal: 720 },
            height: { ideal: 1280 },
            frameRate: { ideal: 30 },
          },
          audio: true,
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          try {
            await videoRef.current.play()
          } catch (err: any) {
            if (err.name !== 'AbortError') throw err
          }
        }

        // Check for capabilities on new camera
        const videoTrack = stream.getVideoTracks()[0]
        const capabilities = videoTrack.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean, zoom?: { min: number, max: number } }
        setHasFlash(capabilities?.torch === true)
        setFlashEnabled(false)

        if (capabilities?.zoom) {
          setMaxZoom(capabilities.zoom.max)
          setZoomValue(capabilities.zoom.min || 1)
        } else {
          setMaxZoom(1)
          setZoomValue(1)
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return
        setError('Failed to switch camera')
        console.error('Camera switch error:', err)
      }
    }
  }, [cameraFacing])

  const toggleFlash = useCallback(async () => {
    if (!streamRef.current || !hasFlash) return

    const videoTrack = streamRef.current.getVideoTracks()[0]
    const newFlashState = !flashEnabled

    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: newFlashState } as MediaTrackConstraintSet],
      })
      setFlashEnabled(newFlashState)
    } catch (err) {
      console.error('Flash toggle error:', err)
    }
  }, [hasFlash, flashEnabled])

  const setZoom = useCallback(async (value: number) => {
    if (!streamRef.current) return
    const videoTrack = streamRef.current.getVideoTracks()[0]

    try {
      await videoTrack.applyConstraints({
        advanced: [{ zoom: value } as any],
      })
      setZoomValue(value)
    } catch (err) {
      console.error('Zoom error:', err)
    }
  }, [])

  const reset = useCallback(() => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
    }
    setRecordedBlob(null)
    setRecordedUrl(null)
    setDuration(0)
    setState('idle')
    setError(null)
  }, [recordedUrl])

  return {
    videoRef,
    previewRef,
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
    error,
    startCamera,
    stopCamera,
    startRecording,
    stopRecording,
    flipCamera,
    toggleFlash,
    setZoom,
    reset,
  }
}
