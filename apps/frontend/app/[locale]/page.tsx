import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import HeroSection from "@/components/sections/HeroSection";
import ChallengeSection from "@/components/sections/ChallengeSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import BilingualSection from "@/components/sections/BilingualSection";
import TemplatesSection from "@/components/sections/TemplatesSection";
import PrinciplesSection from "@/components/sections/PrinciplesSection";
import EvidenceSection from "@/components/sections/EvidenceSection";
import CTASection from "@/components/sections/CTASection";

/* The landing page is the fitting room of the FALO shop: it shows the resume
   being made. Its sections live in `components/sections`.

   Every capability drawn here exists in the code. Nothing on this page may
   show cover letters, resume import, a pasted job description, US Letter or a
   coach score: none of them can be delivered as drawn. */

export default function LandingPage() {
  /* `overflow-x-clip`, not `overflow-hidden`: clip contains anything that
     overhangs the viewport without creating a scroll container, so the sticky
     column in the principles section keeps working. */
  return (
    <main className="relative z-10 overflow-x-clip">
      <Navbar />
      <HeroSection />
      <ChallengeSection />
      <HowItWorksSection />
      <BilingualSection />
      <TemplatesSection />
      <PrinciplesSection />
      <EvidenceSection />
      <CTASection />
      <Footer />
    </main>
  );
}
