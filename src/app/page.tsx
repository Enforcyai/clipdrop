'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Video, Zap } from 'lucide-react'
import Link from 'next/link'

export default function SplashPage() {
  const router = useRouter()

  useEffect(() => {
    // If already logged in, redirect to feed
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.replace('/feed')
      }
    }
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-pink-600/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm text-center space-y-8">
        {/* Logo */}
        <div className="space-y-4 animate-fade-in">
          <div className="w-24 h-24 mx-auto rounded-[2rem] bg-gray-900 border border-gray-800 p-0.5 shadow-2xl shadow-purple-500/10 overflow-hidden">
            <img src="/icon-512.png" alt="ClipDrop Logo" className="w-full h-full object-cover rounded-[1.9rem]" />
          </div>
          <div>
            <h1 className="text-4xl font-bold gradient-text">ClipDrop</h1>
            <p className="text-gray-400 mt-2 text-lg">AI-Powered Short Videos</p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3 text-left">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-900/50 border border-gray-800">
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">AI Video Generation</p>
              <p className="text-xs text-gray-500">Create stunning videos from text, images, or clips</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-900/50 border border-gray-800">
            <div className="w-10 h-10 rounded-lg bg-pink-600/20 flex items-center justify-center shrink-0">
              <Video className="h-5 w-5 text-pink-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Record & Share</p>
              <p className="text-xs text-gray-500">Capture videos and share them with your audience</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-900/50 border border-gray-800">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Templates Library</p>
              <p className="text-xs text-gray-500">Browse dance, anime, cyber, and retro templates</p>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="space-y-3">
          <Link
            href="/signup"
            className="block w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-center transition-all hover:from-purple-700 hover:to-pink-700 active:scale-[0.98] shadow-lg shadow-purple-600/25"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="block w-full py-3.5 rounded-xl border border-gray-700 text-gray-300 font-medium text-center transition-all hover:bg-gray-900 active:scale-[0.98]"
          >
            I already have an account
          </Link>
        </div>

        <p className="text-xs text-gray-600">
          100% free — no credit card required
        </p>
      </div>
    </div>
  )
}
