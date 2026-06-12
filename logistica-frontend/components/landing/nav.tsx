"use client"
import { useEffect, useState } from "react"
import { m, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Menu, X } from "lucide-react"

const links = [
  { label: "Soluciones", href: "#features" },
  { label: "Cómo funciona", href: "#how-it-works" },
  { label: "Clientes", href: "#testimonials" },
  { label: "Contacto", href: "#cta" },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      <m.nav
        initial={{ y: 0, opacity: 1 }}
        className="fixed top-4 left-4 right-4 z-50"
      >
        <div
          className={[
            "max-w-7xl mx-auto flex items-center justify-between rounded-2xl px-6 py-3",
            "transition-all duration-300 backdrop-blur-xl border",
            scrolled
              ? "bg-near-black/85 border-white/10"
              : "bg-near-black/35 border-white/[0.05]",
          ].join(" ")}
        >
          <div className="text-xl font-bold font-general cursor-pointer">
            <span className="text-white">Logistica</span>
            <span className="text-magenta">Web</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-white/60 hover:text-white transition-colors duration-200 cursor-pointer"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white/80 border border-white/20 hover:border-white/50 hover:text-white transition-all duration-200 cursor-pointer"
            >
              Iniciar sesión
            </Link>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-magenta cursor-pointer transition-opacity duration-200 hover:opacity-90">
              Solicitar demo
            </button>
          </div>

          <button
            className="md:hidden p-2 text-white/70 cursor-pointer"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <m.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-2 mx-auto max-w-7xl rounded-2xl p-4 flex flex-col gap-2 bg-near-black/95 backdrop-blur-2xl border border-white/10"
            >
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white cursor-pointer transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/80 border border-white/20 hover:text-white transition-colors duration-200 cursor-pointer text-center"
              >
                Iniciar sesión
              </Link>
              <button className="mt-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-magenta cursor-pointer">
                Solicitar demo
              </button>
            </m.div>
          )}
        </AnimatePresence>
      </m.nav>
    </>
  )
}
