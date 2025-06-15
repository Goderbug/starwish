import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import CreateWish from './components/CreateWish';
import WishManager from './components/WishManager';
import BlindBox from './components/BlindBox';
import ShareHistory from './components/ShareHistory';
import ReceivedWishes from './components/ReceivedWishes';
import { supabase, Wish } from './lib/supabase';
import { useLanguage } from './contexts/LanguageContext';

// Main App component wrapped with language context
const AppContent: React.FC = () => {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'landing' | 'create' | 'manage' | 'blindbox' | 'shareHistory' | 'receivedWishes'>('landing');
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [sharedBoxId, setSharedBoxId] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);

  // Check if accessing via shared link
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const boxId = urlParams.get('box');
    if (boxId) {
      setSharedBoxId(boxId);
      setCurrentPage('blindbox');
    }
  }, []);

  // Load wishes from database when user is authenticated
  useEffect(() => {
    if (user) {
      fetchWishes();
    } else {
      setWishes([]);
    }
  }, [user]);

  const fetchWishes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wishes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching wishes:', error);
        setAppError('Failed to load wishes');
        return;
      }
      
      setWishes(data || []);
      setAppError(null);
    } catch (error) {
      console.error('Error fetching wishes:', error);
      setAppError('Failed to connect to database');
    }
  };

  const addWish = async (wishData: Omit<Wish, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wishes')
        .insert({
          ...wishData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      setWishes(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error adding wish:', error);
      setAppError('Failed to create wish');
    }
  };

  const deleteWish = async (id: string) => {
    try {
      const { error } = await supabase
        .from('wishes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setWishes(prev => prev.filter(wish => wish.id !== id));
    } catch (error) {
      console.error('Error deleting wish:', error);
      setAppError('Failed to delete wish');
    }
  };

  const updateWish = async (id: string, updates: Partial<Wish>) => {
    try {
      const { error } = await supabase
        .from('wishes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setWishes(prev => prev.map(wish => 
        wish.id === id ? { ...wish, ...updates } : wish
      ));
    } catch (error) {
      console.error('Error updating wish:', error);
      setAppError('Failed to update wish');
    }
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
      case 'shareHistory':
        return {
          showBackButton: true,
          onBack: () => setCurrentPage('landing'),
          title: t('shareHistory.title'),
        };
      case 'receivedWishes':
        return {
          showBackButton: true,
          onBack: () => setCurrentPage('landing'),
          title: t('receivedWishes.title'),
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
          <p className="text-gray-500 text-sm mt-2">Connecting to services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white overflow-hidden">
      {/* Header */}
      <Header {...getHeaderProps()} />

      {/* Error message */}
      {appError && (
        <div className="fixed top-20 left-4 right-4 z-40 bg-red-500/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
          <p className="text-red-400 text-sm text-center">{appError}</p>
          <button 
            onClick={() => setAppError(null)}
            className="absolute top-2 right-2 text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

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

        {currentPage === 'create' && user && (
          <CreateWish 
            onAddWish={addWish}
            onBack={() => setCurrentPage('landing')}
          />
        )}

        {currentPage === 'manage' && user && (
          <WishManager 
            wishes={wishes}
            onDeleteWish={deleteWish}
            onUpdateWish={updateWish}
            onBack={() => setCurrentPage('landing')}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'shareHistory' && user && (
          <ShareHistory />
        )}

        {currentPage === 'receivedWishes' && (
          <ReceivedWishes />
        )}

        {currentPage === 'blindbox' && (
          <BlindBox 
            boxId={sharedBoxId}
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