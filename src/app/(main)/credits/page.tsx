'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Sparkles, Infinity, Check, Zap, Film, Wand2 } from 'lucide-react'

export default function CreditsPage() {
    const router = useRouter()

    const features = [
        { icon: Sparkles, label: 'Unlimited AI generations' },
        { icon: Film, label: 'All video durations' },
        { icon: Wand2, label: 'All templates & styles' },
        { icon: Zap, label: 'No credit limits' },
    ]

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-gray-800">
                <div className="flex items-center justify-between p-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="font-semibold">Plan</h1>
                    <div className="w-10" />
                </div>
            </div>

            <div className="p-4 pb-24 max-w-lg mx-auto">
                {/* Hero */}
                <div className="text-center py-8 space-y-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto">
                        <Infinity className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Everything is Free</h2>
                    <p className="text-gray-400 max-w-xs mx-auto">
                        Enjoy unlimited access to all ClipDrop features — no credits, no limits, no paywalls.
                    </p>
                </div>

                {/* Features */}
                <Card className="mt-4">
                    <CardContent className="p-6">
                        <ul className="space-y-4">
                            {features.map((feature) => (
                                <li key={feature.label} className="flex items-center gap-3 text-gray-200">
                                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                        <Check className="h-4 w-4 text-green-400" />
                                    </div>
                                    <span className="text-sm">{feature.label}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* CTA */}
                <div className="mt-8 text-center">
                    <Button
                        variant="primary"
                        size="xl"
                        className="w-full"
                        onClick={() => router.push('/create/ai')}
                    >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Start Creating
                    </Button>
                </div>
            </div>
        </div>
    )
}
