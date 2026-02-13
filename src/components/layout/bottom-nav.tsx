'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Plus, LayoutGrid, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/feed', icon: Home, label: 'Feed' },
  { href: '/create', icon: Plus, label: 'Create' },
  { href: '/templates', icon: LayoutGrid, label: 'Templates' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur border-t border-gray-800 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1.5 px-3 py-1 rounded-xl transition-all duration-300 ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              {label === 'Create' ? (
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center -mt-6 shadow-xl transition-transform active:scale-95 ${isActive
                    ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 shadow-purple-500/25 ring-2 ring-purple-500/20'
                    : 'bg-gray-800'
                  }`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              ) : (
                <div className="relative">
                  <Icon className={`h-6 w-6 transition-colors ${isActive ? 'text-purple-400' : ''}`} />
                  {isActive && (
                    <div className="absolute -inset-2 bg-purple-500/10 blur-lg rounded-full -z-10" />
                  )}
                </div>
              )}
              <span className={`text-[10px] font-semibold tracking-wide transition-colors ${isActive ? 'text-purple-400' : 'text-gray-500'
                }`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
