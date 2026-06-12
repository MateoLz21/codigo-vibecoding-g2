import { MotionProvider } from "@/components/landing/motion-provider"
import { Nav } from "@/components/landing/nav"
import { Hero } from "@/components/landing/hero"
import { LogosBar } from "@/components/landing/logos-bar"
import { Features } from "@/components/landing/features"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Testimonials } from "@/components/landing/testimonials"
import { CtaFinal } from "@/components/landing/cta-final"
import { Footer } from "@/components/landing/footer"

export default function RootPage() {
  return (
    <div className="overflow-x-hidden bg-near-black font-body">
      <MotionProvider>
        <Nav />
        <Hero />
        <LogosBar />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CtaFinal />
        <Footer />
      </MotionProvider>
    </div>
  )
}
