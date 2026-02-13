'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import {
  X,
  Link,
  Check,
  MessageCircle,
  Send,
  Twitter,
  Facebook,
  Linkedin,
  Share2,
} from 'lucide-react'

interface ShareSheetProps {
  open: boolean
  onClose: () => void
  url: string
  title: string
  videoUrl?: string
}

export function ShareSheet({ open, onClose, url, title, videoUrl }: ShareSheetProps) {
  const [copied, setCopied] = useState(false)

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  const handleNativeShare = async () => {
    if (!navigator.share) return

    try {
      const shareData: ShareData = {
        title: 'ClipDrop',
        text: title,
        url,
      }

      // Try to share video file if supported
      if (videoUrl && navigator.canShare) {
        try {
          const response = await fetch(videoUrl)
          const blob = await response.blob()
          const file = new File([blob], 'video.webm', { type: 'video/webm' })

          if (navigator.canShare({ files: [file] })) {
            shareData.files = [file]
          }
        } catch {
          // Fallback to URL sharing
        }
      }

      await navigator.share(shareData)
      onClose()
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share error:', err)
      }
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-600',
      url: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-blue-500',
      url: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
    {
      name: 'X',
      icon: Twitter,
      color: 'bg-black border border-gray-700',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
  ]

  return (
    <Dialog.Root open={open} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-2xl p-4 pb-8 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-white">
              Share
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon">
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Native share button (mobile) */}
          {canNativeShare && (
            <Button
              variant="primary"
              className="w-full mb-4"
              onClick={handleNativeShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share via...
            </Button>
          )}

          {/* Social share buttons */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {shareLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2"
              >
                <div
                  className={`w-12 h-12 rounded-full ${social.color} flex items-center justify-center`}
                >
                  <social.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-gray-400">{social.name}</span>
              </a>
            ))}
          </div>

          {/* Copy link */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Or copy link</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 truncate">
                {url}
              </div>
              <Button
                variant={copied ? 'primary' : 'secondary'}
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
