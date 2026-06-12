"use client"
import { LazyMotion, domAnimation, MotionConfig } from "framer-motion"

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.4 }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
