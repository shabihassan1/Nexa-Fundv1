
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PricingCard, { PricingPlan } from "@/components/PricingCard";
import { CheckCircle2 } from "lucide-react";

// Sample pricing plans
const pricingPlans: PricingPlan[] = [
  {
    id: "basic",
    name: "Basic",
    price: "$39",
    period: "month",
    description: "Perfect for small campaigns and individual creators.",
    features: [
      "5 active campaigns",
      "Basic analytics",
      "Email support",
      "Campaign customization",
      "Social media integration"
    ]
  },
  {
    id: "professional",
    name: "Professional",
    price: "$79",
    period: "month",
    description: "Ideal for growing organizations and businesses.",
    features: [
      "15 active campaigns",
      "Advanced analytics",
      "Priority email support",
      "Advanced customization",
      "Social media integration",
      "Campaign scheduling",
      "Team collaboration (3 users)"
    ],
    isPopular: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$199",
    period: "month",
    description: "For large organizations with complex needs.",
    features: [
      "Unlimited active campaigns",
      "Enterprise analytics",
      "24/7 priority support",
      "White label customization",
      "Advanced integrations",
      "Custom reporting",
      "Team collaboration (unlimited)",
      "Dedicated account manager"
    ]
  }
];

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-16">
        <div className="container">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, <span className="gradient-text">transparent</span> pricing</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your needs. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {pricingPlans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">All plans include</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                "Secure payment processing",
                "Mobile-optimized campaigns",
                "Custom campaign URLs",
                "Supporter management",
                "Campaign updates",
                "Basic donor analytics",
                "SSL encryption",
                "Email notifications"
              ].map((feature, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle2 className="text-green-500 mr-2 flex-shrink-0" size={20} />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
