
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";

const Contact = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send the form data to a server here
    setFormSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormSubmitted(false);
      // Reset form fields here
      const form = e.target as HTMLFormElement;
      form.reset();
    }, 3000);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="bg-green-500 text-white py-16">
          <div className="container text-center">
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl max-w-2xl mx-auto">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>
        </div>
        
        <section className="py-16">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
                <p className="text-gray-600 mb-8">
                  Fill out the form below and we'll get back to you as soon as possible. We value your feedback and are here to answer any questions you might have about CrowdFund.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="mt-1 mr-4 bg-green-100 p-3 rounded-full">
                      <Mail className="text-green-600 h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-1">Email Us</h3>
                      <p className="text-gray-600">support@NexaFund_1@gmail.com</p>
                      <p className="text-gray-600">info@NexaFund_1@gmail.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mt-1 mr-4 bg-green-100 p-3 rounded-full">
                      <Phone className="text-green-600 h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-1">Call Us</h3>
                      <p className="text-gray-600">00923182002</p>
                      <p className="text-gray-600">Monday-Friday, 9am-5pm EST</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mt-1 mr-4 bg-green-100 p-3 rounded-full">
                      <MapPin className="text-green-600 h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-1">Visit Us</h3>
                      <p className="text-gray-600">Fast University</p>
                      <p className="text-gray-600">Islamabad, H-13</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="bg-white p-8 rounded-lg shadow-sm">
                  <h2 className="text-2xl font-bold mb-6">Send a Message</h2>
                  
                  {formSubmitted ? (
                    <div className="bg-green-100 text-green-700 p-4 rounded-md mb-6">
                      <p className="font-medium">Thank you for your message!</p>
                      <p>We've received your inquiry and will respond shortly.</p>
                    </div>
                  ) : null}
                  
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                          First Name*
                        </label>
                        <Input id="firstName" required />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name*
                        </label>
                        <Input id="lastName" required />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address*
                      </label>
                      <Input id="email" type="email" required />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                        Subject*
                      </label>
                      <Input id="subject" required />
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                        Message*
                      </label>
                      <Textarea id="message" rows={5} required />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-green-500 hover:bg-green-600"
                    >
                      Send Message
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-gray-50">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Find quick answers to common questions about CrowdFund.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-2">How do I start a campaign?</h3>
                <p className="text-gray-600">
                  To start a campaign, click on the "Start Campaign" button in the navigation bar. You'll be guided through a step-by-step process to set up your project.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-2">How does funding work?</h3>
                <p className="text-gray-600">
                  We use an all-or-nothing funding model. If your project reaches its funding goal, you receive the funds. If not, backers aren't charged and no money changes hands.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-2">What fees does CrowdFund charge?</h3>
                <p className="text-gray-600">
                  CrowdFund collects a 5% fee from successfully funded campaigns, plus payment processing fees of approximately 3-5%.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-2">How do I get help with my campaign?</h3>
                <p className="text-gray-600">
                  We offer support through our help center, email, and chat. You can also book a consultation with one of our campaign specialists.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
