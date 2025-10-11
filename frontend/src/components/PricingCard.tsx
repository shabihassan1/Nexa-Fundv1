
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isPopular?: boolean;
}

interface PricingCardProps {
  plan: PricingPlan;
}

const PricingCard = ({ plan }: PricingCardProps) => {
  return (
    <div className={`bg-white rounded-lg shadow-lg p-8 border ${plan.isPopular ? 'border-green-500' : 'border-gray-200'} relative`}>
      {plan.isPopular && (
        <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 translate-y-[-50%] rounded-full">
          Most Popular
        </div>
      )}
      
      <h3 className="text-xl font-bold mb-4">{plan.name}</h3>
      <div className="mb-4">
        <span className="text-3xl font-bold">{plan.price}</span>
        <span className="text-gray-500">/{plan.period}</span>
      </div>
      <p className="text-gray-600 mb-6">{plan.description}</p>
      
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check size={18} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      
      <Button 
        className={`w-full ${plan.isPopular ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'}`}
      >
        Get Started
      </Button>
    </div>
  );
};

export default PricingCard;
