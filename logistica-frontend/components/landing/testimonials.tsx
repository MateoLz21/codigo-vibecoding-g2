"use client"
import { useRef } from "react"
import { m, useMotionValue, useSpring, useTransform } from "framer-motion"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Carlos Mendez",
    role: "Director de Operaciones",
    company: "Distribuidora San Martín",
    text: "Reducimos tiempos de entrega un 31% en el primer mes. La visibilidad en tiempo real cambió completamente la forma en que gestionamos nuestra flota de 120 vehículos.",
    stars: 5,
  },
  {
    name: "Ana Silva",
    role: "Gerente de Logística",
    company: "RetailGroup Perú",
    text: "La integración con nuestro SAP fue impecable. En 48 horas teníamos todo conectado y el equipo operando con datos en tiempo real.",
    stars: 5,
  },
  {
    name: "Roberto Fuentes",
    role: "CEO",
    company: "Trans-Andes Express",
    text: "ROI visible desde el segundo mes. Ahorramos 23% en combustible con rutas optimizadas y eliminamos casi por completo los envíos sin trazabilidad.",
    stars: 5,
  },
  {
    name: "Luciana Morales",
    role: "Supply Chain Manager",
    company: "Farmacias del Sur",
    text: "La app móvil para conductores resolvió un problema de años: la evidencia fotográfica automática y la firma digital eliminaron todos los reclamos sin soporte.",
    stars: 5,
  },
  {
    name: "Diego Vargas",
    role: "Jefe de Flota",
    company: "Constructora Mega",
    text: "Pasamos de Excel y WhatsApp a un dashboard profesional en una semana. El soporte del equipo LogisticaWeb fue fundamental en cada etapa de la transición.",
    stars: 5,
  },
  {
    name: "Patricia Lozano",
    role: "VP de Operaciones",
    company: "E-Commerce Andino",
    text: "Manejamos 500+ envíos diarios y LogisticaWeb nos dio la escalabilidad que necesitábamos. Los reportes automáticos ahorran 8 horas semanales de trabajo manual.",
    stars: 5,
  },
]

function TestimonialCard({ t, delay }: { t: (typeof testimonials)[number]; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const xRaw = useMotionValue(0)
  const yRaw = useMotionValue(0)
  const rotateX = useSpring(useTransform(yRaw, [-80, 80], [5, -5]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(xRaw, [-80, 80], [-5, 5]), { stiffness: 300, damping: 30 })

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    xRaw.set(e.clientX - rect.left - rect.width / 2)
    yRaw.set(e.clientY - rect.top - rect.height / 2)
  }

  const onLeave = () => { xRaw.set(0); yRaw.set(0) }

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1000 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="mb-5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-6 cursor-default"
    >
      <div className="flex gap-1 mb-4">
        {Array.from({ length: t.stars }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-magenta text-magenta" />
        ))}
      </div>

      <p className="text-sm leading-relaxed mb-6 text-white/75">
        &ldquo;{t.text}&rdquo;
      </p>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-violet/20 text-violet">
          {t.name.split(" ").map((n) => n[0]).join("")}
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{t.name}</div>
          <div className="text-xs text-white/45">{t.role} · {t.company}</div>
        </div>
      </div>
    </m.div>
  )
}

export function Testimonials() {
  const col1 = testimonials.filter((_, i) => i % 3 === 0)
  const col2 = testimonials.filter((_, i) => i % 3 === 1)
  const col3 = testimonials.filter((_, i) => i % 3 === 2)

  return (
    <section id="testimonials" className="py-24 px-6 bg-near-black">
      <div className="max-w-7xl mx-auto">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-magenta">
            Testimonios
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mt-3 mb-5 font-general">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-white/60">
            Más de 500 empresas en América Latina ya optimizan su logística con nosotros.
          </p>
        </m.div>

        <div className="hidden lg:grid grid-cols-3 gap-5 items-start">
          <div>{col1.map((t, i) => <TestimonialCard key={t.name} t={t} delay={i * 0.1} />)}</div>
          <div className="mt-10">{col2.map((t, i) => <TestimonialCard key={t.name} t={t} delay={i * 0.1 + 0.05} />)}</div>
          <div>{col3.map((t, i) => <TestimonialCard key={t.name} t={t} delay={i * 0.1 + 0.1} />)}</div>
        </div>

        <div className="lg:hidden grid sm:grid-cols-2 gap-5">
          {testimonials.map((t, i) => <TestimonialCard key={t.name} t={t} delay={i * 0.08} />)}
        </div>
      </div>
    </section>
  )
}
