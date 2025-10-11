
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Rocket, 
  BarChart3, 
  CreditCard, 
  Users, 
  Share2, 
  ShieldCheck, 
  Smartphone, 
  Zap 
} from "lucide-react";

const Features = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <section className="py-20 bg-gray-50">
          <div className="container">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Powerful features to <span className="gradient-text">boost</span> your campaigns</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Everything you need to create successful crowdfunding campaigns and manage your entire community
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Rocket className="h-8 w-8 text-green-500" />,
                  title: "Quick Campaign Setup",
                  description: "Launch your campaign in minutes with our intuitive setup process and customizable templates."
                },
                {
                  icon: <BarChart3 className="h-8 w-8 text-green-500" />,
                  title: "Advanced Analytics",
                  description: "Track campaign performance with detailed analytics and insights to optimize your strategy."
                },
                {
                  icon: <CreditCard className="h-8 w-8 text-green-500" />,
                  title: "Secure Payments",
                  description: "Multiple payment options with industry-leading security to protect your backers' information."
                },
                {
                  icon: <Users className="h-8 w-8 text-green-500" />,
                  title: "Community Management",
                  description: "Engage with your backers, share updates, and build a community around your project."
                },
                {
                  icon: <Share2 className="h-8 w-8 text-green-500" />,
                  title: "Social Integration",
                  description: "Seamlessly share your campaign across all major social media platforms to maximize reach."
                },
                {
                  icon: <ShieldCheck className="h-8 w-8 text-green-500" />,
                  title: "Fraud Protection",
                  description: "Advanced algorithms and manual reviews to prevent fraudulent activities on your campaign."
                },
                {
                  icon: <Smartphone className="h-8 w-8 text-green-500" />,
                  title: "Mobile Optimization",
                  description: "Fully responsive campaigns that look great on any device, from desktop to smartphone."
                },
                {
                  icon: <Zap className="h-8 w-8 text-green-500" />,
                  title: "Fast Performance",
                  description: "Lightning-fast loading times ensure your backers have a smooth experience."
                }
              ].map((feature, index) => (
                <div key={index} className="bg-white rounded-lg p-6 shadow-md">
                  <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2">
                <img 
                  src="https://www-cms.pipedriveassets.com/cdn-cgi/image/quality=70,format=auto/https://www-cms.pipedriveassets.com/Crowdfunding-definition-and-guide.png" 
                  alt="Crowdfunding Platform" 
                  className="rounded-lg shadow-lg"
                />
              </div>
              <div className="md:w-1/2 space-y-6">
                <h2 className="text-3xl font-bold"><span className="gradient-text">All-in-one</span> platform</h2>
                <p className="text-gray-600">
                  Our platform is designed to handle everything you need to launch and manage successful crowdfunding campaigns. From campaign creation to backer management, we've got you covered.
                </p>
                <div className="space-y-4">
                  {[
                    "Create beautiful campaign pages in minutes",
                    "Process payments securely with multiple options",
                    "Engage with your backers through updates and comments",
                    "Track performance with detailed analytics",
                    "Integrate with your existing tools and platforms"
                  ].map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="bg-green-100 rounded-full p-1 mr-3 mt-1">
                        <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Features;
