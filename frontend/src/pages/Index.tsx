
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ClientsSection from "@/components/ClientsSection";
import CommunitySection from "@/components/CommunitySection";
import FeaturedCampaigns from "@/components/FeaturedCampaigns";
import TrendingCampaigns from "@/components/TrendingCampaigns";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <ClientsSection />
        <FeaturedCampaigns />
        <TrendingCampaigns />
        <CommunitySection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
