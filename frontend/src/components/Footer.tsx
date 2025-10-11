import { Heart, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-200">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-white">Nexa Fund</h3>
            <p className="mb-4 text-gray-400">
              Empowering innovators and creators to bring their ideas to life through community support.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">For Creators</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Start a Campaign</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Creator Guidelines</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Fees & Pricing</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Success Stories</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">For Backers</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Trust & Safety</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">FAQs</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Support</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Stay Updated</h3>
            <p className="text-gray-400 mb-4">Subscribe to our newsletter to get the latest updates on new campaigns.</p>
            <div className="flex">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-gray-500" />
                </div>
                <input
                  type="email"
                  className="pl-10 pr-4 py-2 w-full bg-gray-800 border border-gray-700 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-200"
                  placeholder="Your email"
                />
              </div>
              <Button className="rounded-l-none bg-green-500 hover:bg-green-600">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 Nexa Fund. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-white text-sm">Terms</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
