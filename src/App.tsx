import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import CreateWish from './components/CreateWish';
import WishManager from './components/WishManager';
import BlindBox from './components/BlindBox';
import { WishData } from './types/wish';
import { useLanguage } from './contexts/LanguageContext';

// Main App component wrapped with language context
const AppContent: React.FC = () => {
  const { t } = useLanguage();
  const [currentPage, setCurrentPage] = useState<'landing' | 'create' | 'manage' | 'blindbox'>('landing');
  const [wishes, setWishes] = useState<WishData[]>([]);
  const [sharedBoxId, setSharedBoxId] = useState<string | null>(null);

  // Check if accessing via shared link
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const boxId = urlParams.get('box');
    if (boxId) {
      setSharedBoxId(boxId);
      setCurrentPage('blindbox');
    }
  }, []);

  // Load wishes from localStorage
  useEffect(() => {
    const savedWishes = localStorage.getItem('starwishes');
    if (savedWishes) {
      setWishes(JSON.parse(savedWishes));
    }
  }, []);

  // Save wishes to localStorage
  useEffect(() => {
    localStorage.setItem('starwishes', JSON.stringify(wishes));
  }, [wishes]);

  const addWish = (wish: Omit<WishData, 'id' | 'createdAt'>) => {
    const newWish: WishData = {
      ...wish,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setWishes(prev => [...prev, newWish]);
  };

  const deleteWish = (id: string) => {
    setWishes(prev => prev.filter(wish => wish.id !== id));
  };

  const updateWish = (id: string, updates: Partial<WishData>) => {
    setWishes(prev => prev.map(wish => 
      wish.id === id ? { ...wish, ...updates } : wish
    ));
  };

  // Get header props based on current page
  const getHeaderProps = () => {
    switch (currentPage) {
      case 'create':
        return {
          showBackButton: true,
          onBack: () => setCurrentPage('landing'),
          title: t('create.title'),
        };
      case 'manage':
        return {
          showBackButton: true,
          onBack: () => setCurrentPage('landing'),
          title: t('manager.title'),
          subtitle: `${wishes.length} ${t('manager.subtitle')}`,
        };
      case 'blindbox':
        return {
          showBackButton: true,
          onBack: () => setCurrentPage('landing'),
        };
      default:
        return {};
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white overflow-hidden">
      {/* Header */}
      <Header {...getHeaderProps()} />

      {/* Animated background stars */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main content with top padding to account for header */}
      <div className="pt-20 sm:pt-24">
        {currentPage === 'landing' && (
          <LandingPage 
            onNavigate={setCurrentPage}
            wishCount={wishes.length}
          />
        )}

        {currentPage === 'create' && (
          <CreateWish 
            onAddWish={addWish}
            onBack={() => setCurrentPage('landing')}
          />
        )}

        {currentPage === 'manage' && (
          <WishManager 
            wishes={wishes}
            onDeleteWish={deleteWish}
            onUpdateWish={updateWish}
            onBack={() => setCurrentPage('landing')}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'blindbox' && (
          <BlindBox 
            boxId={sharedBoxId}
            wishes={wishes}
            onBack={() => setCurrentPage('landing')}
          />
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;