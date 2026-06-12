"use client"
import { m } from "framer-motion"
import { ArrowRight, Play, Package, Route, TrendingUp } from "lucide-react"
import { ParticlesCanvas } from "./particles-canvas"
import { MagneticButton } from "./magnetic-button"

const headlineWords = ["Mueve", "más.", "Gestiona", "menos."]

const socialProof = [
  { value: "+500", label: "empresas activas" },
  { value: "99.8%", label: "uptime garantizado" },
  { value: "4.9★", label: "valoración promedio" },
]

const badges = [
  { Icon: Package,    text: "Envío completado",    sub: "Hace 2 minutos",   delay: 0,   className: "top-[18%] -left-6" },
  { Icon: Route,      text: "Ruta optimizada",      sub: "Ahorro del 23%",  delay: 1.4, className: "top-[38%] -right-4" },
  { Icon: TrendingUp, text: "KPIs actualizados",    sub: "Dashboard en vivo", delay: 0.8, className: "bottom-[22%] -left-4" },
]

const kpis = [
  { label: "Envíos hoy",   value: "247", colorClass: "text-violet" },
  { label: "En tránsito",  value: "83",  colorClass: "text-magenta" },
  { label: "Completados",  value: "164", colorClass: "text-success" },
]

const recentItems = [
  { id: "#LW-8841", status: "Entregado",  time: "14:23", colorClass: "text-success" },
  { id: "#LW-8840", status: "En tránsito", time: "13:55", colorClass: "text-magenta" },
  { id: "#LW-8839", status: "Recogido",   time: "13:12", colorClass: "text-violet" },
]

const chartHeights = [60, 80, 45, 90, 70, 85, 95]

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden bg-near-black">
      {/* Mesh gradient orbs — complex radial, must be style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-[20%] -left-[10%] w-[55%] h-[55%] rounded-full blur-[80px] opacity-30"
          style={{ background: "radial-gradient(circle, var(--color-violet) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-[20%] -right-[15%] w-[50%] h-[50%] rounded-full blur-[80px] opacity-15"
          style={{ background: "radial-gradient(circle, var(--color-magenta) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[5%] left-[25%] w-[40%] h-[35%] rounded-full blur-[80px] opacity-10"
          style={{ background: "radial-gradient(circle, var(--color-violet) 0%, transparent 70%)" }}
        />
      </div>

      {/* Grid lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-violet) 1px, transparent 1px), linear-gradient(90deg, var(--color-violet) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.15]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "300px 300px",
        }}
      />

      <ParticlesCanvas />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: Content */}
          <div>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-sm font-medium bg-violet/12 border border-violet/25 text-violet"
            >
              <span className="w-2 h-2 rounded-full bg-violet animate-pulse" />
              Plataforma líder en América Latina
            </m.div>

            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-[1.05] font-general">
              {headlineWords.map((word, i) => (
                <m.span
                  key={word + i}
                  initial={{ opacity: 0, y: 60, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.7, delay: 0.2 + i * 0.13, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className={`inline-block mr-4 ${i >= 2 ? "text-magenta" : ""}`}
                >
                  {word}
                </m.span>
              ))}
            </h1>

            <m.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.85 }}
              className="text-lg lg:text-xl mb-10 leading-relaxed text-white/60"
            >
              Logística inteligente para empresas que no se detienen. Tracking en tiempo real, rutas optimizadas con IA y visibilidad total de tu cadena de suministro.
            </m.p>

            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.05 }}
              className="flex flex-wrap gap-4 mb-12"
            >
              <MagneticButton className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white cursor-pointer transition-opacity duration-200 hover:opacity-90 bg-gradient-to-r from-violet to-magenta font-body">
                Solicitar demo gratuita
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>

              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold cursor-pointer transition-all duration-200 text-white border-2 border-white/15 bg-white/[0.04] font-body"
              >
                <Play className="w-4 h-4" />
                Ver demo en video
              </m.button>
            </m.div>

            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.25 }}
              className="flex flex-wrap gap-10"
            >
              {socialProof.map((item) => (
                <div key={item.label}>
                  <div className="text-2xl font-bold text-white font-general">{item.value}</div>
                  <div className="text-sm mt-0.5 text-white/45">{item.label}</div>
                </div>
              ))}
            </m.div>
          </div>

          {/* Right: Glass dashboard */}
          <m.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="relative hidden lg:block"
          >
            <div
              className="relative rounded-2xl p-6 overflow-hidden bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08]"
              style={{ boxShadow: "var(--shadow-inner-glow), var(--shadow-card)" }}
            >
              {/* Inner glow line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet/60 to-transparent" />

              <div className="flex items-center justify-between mb-5">
                <span className="text-sm font-semibold text-white font-general">Panel de Operaciones</span>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-violet/20 text-violet">En vivo</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {kpis.map((kpi) => (
                  <div key={kpi.label} className="rounded-xl p-3 bg-white/[0.04] border border-white/[0.06]">
                    <div className={`text-xl font-bold font-general ${kpi.colorClass}`}>{kpi.value}</div>
                    <div className="text-[11px] mt-1 text-white/45">{kpi.label}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-4 mb-5 bg-white/[0.03] border border-white/[0.05]">
                <div className="text-xs mb-3 text-white/40">Volumen semanal</div>
                <div className="flex items-end gap-2 h-20">
                  {chartHeights.map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-t transition-all duration-300 ${i === 6 ? "bg-violet" : "bg-violet/25"}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                {recentItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-white/60">{item.id}</span>
                    <span className={`font-medium ${item.colorClass}`}>{item.status}</span>
                    <span className="text-white/30">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badges */}
            {badges.map(({ Icon, text, sub, delay, className }) => (
              <m.div
                key={text}
                className={`absolute ${className} z-10`}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, delay, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-lg bg-near-black/92 backdrop-blur-xl border border-white/10">
                  <div className="p-1.5 rounded-lg bg-violet/20">
                    <Icon className="w-3.5 h-3.5 text-violet" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white whitespace-nowrap">{text}</div>
                    <div className="text-[10px] text-white/45">{sub}</div>
                  </div>
                </div>
              </m.div>
            ))}
          </m.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none bg-gradient-to-b from-transparent to-near-black" />
    </section>
  )
}
