import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  metadataBase: new URL('https://clipdrop.com'),
  title: 'ClipDrop — Create & Share AI Videos',
  description: 'Create stunning AI-generated short videos, record, and share with the world',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ClipDrop',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  openGraph: {
    title: 'ClipDrop — Create & Share AI Videos',
    description: 'Transform your vibes into viral videos with one click.',
    url: 'https://clipdrop.com',
    siteName: 'ClipDrop',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClipDrop — AI Video Generation',
    description: 'Create stunning AI-generated short videos.',
    images: ['/icon-512.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} bg-black text-white antialiased font-sans`}>
        {children}
      </body>
    </html>
  )
}
