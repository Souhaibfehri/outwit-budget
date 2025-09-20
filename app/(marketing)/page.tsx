import { Hero } from '@/components/marketing/hero'
import { FeatureGrid } from '@/components/marketing/feature-grid'
import { Steps } from '@/components/marketing/steps'
import { SocialProof } from '@/components/marketing/social-proof'
import { Comparison } from '@/components/marketing/comparison'
import { FinalCTA } from '@/components/marketing/final-cta'

// Force static generation for marketing page
export const dynamic = 'force-static'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <Steps />
      <SocialProof />
      <Comparison />
      <FinalCTA />
    </>
  )
}
