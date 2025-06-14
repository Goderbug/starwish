import React from 'react';
import { ArrowLeft } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ showBackButton, onBack, title, subtitle }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/20 to-transparent backdrop-blur-sm">
      <div className="flex items-center justify-between p-4 sm:p-6">
        {/* Left side - Back button or spacer */}
        <div className="flex items-center">
          {showBackButton && onBack ? (
            <button
              onClick={onBack}
              className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors mr-3 sm:mr-4 touch-manipulation"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14" /> // Spacer to balance layout
          )}
          
          {/* Title and subtitle */}
          {title && (
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
              {subtitle && (
                <p className="text-gray-300 text-sm sm:text-base">{subtitle}</p>
              )}
            </div>
          )}
        </div>

        {/* Right side - Language switcher */}
        <LanguageSwitcher />
      </div>
    </header>
  );
};

export default Header;