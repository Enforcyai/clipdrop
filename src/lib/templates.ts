export interface FunnyTemplate {
    id: string
    name: string
    description: string
    category: string
    videoUrl: string
    previewUrl: string
    compositionType: 'pip' | 'overlay' | 'background'
    tags: string[]
}

export const FUNNY_TEMPLATES: FunnyTemplate[] = [
    {
        id: 'funny-1',
        name: 'Dancing Cat',
        description: 'Add your reaction to this viral dancing cat!',
        category: 'Funny',
        videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', // Mock video
        previewUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&h=600',
        compositionType: 'pip',
        tags: ['funny', 'cat', 'dance']
    },
    {
        id: 'funny-2',
        name: 'Epic Fail Reaction',
        description: 'React to some of the most epic fails of all time.',
        category: 'Funny',
        videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', // Mock video
        previewUrl: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=400&h=600',
        compositionType: 'background',
        tags: ['fail', 'reaction', 'comedy']
    }
]
