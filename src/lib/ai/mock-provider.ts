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
        const startTime = Date.now()
        const generationDuration = 15000 // Fixed 15s for consistency in mock

        // Encode state into jobId: mock_v1_[startTime]_[duration]_[random]
        const jobId = `mock_v1_${startTime}_${generationDuration}_${Math.random().toString(36).slice(2, 7)}`

        return {
            jobId,
            estimatedSeconds: Math.round(generationDuration / 1000),
        }
    }

    async pollJob(jobId: string): Promise<JobPollResult> {
        // Parse state from jobId
        const parts = jobId.split('_')
        if (parts[0] !== 'mock' || parts[1] !== 'v1') {
            return {
                status: 'failed',
                progress: 0,
                errorMessage: 'Invalid mock job ID',
            }
        }

        const startTime = parseInt(parts[2])
        const duration = parseInt(parts[3])

        if (isNaN(startTime) || isNaN(duration)) {
            return {
                status: 'failed',
                progress: 0,
                errorMessage: 'Job not found (invalid state)',
            }
        }

        const elapsed = Date.now() - startTime
        const progress = Math.min(100, Math.round((elapsed / duration) * 100))

        if (progress >= 100) {
            // Pick a deterministic sample based on startTime so it doesn't flip-flop
            const videoIndex = startTime % SAMPLE_VIDEOS.length
            const thumbIndex = startTime % SAMPLE_THUMBNAILS.length

            return {
                status: 'succeeded',
                progress: 100,
                outputVideoUrl: SAMPLE_VIDEOS[videoIndex],
                outputThumbnailUrl: SAMPLE_THUMBNAILS[thumbIndex],
            }
        }

        return {
            status: progress > 0 ? 'running' : 'queued',
            progress,
        }
    }

    async cancelJob(jobId: string): Promise<void> {
        jobs.delete(jobId)
    }
}
