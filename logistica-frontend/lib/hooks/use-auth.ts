"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api/endpoints/auth"
import { useAuthStore } from "@/lib/stores/auth.store"
import type { LoginPayload } from "@/lib/types/auth"

export function useLogin() {
  const router = useRouter()
  const setTokens = useAuthStore((s) => s.setTokens)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function login(payload: LoginPayload) {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await authApi.login(payload)
      setTokens({
        accessToken: data.access,
        refreshToken: data.refresh,
        user: { username: data.username, email: data.email, is_superuser: data.is_superuser },
      })
      router.push("/dashboard")
    } catch {
      setError("Credenciales incorrectas")
    } finally {
      setIsLoading(false)
    }
  }

  return { login, error, isLoading }
}

export function useLogout() {
  const router = useRouter()
  const clear = useAuthStore((s) => s.clear)

  function logout() {
    clear()
    router.replace("/login")
  }

  return { logout }
}
