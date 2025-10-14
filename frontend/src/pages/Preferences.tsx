import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PreferencesEditor from '@/components/PreferencesEditor';
import { getCurrentUser } from '@/services/userService';

const Preferences = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        await getCurrentUser(token);
      } catch (error) {
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Personalization Settings</h1>
            <p className="text-muted-foreground">
              Customize your experience by telling us what matters to you. We'll use this to show you campaigns you'll love.
            </p>
          </div>

          {/* Preferences Editor */}
          <PreferencesEditor />

          {/* Info Section */}
          <div className="mt-8 p-6 rounded-lg bg-muted/50 border">
            <h3 className="font-semibold mb-2">How does this work?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Your preferences help us recommend campaigns that align with your interests</li>
              <li>• You'll see personalized recommendations on the Browse page</li>
              <li>• You can update your preferences anytime</li>
              <li>• Your data is private and only used to improve your experience</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Preferences;
