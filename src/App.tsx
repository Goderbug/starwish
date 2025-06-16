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
  const { user, loading, initialized } = useAuth();
  const [currentPage, setCurrentPage] = useState<'landing' | 'create' | 'manage' | 'blindbox' | 'shareHistory' | 'receivedWishes'>('landing');
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [sharedBoxId, setSharedBoxId] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  
  // 统一的登录模态框状态
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

  // Load wishes from database when user is authenticated
  useEffect(() => {
    // 只有在认证状态已初始化后才执行
    if (!initialized) {
      console.log('⏳ 认证状态未初始化，等待中...');
      return;
    }

    if (user) {
      console.log('✅ 用户已登录，加载星愿数据:', user.email);
      fetchWishes();
    } else {
      console.log('❌ 用户未登录，清空星愿数据');
      setWishes([]);
      // 只有在非盲盒页面时才跳转到首页
      if (currentPage !== 'blindbox') {
        console.log('🔄 跳转到首页');
        setCurrentPage('landing');
      }
    }
  }, [user, initialized, currentPage]);

  const fetchWishes = async () => {
    if (!user) return;

    try {
      console.log('📡 获取星愿数据...');
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
      
      console.log('✅ 星愿数据加载成功:', data?.length || 0, '个');
      setWishes(data || []);
      setAppError(null);
    } catch (error) {
      console.error('❌ 获取星愿异常:', error);
      setAppError('Failed to connect to database');
    }
  };

  const addWish = async (wishData: Omit<Wish, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      console.error('❌ 用户未登录，无法创建星愿');
      setShowAuthModal(true);
      return;
    }

    try {
      console.log('📝 创建新星愿:', wishData.title);
      const { data, error } = await supabase
        .from('wishes')
        .insert({
          ...wishData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ 星愿创建成功:', data.title);
      // 更新本地状态
      setWishes(prev => [data, ...prev]);
      
      // 创建成功后跳转到管理页面
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

  // 统一的登录处理函数
  const handleAuthRequired = () => {
    console.log('🔐 需要登录，显示登录模态框');
    setShowAuthModal(true);
  };

  // Get header props based on current page
  const getHeaderProps = () => {
    switch (currentPage) {
      case 'create':
        return {
          showBackButton: true,
          onBack: () => setCurrentPage('landing'),
          title: t('create.title'),
          onAuthRequired: handleAuthRequired,
        };
      case 'manage':
        return {
          showBackButton: true,
          onBack: () => setCurrentPage('landing'),
          title: t('manager.title'),
          subtitle: `${wishes.length} ${t('manager.subtitle')}`,
          onAuthRequired: handleAuthRequired,
        };
      case 'shareHistory':
        return {
          showBackButton: true,
          onBack: () => setCurrentPage('landing'),
          title: t('shareHistory.title'),
          onAuthRequired: handleAuthRequired,
        };
      case 'receivedWishes':
        return {
          showBackButton: true,
          onBack: () => setCurrentPage('landing'),
          title: t('receivedWishes.title'),
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

  // 显示加载状态，直到认证状态初始化完成
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-300 text-sm">初始化中...</p>
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
            onAuthRequired={handleAuthRequired}
            // 传递认证状态，确保组件能正确判断
            user={user}
            loading={loading}
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

      {/* 统一的登录模态框 */}
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