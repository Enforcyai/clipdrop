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
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${isActive ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              {label === 'Create' ? (
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center -mt-2 ${isActive
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                    : 'bg-gray-800'
                  }`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              ) : (
                <Icon className="h-5 w-5" />
              )}
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
