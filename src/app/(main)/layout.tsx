import { BottomNav } from '@/components/layout/bottom-nav'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black">
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}
