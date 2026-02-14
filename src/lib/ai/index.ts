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
import { FalAIProvider } from './fal-provider'
import { MockAIProvider } from './mock-provider'

// Exported for use elsewhere
export { checkPromptSafety } from './content-safety'
export type { AIProvider, GenerationRequest, JobStartResult, JobPollResult } from './provider-interface'

let providerInstance: AIProvider | null = null

export function getProvider(): AIProvider {
    if (providerInstance) return providerInstance

    const providerType = process.env.AI_PROVIDER || 'mock'

    if (providerType === 'fal' && process.env.FAL_KEY) {
        providerInstance = new FalAIProvider(process.env.FAL_KEY)
    } else {
        if (providerType === 'fal' && !process.env.FAL_KEY) {
            console.warn('FAL_KEY is skip, falling back to MockAIProvider for development.')
        }
        providerInstance = new MockAIProvider()
    }

    return providerInstance
}
