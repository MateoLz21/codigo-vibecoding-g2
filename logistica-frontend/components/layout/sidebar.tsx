"use client"

import { useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Warehouse,
  Factory,
  Users,
  Truck,
  UserCheck,
  Package,
  Map,
  Send,
  ShieldCheck,
  Key,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/stores/auth.store"
import { useMe } from "@/lib/hooks/use-me"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  permission?: string
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",  label: "Dashboard",   icon: LayoutDashboard },
  { href: "/warehouses", label: "Almacenes",    icon: Warehouse,  permission: "view_warehouse" },
  { href: "/suppliers",  label: "Proveedores",  icon: Factory,    permission: "view_supplier"  },
  { href: "/customers",  label: "Clientes",     icon: Users,      permission: "view_customer"  },
  { href: "/transport",  label: "Transporte",   icon: Truck,      permission: "view_transport" },
  { href: "/drivers",    label: "Conductores",  icon: UserCheck,  permission: "view_driver"    },
  { href: "/products",   label: "Productos",    icon: Package,    permission: "view_product"   },
  { href: "/routes",     label: "Rutas",        icon: Map,        permission: "view_route"     },
  { href: "/shipments",  label: "Envíos",       icon: Send,       permission: "view_shipment"  },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const isSuperAdmin = useAuthStore((s) => s.user?.is_superuser ?? false)
  const { data: me } = useMe()

  const allowedCodenames = useMemo(() => {
    if (isSuperAdmin) return null
    if (!me) return new Set<string>()
    const codenames = me.groups.flatMap((g) => g.permissions.map((p) => p.codename))
    return new Set(codenames)
  }, [isSuperAdmin, me])

  function canSee(item: NavItem) {
    if (!item.permission) return true
    if (isSuperAdmin) return true
    if (!allowedCodenames) return true
    return allowedCodenames.has(item.permission)
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex h-dvh w-56 flex-col border-r bg-sidebar transition-transform duration-300 ease-in-out",
        "md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary">
          <Truck className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold tracking-tight text-sidebar-foreground">LogisticaWeb</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.filter(canSee).map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
          {isSuperAdmin && (
            <>
              <li>
                <Link
                  href="/users"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname.startsWith("/users")
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  Usuarios
                </Link>
              </li>
              <li>
                <Link
                  href="/roles"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname.startsWith("/roles")
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Key className="h-4 w-4 shrink-0" />
                  Roles
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </aside>
  )
}
