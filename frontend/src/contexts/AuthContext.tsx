import React, { createContext, useState, ReactNode, useEffect, useContext } from 'react';
import { signIn, signUp, getProfile } from '@/services/authService';

interface User {
  id: string;
  email: string;
  name?: string;
  walletAddress?: string;
  role?: string;
  status?: string;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  getToken: () => string | null;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
  getToken: () => null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token in localStorage
    const storedToken = localStorage.getItem('token');
    console.log("AuthContext: Initial token from localStorage:", storedToken ? "exists" : "not found");
    
    if (storedToken) {
      setToken(storedToken);
      // Fetch user profile with the token
      getProfile(storedToken)
        .then(userData => {
          console.log("AuthContext: User profile fetched successfully");
          setUser(userData);
        })
        .catch(error => {
          console.error('Error fetching user profile:', error);
          // If token is invalid, clear it
          console.log("AuthContext: Clearing invalid token");
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await signIn(email, password);
      console.log("AuthContext: Login successful, token received");
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem('token', response.token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const response = await signUp(email, password, name);
      console.log("AuthContext: Registration successful, token received");
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem('token', response.token);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (token) {
      try {
        console.log("AuthContext: Refreshing user profile");
        const userData = await getProfile(token);
        setUser(userData);
        console.log("AuthContext: User profile refreshed successfully");
      } catch (error) {
        console.error('Error refreshing user profile:', error);
        // If token is invalid, clear it
        console.log("AuthContext: Clearing invalid token during refresh");
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    }
  };

  const logout = () => {
    console.log("AuthContext: Logging out, clearing user and token");
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  // Debug: Log auth state changes
  useEffect(() => {
    console.log("AuthContext: Auth state updated", { 
      isAuthenticated: !!user, 
      hasToken: !!token 
    });
  }, [user, token]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated: !!user, 
      isLoading,
      login,
      register,
      logout,
      refreshUser,
      getToken: () => token
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 