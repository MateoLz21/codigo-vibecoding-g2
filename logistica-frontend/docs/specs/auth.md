# Spec: Auth

## Context

Módulo de autenticación. Maneja login JWT, almacenamiento de tokens, logout y el shell del dashboard (sidebar + header) que usarán todos los demás módulos. Es el primero en construirse porque todos los módulos CRUD viven dentro del dashboard shell.

## Backend contract

```
POST /api/v1/auth/token/         {username, password} → {access, refresh}
POST /api/v1/auth/token/refresh/ {refresh}            → {access}
```

- Access token TTL: 1 hora
- Refresh token TTL: 7 días
- Header para requests protegidos: `Authorization: Bearer <access>`
- Sin token → 401. El interceptor en `lib/api/client.ts` ya maneja el refresh automático.

## Estado previo (ya implementado en setup)

Los siguientes archivos ya existen y están completos — **no recrear**:

- `lib/api/client.ts` — axios instance + interceptor JWT + cola de refresh en 401
- `lib/stores/auth.store.ts` — Zustand: accessToken (memoria), refreshToken (localStorage), user, setTokens(), clear()
- `app/(auth)/login/page.tsx` — formulario login con react-hook-form + zod + shadcn (usa axios directo)
- `app/(dashboard)/layout.tsx` — auth guard básico

## Tasks

### Types
- [x] Crear `lib/types/auth.ts` con interfaces: `TokenResponse`, `LoginPayload`, `AuthUser`

### API
- [x] Crear `lib/api/endpoints/auth.ts` con funciones `login(payload)` y `refreshToken(refresh)`
  - `login` usa axios raw (sin apiClient — no hay token aún)
  - `refreshToken` usa axios raw también

### Hooks
- [x] Crear `lib/hooks/use-auth.ts` con:
  - `useLogin()` — llama authApi.login(), guarda tokens en store, redirige a `/warehouses`
  - `useLogout()` — limpia store, redirige a `/login`

### Login page update
- [x] Actualizar `app/(auth)/login/page.tsx` para usar `useLogin()` en lugar de axios directo
  - Eliminar import de axios y la llamada directa
  - Usar el hook; mantener el mismo UI

### Layout shell (dashboard)
- [x] Crear `components/layout/sidebar.tsx`
  - Links de navegación a todos los módulos: warehouses, suppliers, customers, transport, drivers, products, routes, shipments
  - Link activo destacado (usar `usePathname` de next/navigation)
  - Logo / nombre de app arriba
- [x] Crear `components/layout/header.tsx`
  - Muestra username del store (`useAuthStore`)
  - Botón "Salir" que llama `useLogout()`
- [x] Actualizar `app/(dashboard)/layout.tsx`
  - Integrar `<Sidebar>` + `<Header>` en el shell
  - Layout: sidebar fijo a la izquierda, header arriba, `children` en el área principal
  - Mantener el auth guard existente

## Validation report

- ✅ `lib/types/auth.ts` — `TokenResponse`, `LoginPayload`, `AuthUser` presentes
- ✅ `lib/api/endpoints/auth.ts` — `login()` y `refreshToken()` con axios raw (sin apiClient)
- ✅ `lib/hooks/use-auth.ts` — `useLogin()` redirige a `/warehouses`; `useLogout()` limpia store y redirige a `/login`
- ✅ `app/(auth)/login/page.tsx` — usa `useLogin()`, sin import de axios
- ✅ `components/layout/sidebar.tsx` — 8 nav links, `usePathname` para activo
- ✅ `components/layout/header.tsx` — username + botón Salir con `useLogout`
- ✅ `app/(dashboard)/layout.tsx` — integra `<Sidebar>` + `<Header>`, auth guard intacto
- ✅ Build TypeScript: 0 errores
