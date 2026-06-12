"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Truck, Package, Map, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useLogin } from "@/lib/hooks/use-auth"

const loginSchema = z.object({
  username: z.string().min(1, "Requerido"),
  password: z.string().min(1, "Requerido"),
})

type LoginFormValues = z.infer<typeof loginSchema>

const FEATURES = [
  { icon: Package, text: "Gestión de envíos y rutas en tiempo real" },
  { icon: Map,     text: "Rutas optimizadas con paradas inteligentes" },
  { icon: Users,   text: "Conductores, flota y clientes centralizados" },
]

export default function LoginPage() {
  const { login, error, isLoading } = useLogin()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  })

  async function onSubmit(values: LoginFormValues) {
    await login(values)
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo — branding (solo desktop) ── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] shrink-0 flex-col justify-between bg-slate-900 p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 shadow-lg shadow-blue-500/30">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">LogisticaWeb</span>
        </div>

        <div className="space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">
              Logística inteligente<br />para LATAM
            </h1>
            <p className="max-w-xs text-base leading-relaxed text-slate-400">
              Gestiona envíos, rutas y flota desde una sola plataforma. Simple, rápido, confiable.
            </p>
          </div>

          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-800">
                  <Icon className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-sm text-slate-300">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-600">© 2025 LogisticaWeb. Todos los derechos reservados.</p>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 lg:px-16">

        {/* Logo mobile */}
        <div className="mb-10 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/30">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-foreground">LogisticaWeb</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8 space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Bienvenido</h2>
            <p className="text-sm text-muted-foreground">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="tu_usuario"
                        autoComplete="username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="rounded-md border border-destructive/25 bg-destructive/8 px-3 py-2.5">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? "Iniciando sesión…" : "Iniciar sesión"}
              </Button>
            </form>
          </Form>
        </div>
      </div>

    </div>
  )
}
