/**
 * Basic Content Safety Filter
 *
 * Scans prompts for blocked keywords related to violence, sexual content, etc.
 * This is a simple keyword-based filter. In production, integrate with
 * a dedicated content moderation API (OpenAI Moderation, Google SafeSearch, etc.)
 */

const BLOCKED_PATTERNS = [
    // Violence
    /\b(kill|murder|assault|attack|stab|shoot|blood|gore|violent|weapon|gun|knife|bomb|explod)/i,
    // Sexual content
    /\b(nude|naked|porn|sex|erotic|nsfw|hentai|xxx|strip|undress)/i,
    // Hate/discrimination
    /\b(racist|racial slur|hate speech|supremac)/i,
    // Self-harm
    /\b(suicide|self.?harm|cut my|hurt myself)/i,
    // Child safety
    /\b(child abuse|minor|underage)/i,
]

export interface SafetyCheckResult {
    safe: boolean
    reason?: string
}

export function checkPromptSafety(prompt: string): SafetyCheckResult {
    if (!prompt || prompt.trim().length === 0) {
        return { safe: false, reason: 'Prompt is empty' }
    }

    if (prompt.length > 1000) {
        return { safe: false, reason: 'Prompt is too long (max 1000 characters)' }
    }

    for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(prompt)) {
            return {
                safe: false,
                reason: 'Your prompt contains content that violates our community guidelines. Please rephrase and try again.'
            }
        }
    }

    return { safe: true }
}
