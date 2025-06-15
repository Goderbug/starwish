import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Language {
  code: 'zh' | 'en' | 'ja' | 'ko' | 'es' | 'fr' | 'de';
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
];

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];
  const availableLanguages = languages.filter(lang => lang.code === 'zh' || lang.code === 'en'); // Currently only support zh and en

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageSelect = (langCode: 'zh' | 'en') => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full px-3 sm:px-4 py-2 sm:py-2.5 border border-white/20 hover:border-white/30 transition-all touch-manipulation"
      >
        <Globe className="w-4 h-4 text-white/80" />
        <span className="text-sm font-medium text-white hidden sm:inline">
          {currentLanguage.nativeName}
        </span>
        <span className="text-sm font-medium text-white sm:hidden">
          {currentLanguage.code.toUpperCase()}
        </span>
        <ChevronDown 
          className={`w-3 h-3 text-white/60 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown menu - Fixed positioning to align left */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 min-w-[160px] bg-gray-900/95 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden z-50">
          <div className="py-2">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code as 'zh' | 'en')}
                className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center justify-between ${
                  language === lang.code ? 'bg-white/10 text-white' : 'text-white/80'
                }`}
              >
                <div>
                  <div className="text-sm font-medium">{lang.nativeName}</div>
                  <div className="text-xs text-white/60">{lang.name}</div>
                </div>
                {language === lang.code && (
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
          
          {/* Future languages section */}
          <div className="border-t border-white/10 py-2">
            <div className="px-4 py-2">
              <div className="text-xs text-white/40 font-medium mb-2">Coming Soon</div>
              {languages.filter(lang => !availableLanguages.includes(lang)).slice(0, 3).map((lang) => (
                <div
                  key={lang.code}
                  className="flex items-center justify-between py-1 opacity-50"
                >
                  <div>
                    <div className="text-sm text-white/60">{lang.nativeName}</div>
                    <div className="text-xs text-white/40">{lang.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;