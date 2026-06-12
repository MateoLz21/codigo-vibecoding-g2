"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth.store"
import { Providers } from "@/providers"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const hasHydrated = useAuthStore((s) => s._hasHydrated)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (hasHydrated && !accessToken && !refreshToken) {
      router.replace("/login")
    }
  }, [hasHydrated, accessToken, refreshToken, router])

  if (!hasHydrated) return null
  if (!accessToken && !refreshToken) return null

  return (
    <Providers>
      <div className="flex h-dvh overflow-hidden">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </Providers>
  )
}
