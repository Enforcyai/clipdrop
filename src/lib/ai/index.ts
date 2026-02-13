/**
 * AI Provider Factory
 *
 * Returns the configured AI video generation provider.
 * To switch providers, change the implementation returned here.
 *
 * Environment variable: AI_PROVIDER (default: 'mock')
 * When real providers are integrated, add cases for 'runway', 'kling', etc.
 */

import { AIProvider } from './provider-interface'
import { MockAIProvider } from './mock-provider'
import { FalAIProvider } from './fal-provider'

// Exported for use elsewhere
export { checkPromptSafety } from './content-safety'
export type { AIProvider, GenerationRequest, JobStartResult, JobPollResult } from './provider-interface'

let providerInstance: AIProvider | null = null

export function getProvider(): AIProvider {
    if (providerInstance) return providerInstance

    const providerName = process.env.AI_PROVIDER || 'mock'

    switch (providerName) {
        case 'fal':
            if (!process.env.FAL_KEY) {
                console.warn('FAL_KEY is not set. Falling back to mock.')
                providerInstance = new MockAIProvider()
            } else {
                providerInstance = new FalAIProvider(process.env.FAL_KEY)
            }
            break
        case 'mock':
        default:
            providerInstance = new MockAIProvider()
            break
    }

    return providerInstance!
}
