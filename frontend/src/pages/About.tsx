
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="bg-green-500 text-white py-16">
          <div className="container text-center">
            <h1 className="text-4xl font-bold mb-4">About Nexa Fund</h1>
            <p className="text-xl max-w-2xl mx-auto">
              Revolutionizing crowdfunding through blockchain technology and decentralized innovation
            </p>
          </div>
        </div>
        
        <section className="py-16">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Our Story</h2>
                <p className="text-gray-600 mb-4">
                  Founded in 2024, Nexa Fund emerged from a vision to democratize funding through blockchain technology. We recognized that traditional crowdfunding platforms had limitations in transparency, security, and global accessibility.
                </p>
                <p className="text-gray-600 mb-4">
                  Our platform leverages blockchain technology to ensure transparent, secure, and borderless funding. Every contribution is recorded on the blockchain, milestone progress is tracked transparently, and funds are managed through smart contracts and MetaMask integration.
                </p>
                <p className="text-gray-600">
                  We've built a comprehensive ecosystem featuring milestone-based funding, reward tiers, real-time project updates, and community-driven governance. Our platform supports creators worldwide in bringing innovative projects to life while giving backers unprecedented transparency and security.
                </p>
              </div>
              <div className="rounded-lg overflow-hidden bg-gradient-to-br from-green-100 to-blue-100 p-8">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-12 h-12 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Powered by Blockchain</h3>
                  <p className="text-gray-600 mb-4">
                    Our platform utilizes cutting-edge blockchain technology to provide transparency, security, and global accessibility for all funding operations.
                  </p>
                  <div className="flex justify-center space-x-4 text-sm text-gray-500">
                    <span className="bg-white px-3 py-1 rounded-full">🔒 Secure</span>
                    <span className="bg-white px-3 py-1 rounded-full">🌐 Global</span>
                    <span className="bg-white px-3 py-1 rounded-full">📈 Transparent</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-gray-50">
          <div className="container">
            <h2 className="text-3xl font-bold mb-8 text-center">Our Values</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-green-600">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Innovation</h3>
                <p className="text-gray-600">
                  We pioneer blockchain-based crowdfunding solutions, supporting cutting-edge projects and revolutionary ideas across all industries.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-green-600">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Community</h3>
                <p className="text-gray-600">
                  We build a global community where creators and backers connect through shared vision, transparent communication, and milestone-driven progress.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-green-600">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Transparency</h3>
                <p className="text-gray-600">
                  Every transaction is recorded on the blockchain, milestone progress is publicly verifiable, and fund management is completely transparent.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-green-600">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Decentralization</h3>
                <p className="text-gray-600">
                  We eliminate traditional gatekeepers, enabling direct peer-to-peer funding with MetaMask integration and borderless transactions.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Platform Features</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Discover the powerful features that make Nexa Fund the most advanced blockchain-based crowdfunding platform.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center bg-white p-6 rounded-lg shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8 text-green-600">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Milestone Tracking</h3>
                <p className="text-gray-600 text-sm">
                  Projects are structured around clear milestones with transparent progress tracking and community voting for milestone approval.
                </p>
              </div>
              
              <div className="text-center bg-white p-6 rounded-lg shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8 text-green-600">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Blockchain Security</h3>
                <p className="text-gray-600 text-sm">
                  All transactions are secured by blockchain technology with MetaMask integration for wallet management and transparent fund tracking.
                </p>
              </div>
              
              <div className="text-center bg-white p-6 rounded-lg shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8 text-green-600">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 8v6a2 2 0 002 2h4a2 2 0 002-2V8M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Reward Tiers</h3>
                <p className="text-gray-600 text-sm">
                  Creators can offer multiple reward tiers to backers, with detailed analytics and contribution tracking for each tier level.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-green-500 text-white">
          <div className="container text-center">
            <h2 className="text-3xl font-bold mb-4">Join the Future of Funding</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Whether you're a creator with a revolutionary idea or an investor ready to support blockchain innovation, Nexa Fund is your gateway to decentralized crowdfunding.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/start-campaign">
                <Button className="bg-white text-green-600 hover:bg-gray-100">
                  Launch Your Project
                </Button>
              </Link>
              <Link to="/browse">
                <Button variant="outline" className="text-white border-white bg-transparent hover:bg-white hover:text-green-600 transition-colors">
                  Discover Projects
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;

