'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type AuthTab = 'login' | 'signup';

interface AuthContextType {
  isOpen: boolean;
  activeTab: AuthTab;
  openLogin: () => void;
  openSignup: () => void;
  closeModal: () => void;
  switchTab: (tab: AuthTab) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  const openLogin  = () => { setActiveTab('login');  setIsOpen(true); };
  const openSignup = () => { setActiveTab('signup'); setIsOpen(true); };
  const closeModal = () => setIsOpen(false);
  const switchTab  = (tab: AuthTab) => setActiveTab(tab);

  return (
    <AuthContext.Provider value={{ isOpen, activeTab, openLogin, openSignup, closeModal, switchTab }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
