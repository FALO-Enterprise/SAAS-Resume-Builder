import Navbar from '@/components/ui/Navbar';
import HeroSection from '@/components/sections/HeroSection';
import ChallengeSection from '@/components/sections/ChallengeSection';
import FeaturesSection from '@/components/sections/FeaturesSection';
import HowItWorksSection from '@/components/sections/HowItWorksSection';
import PrinciplesSection from '@/components/sections/PrinciplesSection';
import RoadmapSection from '@/components/sections/RoadmapSection';
import TestimonialsSection from '@/components/sections/TestimonialsSection';
import CTASection from '@/components/sections/CTASection';
import Footer from '@/components/ui/Footer';

export default function LandingPage() {
  return (
    <main className="relative z-10 overflow-hidden">
      <Navbar />
      <HeroSection />
      <ChallengeSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PrinciplesSection />
      <RoadmapSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
