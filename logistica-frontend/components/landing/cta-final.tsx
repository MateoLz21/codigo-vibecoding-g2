"use client"
import { useState } from "react"
import { m } from "framer-motion"
import { ArrowRight, CheckCircle } from "lucide-react"

const perks = [
  "Demo personalizada con tu caso de uso",
  "Sin tarjeta de crédito requerida",
  "Configuración en menos de 48 horas",
]

export function CtaFinal() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSent(true)
  }

  return (
    <section id="cta" className="py-24 px-6 bg-near-black/95">
      <div className="max-w-4xl mx-auto">
        <m.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          {/* Rotating gradient border */}
          <div className="relative p-[1px] rounded-3xl overflow-hidden">
            <div
              className="absolute inset-0 animate-gradient-rotate"
              style={{
                background: "linear-gradient(135deg, var(--color-violet), var(--color-magenta), var(--color-violet))",
                backgroundSize: "300% 300%",
              }}
            />

            <div className="relative rounded-3xl px-8 py-16 md:px-16 text-center bg-near-black/97 backdrop-blur-2xl">
              {/* Inner glow */}
              <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-violet/60 to-transparent" />

              <span className="text-xs font-semibold uppercase tracking-widest text-magenta">
                Empieza hoy
              </span>

              <h2 className="text-4xl lg:text-5xl font-bold text-white mt-4 mb-5 font-general">
                Tu demo gratuita te espera
              </h2>

              <p className="text-lg mb-10 max-w-xl mx-auto text-white/65">
                Muéstranos tu operación y te mostramos cómo LogisticaWeb la transforma. Sin compromisos.
              </p>

              <div className="flex flex-wrap justify-center gap-6 mb-10">
                {perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 text-success" />
                    {perk}
                  </div>
                ))}
              </div>

              {sent ? (
                <m.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <CheckCircle className="w-12 h-12 text-success" />
                  <p className="text-white font-semibold text-lg">
                    ¡Listo! Te contactamos en menos de 24 horas.
                  </p>
                </m.div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@empresa.com"
                    className="flex-1 px-4 py-3.5 rounded-xl text-sm text-white outline-none transition-all duration-200 bg-white/[0.07] border border-white/[0.12] focus:border-violet/60 focus:ring-2 focus:ring-violet/15 placeholder:text-white/30"
                  />
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white cursor-pointer transition-opacity duration-200 hover:opacity-90 flex-shrink-0 bg-gradient-to-r from-violet to-magenta"
                  >
                    Solicitar demo
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </m.div>
      </div>
    </section>
  )
}
