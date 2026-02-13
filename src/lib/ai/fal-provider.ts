import { fal } from '@fal-ai/client'
import {
    AIProvider,
    GenerationRequest,
    JobPollResult,
    JobStartResult,
    JobStatusType
} from './provider-interface'

/**
 * Fal.ai Implementation of the AIProvider interface.
 * Accesses high-quality video models like Kling and Luma Dream Machine.
 */
export class FalAIProvider implements AIProvider {
    readonly name = 'fal'

    constructor(private apiKey: string) {
        // Configure fal client with the API key
        fal.config({
            credentials: this.apiKey
        })
    }

    private getModelId(mode: string): string {
        switch (mode) {
            case 'text2video':
                return 'fal-ai/luma-dream-machine'
            case 'image2video':
                return 'fal-ai/luma-dream-machine/image-to-video'
            case 'video2video':
                return 'fal-ai/luma-dream-machine'
            default:
                return 'fal-ai/luma-dream-machine'
        }
    }

    async startJob(request: GenerationRequest): Promise<JobStartResult> {
        const modelId = this.getModelId(request.mode)

        const input: Record<string, any> = {
            prompt: request.prompt,
            aspect_ratio: request.aspectRatio === '9:16' ? '9:16' : (request.aspectRatio === '16:9' ? '16:9' : '1:1'),
            loop: false,
        }

        if (request.mode === 'image2video' && request.inputAssetUrl) {
            input.image_url = request.inputAssetUrl
        }

        try {
            const { request_id } = await fal.queue.submit(modelId, {
                input
            })

            // Store both modelId and request_id in the jobId so we can poll correctly
            return {
                jobId: `${modelId}:${request_id}`,
                estimatedSeconds: 60
            }
        } catch (error) {
            console.error('Fal.ai startJob error:', error)
            throw new Error(`Failed to start job on Fal.ai: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    async pollJob(jobId: string): Promise<JobPollResult> {
        try {
            const [modelId, requestId] = jobId.split(':')

            if (!modelId || !requestId) {
                throw new Error('Invalid jobId format. Expected modelId:requestId')
            }

            const status = await fal.queue.status(modelId, { requestId })

            const result: JobPollResult = {
                status: this.mapStatus(status.status),
                progress: 0
            }

            if (status.status === 'COMPLETED') {
                const jobResult = await fal.queue.result(modelId, { requestId })

                result.progress = 100
                if (jobResult.data && typeof jobResult.data === 'object') {
                    const data = jobResult.data as any
                    result.outputVideoUrl = data.video?.url
                    if (!result.outputVideoUrl && data.video_url) result.outputVideoUrl = data.video_url
                }
            } else if (status.status === 'IN_PROGRESS') {
                result.progress = 50
            }

            return result
        } catch (error) {
            console.error('Fal.ai pollJob error:', error)
            return {
                status: 'failed',
                progress: 0,
                errorMessage: error instanceof Error ? error.message : String(error)
            }
        }
    }

    private mapStatus(falStatus: string): JobStatusType {
        switch (falStatus) {
            case 'IN_QUEUE':
                return 'queued'
            case 'IN_PROGRESS':
                return 'running'
            case 'COMPLETED':
                return 'succeeded'
            case 'FAILED':
                return 'failed'
            default:
                return 'failed'
        }
    }
}
