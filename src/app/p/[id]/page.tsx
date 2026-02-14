import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PublicPostView } from './public-post-view'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('generations')
    .select(`
      *,
      profiles (display_name, username)
    `)
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (!post) {
    return {
      title: 'Post Not Found - ClipDrop',
    }
  }

  const title = post.caption
    ? `${post.caption} - ClipDrop`
    : `Video by @${post.profiles?.username || 'user'} - ClipDrop`

  return {
    title,
    description: post.caption || 'Check out this video on ClipDrop!',
    openGraph: {
      title,
      description: post.caption || 'Check out this video on ClipDrop!',
      type: 'video.other',
      images: post.thumbnail_url ? [post.thumbnail_url] : [],
      videos: post.output_video_url ? [{ url: post.output_video_url }] : [],
    },
    twitter: {
      card: 'player',
      title,
      description: post.caption || 'Check out this video on ClipDrop!',
      images: post.thumbnail_url ? [post.thumbnail_url] : [],
    },
  }
}

export default async function PublicPostPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('generations')
    .select(`
      *,
      profiles (id, display_name, username, avatar_url, is_private)
    `)
    .eq('id', id)
    .eq('is_published', true)
    .single()

  // Check if post exists and is accessible
  if (!post || post.profiles?.is_private) {
    notFound()
  }

  // Fetch music info if exists
  const { data: music } = await supabase
    .from('video_music')
    .select('*')
    .eq('generation_id', post.id)
    .single()

  return <PublicPostView post={post} music={music} />
}
