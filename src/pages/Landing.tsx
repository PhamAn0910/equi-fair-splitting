import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import MarqueeSection from "@/components/landing/MarqueeSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import VibeSection from "@/components/landing/VibeSection";
import PricingSection from "@/components/landing/PricingSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <MarqueeSection />
      <FeaturesSection />
      <VibeSection />
      <PricingSection />
      <Footer />
    </div>
  );
};

export default Index;
