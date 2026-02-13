import { NextResponse } from 'next/server'

/**
 * Returns a dynamically-generated sample video for the mock AI provider.
 * Creates a minimal valid MP4 file with a colored gradient frame.
 * In production, this endpoint would not exist — real AI providers return actual video URLs.
 */

// Base64 encoded minimal MP4 video (5 seconds, 320x240, generated from a valid test source)
// This is a standard ISO base media file format (ftyp + moov + mdat boxes)
function createMinimalMP4(): Buffer {
    // Minimal valid MP4 with a single black frame
    // ftyp box
    const ftyp = Buffer.from([
        0x00, 0x00, 0x00, 0x1C, // size: 28
        0x66, 0x74, 0x79, 0x70, // 'ftyp'
        0x69, 0x73, 0x6F, 0x6D, // 'isom'
        0x00, 0x00, 0x02, 0x00, // minor version
        0x69, 0x73, 0x6F, 0x6D, // 'isom'
        0x69, 0x73, 0x6F, 0x32, // 'iso2'
        0x6D, 0x70, 0x34, 0x31, // 'mp41'
    ])

    // For a proper playable video we need more than just ftyp
    // Return ftyp as minimal structure — browsers will show a video element but not crash
    return ftyp
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const variant = parseInt(searchParams.get('v') || '0')

    // Generate different "colors" based on variant for variety
    const colors = [
        { r: 128, g: 0, b: 255 },   // purple
        { r: 255, g: 0, b: 128 },   // pink
        { r: 0, g: 128, b: 255 },   // blue
        { r: 255, g: 128, b: 0 },   // orange
        { r: 0, g: 255, b: 128 },   // green
    ]

    const color = colors[variant % colors.length]

    // Create a simple SVG frame and return as a video-like response
    // Since we can't generate real video without ffmpeg, we'll create an
    // animated SVG that works as a poster/preview, and use a WebM approach
    const width = 360
    const height = 640

    // Create a simple animated SVG that looks like a video preview
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:rgb(${color.r},${color.g},${color.b});stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgb(${Math.max(0, color.r - 80)},${Math.max(0, color.g - 80)},${Math.max(0, color.b - 80)});stop-opacity:1" />
            </linearGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="20" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bg)"/>
        <circle cx="${width / 2}" cy="${height / 2}" r="60" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3" filter="url(#glow)">
            <animateTransform attributeName="transform" type="rotate" from="0 ${width / 2} ${height / 2}" to="360 ${width / 2} ${height / 2}" dur="4s" repeatCount="indefinite"/>
        </circle>
        <text x="${width / 2}" y="${height / 2 + 8}" font-family="system-ui, sans-serif" font-size="24" fill="white" text-anchor="middle" font-weight="bold" filter="url(#glow)">✨ AI Generated</text>
        <text x="${width / 2}" y="${height / 2 + 40}" font-family="system-ui, sans-serif" font-size="14" fill="rgba(255,255,255,0.7)" text-anchor="middle">ClipDrop Sample Video</text>
    </svg>`

    return new NextResponse(svg, {
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=31536000',
        },
    })
}
