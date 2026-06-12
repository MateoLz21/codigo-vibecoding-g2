"use client"
import { m } from "framer-motion"

const steps = [
  {
    number: "01",
    title: "Conecta tu operación",
    description:
      "Integra LogisticaWeb con tus sistemas actuales —ERP, SAP, Excel— en menos de 48 horas. Nuestro equipo técnico te acompaña en cada paso sin interrumpir tu operación.",
    variant: "violet",
  },
  {
    number: "02",
    title: "Configura tus rutas",
    description:
      "Define zonas de cobertura, puntos de entrega y parámetros de optimización. La IA aprende de tu historial para mejorar la eficiencia continuamente.",
    variant: "magenta",
  },
  {
    number: "03",
    title: "Monitorea en tiempo real",
    description:
      "Desde el dashboard central, visibilidad total: posición de flotas, estado de envíos y alertas proactivas ante cualquier incidencia antes de que escale.",
    variant: "violet",
  },
  {
    number: "04",
    title: "Analiza y optimiza",
    description:
      "Reportes automáticos con KPIs clave. Identifica cuellos de botella, reduce costos y mejora la satisfacción del cliente, semana tras semana.",
    variant: "magenta",
  },
] as const

const numberClasses: Record<string, string> = {
  violet: "bg-violet/10 border border-violet/30 text-violet",
  magenta: "bg-magenta/10 border border-magenta/30 text-magenta",
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-near-black/95">
      <div className="max-w-6xl mx-auto">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-magenta">
            Proceso
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mt-3 mb-5 font-general">
            Empieza en 4 pasos simples
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-white/60">
            Implementación rápida, resultados desde la primera semana.
          </p>
        </m.div>

        <div className="relative">
          {/* Center line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-px bg-gradient-to-b from-transparent via-violet/40 to-transparent" />

          <div className="space-y-12 md:space-y-16">
            {steps.map((step, i) => {
              const isLeft = i % 2 === 0
              return (
                <m.div
                  key={step.number}
                  initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="grid md:grid-cols-2 gap-8 items-center"
                >
                  {isLeft ? (
                    <>
                      <div className="flex justify-center md:justify-end md:pr-16">
                        <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold font-general ${numberClasses[step.variant]}`}>
                          {step.number}
                        </div>
                      </div>
                      <div className="text-center md:text-left md:pl-16">
                        <h3 className="text-2xl font-bold text-white mb-3 font-general">{step.title}</h3>
                        <p className="text-base leading-relaxed text-white/60">{step.description}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center md:text-right md:pr-16 order-2 md:order-1">
                        <h3 className="text-2xl font-bold text-white mb-3 font-general">{step.title}</h3>
                        <p className="text-base leading-relaxed text-white/60">{step.description}</p>
                      </div>
                      <div className="flex justify-center md:justify-start md:pl-16 order-1 md:order-2">
                        <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold font-general ${numberClasses[step.variant]}`}>
                          {step.number}
                        </div>
                      </div>
                    </>
                  )}
                </m.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
