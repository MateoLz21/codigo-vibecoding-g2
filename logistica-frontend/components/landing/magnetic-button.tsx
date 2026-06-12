"use client"
import { useRef } from "react"
import { m, useMotionValue, useSpring, type HTMLMotionProps } from "framer-motion"

type Props = Omit<HTMLMotionProps<"button">, "ref"> & {
  children: React.ReactNode
}

export function MagneticButton({ children, className, ...rest }: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 300, damping: 20 })
  const springY = useSpring(y, { stiffness: 300, damping: 20 })

  const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3)
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3)
  }

  const onLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    x.set(0)
    y.set(0)
    rest.onMouseLeave?.(e)
  }

  return (
    <m.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      {...rest}
    >
      {children}
    </m.button>
  )
}
