import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Next Gen<br />
                Crowdfunding<br />
                <span className="text-green-500">Platform</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-lg">
                Where to grow your business from zero investment. Join thousands of successful entrepreneurs who started their journey with us.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/start-campaign">
                <Button size="lg" className="text-base md:text-lg font-medium bg-green-500 hover:bg-green-600 w-full sm:w-40">
                  Get Started
                </Button>
              </Link>
              <Link to="/browse">
                <Button size="lg" variant="outline" className="text-base md:text-lg font-medium w-full sm:w-48 px-6 border-2 hover:bg-gray-50">
                  Explore Campaigns
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-8 pt-4">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80" 
                    alt="User avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-100">
                  <img 
                    src="https://plus.unsplash.com/premium_photo-1690407617542-2f210cf20d7e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8cGVyc29ufGVufDB8fDB8fHww" 
                    alt="User avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80" 
                    alt="User avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-100">
                  <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80" 
                    alt="User avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-white bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">+5K</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">Join 10,000+ active users</p>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden animate-fade-in shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10"></div>
            <img 
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
              alt="Crowdfunding Platform" 
              className="w-full h-full object-cover aspect-square"
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-white text-lg font-medium">Start your journey today</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
