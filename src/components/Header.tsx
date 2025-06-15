import React, { useState } from 'react';
import { ArrowLeft, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { signOut } from '../lib/supabase';
import LanguageSwitcher from './LanguageSwitcher';
import AuthModal from './AuthModal';

interface HeaderProps {
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ showBackButton, onBack, title, subtitle }) => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSignOut = async () => {
    console.log('🔄 Header: Sign out triggered');
    
    try {
      await signOut();
      console.log('✅ Header: Sign out completed');
    } catch (error) {
      console.error('❌ Header: Sign out error:', error);
    }
  };

  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/20 to-transparent backdrop-blur-sm">
        <div className="flex items-center justify-between p-4 sm:p-6">
          {/* Left side - Back button */}
          <div className="flex items-center">
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors touch-manipulation"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>

          {/* Center - Title and subtitle */}
          {title && (
            <div className="flex-1 text-center mx-4">
              <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
              {subtitle && (
                <p className="text-gray-300 text-sm sm:text-base">{subtitle}</p>
              )}
            </div>
          )}

          {/* Right side - Language switcher and Auth components */}
          <div className="flex items-center space-x-3">
            {/* Language switcher */}
            <LanguageSwitcher />

            {/* Auth section */}
            {loading ? (
              <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                {/* User info */}
                <div className="hidden sm:flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-2">
                  <User className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-white max-w-32 truncate">
                    {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]}
                  </span>
                </div>
                
                {/* Mobile user indicator */}
                <div className="sm:hidden w-8 h-8 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-purple-400" />
                </div>

                {/* Sign out button */}
                <button
                  onClick={handleSignOut}
                  className="p-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full transition-colors touch-manipulation"
                  title={t('landing.signOut')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Sign in button */
              <button
                onClick={handleSignIn}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full px-4 py-2 transition-all touch-manipulation"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">{t('landing.signIn')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode="signin"
        onModeChange={() => {}}
      />
    </>
  );
};

export default Header;