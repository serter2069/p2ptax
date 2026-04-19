import Header from '@/components/Header'
import HeroSection from '@/components/HeroSection'
import StatsSection from '@/components/StatsSection'
import ProblemSection from '@/components/ProblemSection'
import SpecialistsPreviewSection from '@/components/SpecialistsPreviewSection'
import SolutionSection from '@/components/SolutionSection'
import FeaturesSection from '@/components/FeaturesSection'
import MiniRequestSection from '@/components/MiniRequestSection'
import CtaSection from '@/components/CtaSection'
import FooterSection from '@/components/FooterSection'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <StatsSection />
      <ProblemSection />
      <SpecialistsPreviewSection />
      <SolutionSection />
      <FeaturesSection />
      <MiniRequestSection />
      <CtaSection />
      <FooterSection />
    </main>
  )
}
