import { AIProvider, GenerationRequest, JobStartResult, JobPollResult } from './provider-interface'

/**
 * Mock implementation of AIProvider for development.
 * Simulates video generation with a delay and pre-defined output.
 */
export class MockAIProvider implements AIProvider {
    readonly name = 'mock'

    async startJob(request: GenerationRequest): Promise<JobStartResult> {
        console.log('MockAIProvider: Starting job for prompt:', request.prompt)

        // Return a deterministic mock jobId
        return {
            jobId: `mock_${Date.now()}`,
            estimatedSeconds: 10
        }
    }

    async pollJob(jobId: string): Promise<JobPollResult> {
        console.log('MockAIProvider: Polling job:', jobId)

        // Simulate progress based on timestamp
        const startTime = parseInt(jobId.split('_')[1])
        const elapsed = (Date.now() - startTime) / 1000

        if (elapsed >= 10) {
            return {
                status: 'succeeded',
                progress: 100,
                outputVideoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
            }
        }

        return {
            status: 'running',
            progress: Math.min(Math.round((elapsed / 10) * 100), 99)
        }
    }
}
