import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProvider, checkPromptSafety } from '@/lib/ai'
import { GenerationMode, VideoStyle, AspectRatio, Intensity } from '@/types/database'

interface StartGenerationBody {
    mode: Exclude<GenerationMode, 'recorded'>
    prompt: string
    duration: number
    style: VideoStyle
    aspectRatio: AspectRatio
    intensity: Intensity
    templateId?: string
    inputAssetUrl?: string
    // Creative Studio fields
    audioId?: string
    overlayId?: string
    textOverlay?: string
    textStyleId?: string
}

// Credits are disabled — all generations are free

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // Verify auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body: StartGenerationBody = await request.json()

        // Validate required fields
        if (!body.mode || !body.prompt || !body.duration) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Validate mode
        const validModes = ['text2video', 'image2video', 'video2video']
        if (!validModes.includes(body.mode)) {
            return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
        }

        // Content safety check
        const safetyResult = checkPromptSafety(body.prompt)
        if (!safetyResult.safe) {
            return NextResponse.json({ error: safetyResult.reason }, { status: 400 })
        }

        // All generations are free — no credit check needed

        // Create generation record
        const { data: generation, error: genError } = await supabase
            .from('generations')
            .insert({
                user_id: user.id,
                mode: body.mode,
                prompt: body.prompt,
                template_id: body.templateId || null,
                input_asset_url: body.inputAssetUrl || null,
                status: 'pending',
                progress: 0,
                settings: {
                    duration: body.duration,
                    style: body.style,
                    aspect_ratio: body.aspectRatio,
                    intensity: body.intensity,
                    audio_id: body.audioId,
                    overlay_id: body.overlayId,
                    text_overlay: body.textOverlay,
                    text_style_id: body.textStyleId,
                },
            })
            .select()
            .single()

        if (genError || !generation) {
            console.error('Supabase generation insert error:', genError)
            return NextResponse.json({ error: 'Failed to create generation record' }, { status: 500 })
        }

        // Start the AI job
        const provider = getProvider()
        try {
            const jobResult = await provider.startJob({
                mode: body.mode,
                prompt: body.prompt,
                duration: body.duration,
                style: body.style,
                aspectRatio: body.aspectRatio,
                intensity: body.intensity,
                templateId: body.templateId,
                inputAssetUrl: body.inputAssetUrl,
            })

            // Update generation with provider job ID
            await supabase
                .from('generations')
                .update({
                    provider_job_id: jobResult.jobId,
                    status: 'processing',
                })
                .eq('id', generation.id)

            return NextResponse.json({
                generationId: generation.id,
                jobId: jobResult.jobId,
                estimatedSeconds: jobResult.estimatedSeconds,
            })
        } catch (providerError) {
            console.error('AI Provider startJob error:', providerError)
            // Update generation to failed
            await supabase
                .from('generations')
                .update({
                    status: 'failed',
                    error_message: providerError instanceof Error ? providerError.message : String(providerError),
                })
                .eq('id', generation.id)

            return NextResponse.json({
                error: 'AI service failed to start',
                details: providerError instanceof Error ? providerError.message : String(providerError)
            }, { status: 500 })
        }
    } catch (error) {
        console.error('Global start generation error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
