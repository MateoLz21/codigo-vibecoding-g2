"use client"

import { LogOut, Shield, User } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/stores/auth.store"
import { useLogout } from "@/lib/hooks/use-auth"

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const { logout } = useLogout()

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "U"

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Perfil</h1>

      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <Avatar className="h-20 w-20 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-xl font-semibold">{user?.username ?? "—"}</h2>
              <p className="text-sm text-muted-foreground">Administrador del sistema</p>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Sesión activa
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <User className="h-4 w-4" />
            Información de cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <dl className="divide-y divide-border">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0 py-3 first:pt-0 last:pb-0">
              <dt className="text-sm text-muted-foreground sm:w-40 shrink-0">Usuario</dt>
              <dd className="text-sm font-medium">{user?.username ?? "—"}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0 py-3">
              <dt className="text-sm text-muted-foreground sm:w-40 shrink-0">Rol</dt>
              <dd className="text-sm font-medium">Administrador</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0 py-3 last:pb-0">
              <dt className="text-sm text-muted-foreground sm:w-40 shrink-0">Estado</dt>
              <dd className="text-sm font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Activo
                </span>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Shield className="h-4 w-4" />
            Sesión
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <p className="text-sm text-muted-foreground mb-4">
            Cierra tu sesión en este dispositivo y vuelve al inicio de sesión.
          </p>
          <Button variant="destructive" onClick={logout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
