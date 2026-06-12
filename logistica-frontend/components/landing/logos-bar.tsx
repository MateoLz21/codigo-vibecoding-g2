const logos = [
  "Falabella",
  "LATAM Airlines",
  "Grupo Éxito",
  "Cencosud",
  "Femsa",
  "Copa Airlines",
  "Bancolombia",
  "Walmart Chile",
  "Rappi Business",
  "Mercado Libre",
]

export function LogosBar() {
  const doubled = [...logos, ...logos]

  return (
    <section
      className="py-16 border-y overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <p
        className="text-center text-xs font-semibold uppercase tracking-widest mb-10"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        Empresas líderes que confían en LogisticaWeb
      </p>
      <div className="overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {doubled.map((logo, i) => (
            <div
              key={i}
              className="mx-16 flex items-center flex-shrink-0"
              aria-hidden={i >= logos.length ? true : undefined}
            >
              <span
                className="text-xl font-bold tracking-wide"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                {logo}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
