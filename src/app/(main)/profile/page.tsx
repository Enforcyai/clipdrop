'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { VideoPlayer } from '@/components/video/video-player'
import { createClient } from '@/lib/supabase/client'
import { Generation, Profile } from '@/types/database'
import {
  Settings,
  LogOut,
  Zap,
  Crown,
  Lock,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
} from 'lucide-react'

type TabType = 'all' | 'published' | 'drafts'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [showSettings, setShowSettings] = useState(false)
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData as unknown as Profile)
        setNewUsername(profileData.username || '')
      }

      const { data: genData } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'succeeded')
        .order('created_at', { ascending: false })

      if (genData) {
        setGenerations(genData as unknown as Generation[])
      }

      setLoading(false)
    }
    fetchProfile()
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleUpdateUsername = async () => {
    if (!profile || !newUsername.trim()) return
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ username: newUsername.trim() })
      .eq('id', profile.id)

    if (!error) {
      setProfile({ ...profile, username: newUsername.trim() })
      setEditingUsername(false)
    }
  }

  const filteredGenerations = generations.filter((g) => {
    if (activeTab === 'published') return g.is_published
    if (activeTab === 'drafts') return !g.is_published
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-white">Profile</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Profile info */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl font-bold text-white">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              (profile?.username?.[0] || profile?.display_name?.[0] || '?').toUpperCase()
            )}
          </div>
          <div className="flex-1">
            {editingUsername ? (
              <div className="flex items-center gap-2">
                <input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white"
                  autoFocus
                />
                <Button variant="primary" size="sm" onClick={handleUpdateUsername}>Save</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingUsername(false)}>Cancel</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  @{profile?.username || 'user'}
                </h2>
                <button onClick={() => setEditingUsername(true)}>
                  <Edit2 className="h-3.5 w-3.5 text-gray-500 hover:text-gray-300" />
                </button>
              </div>
            )}
            <p className="text-sm text-gray-400">{profile?.display_name || 'ClipDrop User'}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-white">{generations.length}</p>
            <p className="text-xs text-gray-500">Videos</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-white">{generations.filter((g) => g.is_published).length}</p>
            <p className="text-xs text-gray-500">Published</p>
          </div>
          <div className="bg-gradient-to-br from-green-600/10 to-emerald-600/10 border border-green-600/20 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-green-400 flex items-center justify-center gap-1">
              ∞
            </p>
            <p className="text-xs text-gray-500">Free Plan</p>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <Card className="animate-scale-in">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-medium text-gray-300">Settings</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {profile?.is_private ? (
                    <Lock className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-400">Private Account</span>
                </div>
                <button
                  onClick={async () => {
                    if (!profile) return
                    const supabase = createClient()
                    const newPrivacy = !profile.is_private
                    await supabase
                      .from('profiles')
                      .update({ is_private: newPrivacy })
                      .eq('id', profile.id)
                    setProfile({ ...profile, is_private: newPrivacy })
                  }}
                  className={`w-12 h-6 rounded-full transition-colors ${profile?.is_private ? 'bg-purple-600' : 'bg-gray-700'
                    }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${profile?.is_private ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                </button>
              </div>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                    alert('Account deletion requires server-side implementation. Contact support.')
                  }
                }}
                className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {[
          { key: 'all' as const, label: 'All', icon: null },
          { key: 'published' as const, label: 'Published', icon: Eye },
          { key: 'drafts' as const, label: 'Drafts', icon: EyeOff },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors border-b-2 ${activeTab === key
              ? 'text-white border-purple-500'
              : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {label}
          </button>
        ))}
      </div>

      {/* Videos grid */}
      <div className="p-2">
        {filteredGenerations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {activeTab === 'drafts' ? 'No drafts' : activeTab === 'published' ? 'No published videos' : 'No videos yet'}
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-3"
              onClick={() => router.push('/create')}
            >
              Create Your First Video
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {filteredGenerations.map((gen) => (
              <Link
                key={gen.id}
                href={`/create/result/${gen.id}`}
                className="aspect-[9/16] relative group"
              >
                {gen.output_video_url ? (
                  <video
                    src={gen.output_video_url}
                    poster={gen.thumbnail_url || undefined}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                ) : gen.thumbnail_url ? (
                  <img src={gen.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-600 text-2xl">🎬</span>
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

                {/* Badges */}
                {!gen.is_published && (
                  <div className="absolute top-1 left-1 bg-black/60 text-[10px] text-gray-300 px-1.5 py-0.5 rounded">
                    Draft
                  </div>
                )}
                {gen.mode !== 'recorded' && (
                  <div className="absolute top-1 right-1 text-[10px]">✨</div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
