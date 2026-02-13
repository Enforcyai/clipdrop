/**
 * Mock AI Video Provider
 *
 * Simulates AI video generation by returning a sample video after a delay.
 * Replace this with a real provider implementation (Runway, Kling, etc.)
 */

import { AIProvider, GenerationRequest, JobStartResult, JobPollResult, JobStatusType } from './provider-interface'

// In-memory job store (in production, this would be in the database)
interface MockJob {
    id: string
    request: GenerationRequest
    status: JobStatusType
    progress: number
    startTime: number
    duration: number // how long the mock "generation" takes in ms
    outputVideoUrl?: string
    outputThumbnailUrl?: string
}

const jobs = new Map<string, MockJob>()

// Sample video URLs — hosted locally via /api/sample-video
// In production, real AI providers (Runway, Kling) return actual video URLs
const SAMPLE_VIDEOS = [
    '/api/sample-video?v=0',
    '/api/sample-video?v=1',
    '/api/sample-video?v=2',
    '/api/sample-video?v=3',
    '/api/sample-video?v=4',
]

// Thumbnail images to use as poster frames
const SAMPLE_THUMBNAILS = [
    '/templates/hiphop.png',
    '/templates/anime.png',
    '/templates/cyber.png',
    '/templates/retro.png',
    '/templates/kpop.png',
]

function generateMockId(): string {
    return `mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export class MockAIProvider implements AIProvider {
    readonly name = 'mock'

    async startJob(request: GenerationRequest): Promise<JobStartResult> {
        const jobId = generateMockId()
        const generationDuration = 10000 + Math.random() * 10000 // 10-20 seconds

        const job: MockJob = {
            id: jobId,
            request,
            status: 'queued',
            progress: 0,
            startTime: Date.now(),
            duration: generationDuration,
        }

        jobs.set(jobId, job)

        // Simulate starting after a brief delay
        setTimeout(() => {
            const j = jobs.get(jobId)
            if (j) {
                j.status = 'running'
            }
        }, 500)

        return {
            jobId,
            estimatedSeconds: Math.round(generationDuration / 1000),
        }
    }

    async pollJob(jobId: string): Promise<JobPollResult> {
        const job = jobs.get(jobId)

        if (!job) {
            return {
                status: 'failed',
                progress: 0,
                errorMessage: 'Job not found',
            }
        }

        const elapsed = Date.now() - job.startTime
        const progress = Math.min(100, Math.round((elapsed / job.duration) * 100))

        if (progress >= 100) {
            // Job complete — pick a random sample video
            const videoUrl = SAMPLE_VIDEOS[Math.floor(Math.random() * SAMPLE_VIDEOS.length)]

            job.status = 'succeeded'
            job.progress = 100
            const thumbnailUrl = SAMPLE_THUMBNAILS[Math.floor(Math.random() * SAMPLE_THUMBNAILS.length)]
            job.outputVideoUrl = videoUrl
            job.outputThumbnailUrl = thumbnailUrl

            return {
                status: 'succeeded',
                progress: 100,
                outputVideoUrl: videoUrl,
                outputThumbnailUrl: job.outputThumbnailUrl,
            }
        }

        job.progress = progress
        job.status = progress > 0 ? 'running' : 'queued'

        return {
            status: job.status,
            progress,
        }
    }

    async cancelJob(jobId: string): Promise<void> {
        jobs.delete(jobId)
    }
}
