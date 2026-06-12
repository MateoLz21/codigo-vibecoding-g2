"use client"

import { useRouter } from "next/navigation"
import { Menu, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuthStore } from "@/lib/stores/auth.store"
import { useLogout } from "@/lib/hooks/use-auth"

interface HeaderProps {
  onMenuToggle?: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const user = useAuthStore((s) => s.user)
  const { logout } = useLogout()
  const router = useRouter()

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "U"

  const displayName = user?.email || user?.username || "Usuario"

  return (
    <header className="flex h-14 items-center border-b bg-background px-4 md:px-6 gap-4">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden shrink-0"
        onClick={onMenuToggle}
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="hidden sm:flex flex-col items-end leading-none">
          <span className="text-sm font-medium text-foreground">{user?.username ?? "Usuario"}</span>
          {user?.email && (
            <span className="text-xs text-muted-foreground">{user.email}</span>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Menú de usuario"
            className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs cursor-pointer">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal py-2">
                <p className="text-sm font-semibold leading-none">{user?.username ?? "Usuario"}</p>
                <p className="text-xs text-muted-foreground mt-1">{displayName}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="h-4 w-4" />
                Perfil
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
