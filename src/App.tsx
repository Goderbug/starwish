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
import AuthModal from './components/AuthModal';
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
  
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check if accessing via shared link
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const boxId = urlParams.get('box');
    if (boxId) {
      setSharedBoxId(boxId);
      setCurrentPage('blindbox');
    }
  }, []);

  // ✅ 优化：减少重复数据获取和日志
  useEffect(() => {
    if (loading) {
      return;
    }

    if (user) {
      // 只在开发环境显示日志
      if (import.meta.env.DEV) {
        console.log('✅ 用户已登录，加载星愿数据:', user.email);
      }
      fetchWishes();
    } else {
      setWishes([]);
      if (currentPage !== 'blindbox') {
        setCurrentPage('landing');
      }
    }
  }, [user, loading, currentPage]);

  const fetchWishes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wishes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ 获取星愿失败:', error);
        setAppError('Failed to load wishes');
        return;
      }
      
      // 只在开发环境或数据变化时显示日志
      if (import.meta.env.DEV) {
        console.log('✅ 星愿数据加载成功:', data?.length || 0, '个');
      }
      setWishes(data || []);
      setAppError(null);
    } catch (error) {
      console.error('❌ 获取星愿异常:', error);
      setAppError('Failed to connect to database');
    }
  };

  const addWish = async (wishData: Omit<Wish, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

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
      
      // 只在开发环境显示日志
      if (import.meta.env.DEV) {
        console.log('✅ 星愿创建成功:', data.title);
      }
      
      setWishes(prev => [data, ...prev]);
      setCurrentPage('manage');
    } catch (error) {
      console.error('❌ 创建星愿失败:', error);
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

  const handleAuthRequired = () => {
    setShowAuthModal(true);
  };

  // Get header props based on current page
  const getHeaderProps = () => {
    switch (currentPage) {
      case 'create':
        return {
          showBackButton: true,
          onBack: () => setCurrentPage('landing'),
          onAuthRequired: handleAuthRequired,
        };
      case 'manage':
        return {
          showBackButton: true,
          onBack: () => setCurrentPage('landing'),
          onAuthRequired: handleAuthRequired,
        };
      case 'shareHistory':
        return {
          showBackButton: true,
          onBack: () => setCurrentPage('landing'),
          onAuthRequired: handleAuthRequired,
        };
      case 'receivedWishes':
        return {
          showBackButton: true,
          onBack: () => setCurrentPage('landing'),
          onAuthRequired: handleAuthRequired,
        };
      case 'blindbox':
        return {
          showBackButton: true,
          onBack: () => setCurrentPage('landing'),
          onAuthRequired: handleAuthRequired,
        };
      default:
        return {
          onAuthRequired: handleAuthRequired,
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-300 text-sm">初始化中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-white overflow-hidden">
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

      {/* Main content with top padding to account for header */}
      <div className="pt-20 sm:pt-24">
        {currentPage === 'landing' && (
          <LandingPage 
            onNavigate={setCurrentPage}
            wishCount={wishes.length}
            onAuthRequired={handleAuthRequired}
            user={user}
            loading={loading}
            wishes={wishes}
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

        {currentPage === 'shareHistory' && (
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

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode="signin"
        onModeChange={() => {}}
      />
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