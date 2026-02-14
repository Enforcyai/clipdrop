import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json()

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional cinematic video director and prompt engineer. Your task is to take a simple video generation prompt and enhance it into a highly detailed, cinematic, and visually stunning description. Focus on lighting, camera movement, textures, and atmosphere. Keep the result under 70 words. Output ONLY the enhanced prompt text.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 150,
        })

        const enhancedPrompt = response.choices[0]?.message?.content?.trim()

        return NextResponse.json({ enhancedPrompt })
    } catch (error: any) {
        console.error('OpenAI Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to enhance prompt' }, { status: 500 })
    }
}
