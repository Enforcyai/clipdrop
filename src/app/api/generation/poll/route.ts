import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProvider } from '@/lib/ai'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()

        // Verify auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const generationId = searchParams.get('id')

        if (!generationId) {
            return NextResponse.json({ error: 'Missing generation id' }, { status: 400 })
        }

        // Fetch generation
        const { data: generation, error: genError } = await supabase
            .from('generations')
            .select('*')
            .eq('id', generationId)
            .eq('user_id', user.id)
            .single()

        if (genError || !generation) {
            return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
        }

        // If already completed or failed, return current state
        if (generation.status === 'succeeded' || generation.status === 'failed') {
            return NextResponse.json({
                status: generation.status,
                progress: generation.progress,
                outputVideoUrl: generation.output_video_url,
                outputThumbnailUrl: generation.thumbnail_url,
                errorMessage: generation.error_message,
            })
        }

        // Poll the provider
        const provider = getProvider()
        const providerJobId = generation.provider_job_id

        if (!providerJobId) {
            return NextResponse.json({
                status: 'pending',
                progress: 0,
            })
        }

        const pollResult = await provider.pollJob(providerJobId)

        // Update generation in DB
        const updateData: Record<string, unknown> = {
            status: pollResult.status === 'running' ? 'processing' : pollResult.status,
            progress: pollResult.progress,
        }

        if (pollResult.outputVideoUrl) {
            updateData.output_video_url = pollResult.outputVideoUrl
        }
        if (pollResult.outputThumbnailUrl) {
            updateData.thumbnail_url = pollResult.outputThumbnailUrl
        }
        if (pollResult.errorMessage) {
            updateData.error_message = pollResult.errorMessage
        }

        await supabase
            .from('generations')
            .update(updateData)
            .eq('id', generationId)

        return NextResponse.json({
            status: pollResult.status === 'running' ? 'processing' : pollResult.status,
            progress: pollResult.progress,
            outputVideoUrl: pollResult.outputVideoUrl,
            outputThumbnailUrl: pollResult.outputThumbnailUrl,
            errorMessage: pollResult.errorMessage,
        })
    } catch (error) {
        console.error('Poll generation error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
