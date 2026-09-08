import Navbar from '@/components/ui/Navbar';
import HeroSection from '@/components/sections/HeroSection';
import ChallengeSection from '@/components/sections/ChallengeSection';
import FeaturesSection from '@/components/sections/FeaturesSection';
import HowItWorksSection from '@/components/sections/HowItWorksSection';
import PrinciplesSection from '@/components/sections/PrinciplesSection';
import TestmonialsSection from '@/components/sections/TestimonialsSection';
import EvidenceSection from '@/components/sections/EvidenceSection';
import CTASection from '@/components/sections/CTASection';
import Footer from '@/components/ui/Footer';

export default function LandingPage() {
  /* `overflow-x-clip`, not `overflow-hidden`: clip still contains the blur
     blooms that overhang the viewport, but it creates no scroll container, so
     the sticky citation stack in EvidenceSection keeps working. */
  return (
    <main className="relative z-10 overflow-x-clip">
      <Navbar />
      <HeroSection />
      <ChallengeSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PrinciplesSection />
      <EvidenceSection />
      <TestmonialsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
