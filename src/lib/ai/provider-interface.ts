/**
 * AI Video Generation Provider Interface
 *
 * This is the abstraction layer for plugging in different AI video providers
 * (Runway, Kling, Luma, Pika, etc.). Implement this interface for each provider.
 */

import { VideoStyle, AspectRatio, Intensity, GenerationMode } from '@/types/database'

export interface GenerationRequest {
    mode: Exclude<GenerationMode, 'recorded'>
    prompt: string
    duration: number // seconds: 5, 8, 10, 15
    style: VideoStyle
    aspectRatio: AspectRatio
    intensity: Intensity
    templateId?: string
    inputAssetUrl?: string // for image2video / video2video
}

export interface JobStartResult {
    jobId: string
    estimatedSeconds?: number
}

export type JobStatusType = 'queued' | 'running' | 'succeeded' | 'failed'

export interface JobPollResult {
    status: JobStatusType
    progress: number // 0-100
    outputVideoUrl?: string
    outputThumbnailUrl?: string
    errorMessage?: string
}

export interface AIProvider {
    readonly name: string

    /**
     * Start a generation job with the provider
     */
    startJob(request: GenerationRequest): Promise<JobStartResult>

    /**
     * Poll the status of a generation job
     */
    pollJob(jobId: string): Promise<JobPollResult>

    /**
     * Cancel a running job (optional — not all providers support this)
     */
    cancelJob?(jobId: string): Promise<void>
}
