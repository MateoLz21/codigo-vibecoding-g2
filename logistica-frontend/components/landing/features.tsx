"use client"
import { m, type Variants } from "framer-motion"
import { MapPin, BarChart3, Route, Puzzle, Smartphone, ArrowRight } from "lucide-react"

const features = [
  {
    icon: MapPin,
    title: "Tracking en tiempo real",
    description:
      "Visualiza la posición exacta de cada envío y vehículo en un mapa interactivo. Alertas automáticas ante desvíos, retrasos o condiciones fuera de ruta.",
    featured: true,
    colorClass: "text-violet",
    bgClass: "bg-violet/10",
  },
  {
    icon: BarChart3,
    title: "Dashboard de operaciones",
    description:
      "KPIs en tiempo real, alertas inteligentes y reportes automáticos para que tomes decisiones con datos concretos.",
    colorClass: "text-violet",
    bgClass: "bg-violet/10",
  },
  {
    icon: Route,
    title: "Rutas optimizadas con IA",
    description:
      "Reduce hasta 25% en costos de combustible con algoritmos que aprenden de tu historial y el tráfico actual.",
    colorClass: "text-magenta",
    bgClass: "bg-magenta/10",
  },
  {
    icon: Puzzle,
    title: "Integración ERP y SAP",
    description:
      "Conecta con tus sistemas existentes —SAP, Oracle, facturación electrónica— en menos de 48 horas con soporte dedicado.",
    colorClass: "text-violet",
    bgClass: "bg-violet/10",
  },
  {
    icon: Smartphone,
    title: "App móvil para conductores",
    description:
      "Firma digital, evidencia fotográfica y actualizaciones de estado desde cualquier dispositivo, incluso sin conexión.",
    colorClass: "text-violet",
    bgClass: "bg-violet/10",
  },
]

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

export function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-near-black">
      <div className="max-w-7xl mx-auto">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-magenta">
            Soluciones
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mt-3 mb-5 font-general">
            Todo lo que tu operación necesita
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-white/60">
            Una plataforma unificada que conecta toda tu cadena logística, desde el proveedor hasta el cliente final.
          </p>
        </m.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <m.div
                key={feature.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={cardVariants}
                className={feature.featured ? "lg:col-span-2" : ""}
              >
                <div className="h-full rounded-2xl p-6 cursor-pointer group transition-all duration-200 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.06] hover:border-violet/30">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${feature.bgClass}`}>
                    <Icon className={`w-6 h-6 ${feature.colorClass}`} />
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-3 font-general">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/60">
                    {feature.description}
                  </p>

                  {feature.featured && (
                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-violet cursor-pointer transition-all duration-200">
                      Ver mapa interactivo
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </m.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
