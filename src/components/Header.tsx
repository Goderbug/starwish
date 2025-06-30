import React from 'react';
import { ArrowLeft, LogIn, LogOut, User, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { signOut } from '../lib/supabase';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  showBackButton?: boolean;
  onBack?: () => void;
  onAuthRequired?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  showBackButton, 
  onBack, 
  onAuthRequired 
}) => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    console.log('🔄 Header: 开始登出');
    
    try {
      await signOut();
      console.log('✅ Header: 登出完成');
    } catch (error) {
      console.error('❌ Header: 登出错误:', error);
    }
  };

  const handleSignIn = () => {
    console.log('🔐 Header: 触发登录');
    if (onAuthRequired) {
      onAuthRequired();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/20 to-transparent backdrop-blur-sm">
      <div className="flex items-center justify-between p-4 sm:p-6">
        {/* Left side - Logo (只在首页显示) 和 Back button */}
        <div className="flex items-center space-x-4">
          {/* Logo - 只在非back button页面显示，避免挤压 */}
          {!showBackButton && (
            <div className="flex items-center">
              <svg 
                width="218" 
                height="48" 
                viewBox="0 0 218 48" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="h-[36px] w-auto transition-all duration-300"
              >
                <path d="M17.8564 23.0201V22.9832" stroke="white" strokeWidth="4.90182" strokeLinecap="round"/>
                <path d="M28.6447 22.7778V22.8142" stroke="white" strokeWidth="4.90182" strokeLinecap="round"/>
                <path d="M18.8334 28.8859C18.9777 28.9748 19.3852 29.2523 19.8579 29.5197C20.2783 29.7574 20.9996 29.8948 21.851 30.0476C23.4009 30.3257 24.2713 30.0108 24.8138 29.9007C25.4753 29.7666 26.3446 29.4909 26.9859 29.2275C27.0845 29.1636 27.1909 29.0797 27.2816 29.0149C27.3722 28.9501 27.4439 28.907 27.5784 28.8626" stroke="white" strokeWidth="2.45091" strokeLinecap="round"/>
                <path d="M17.5083 16.2401C17.7545 15.8844 20.3019 13.1961 22.0078 11.3291C23.4459 9.75527 24.1156 8.58773 25.2452 7.6719C25.5178 7.45089 25.7896 7.22234 25.9818 7.18805C26.8321 7.03635 27.1375 9.30504 27.6138 10.3368C28.2178 11.645 28.4338 12.4622 28.8817 13.4829C29.4619 14.5584 30.1137 15.8393 30.5936 16.9051C30.6973 17.1274 30.8248 17.3464 30.9495 17.5097" stroke="white" strokeWidth="2.45091" strokeLinecap="round"/>
                <path d="M14.4947 17.2072C14.114 17.158 13.2269 17.1139 12.0783 16.968C9.67021 16.662 6.41134 16.5904 4.36565 16.6278C3.01022 16.6526 5.81725 19.3584 6.3942 20.161C7.31317 21.4394 8.2425 22.9038 8.99779 23.9612C9.60224 24.8028 10.1075 25.2965 10.5292 25.6915C10.7245 25.8719 10.882 26.0115 11.2374 26.543" stroke="white" strokeWidth="2.45091" strokeLinecap="round"/>
                <path d="M12.731 30.55C12.0444 31.7913 11.1764 34.1831 10.7008 35.7902C10.4311 36.7015 10.0966 37.5719 9.69437 38.376C9.58362 38.5974 9.48943 38.8676 9.55125 38.9724C10.0904 39.8868 12.2993 38.2419 13.5658 37.8139C15.2959 37.2291 17.0968 36.3021 18.1004 35.747C18.5645 35.5328 19.0765 35.4093 19.5873 35.3496C19.8319 35.3101 20.0465 35.2517 20.7876 35.074" stroke="white" strokeWidth="2.45091" strokeLinecap="round"/>
                <path d="M24.2476 35.4896C25.4355 36.4644 29.3528 39.1366 31.3255 40.1615C31.9958 40.5097 32.5593 40.7058 32.9509 40.8083C33.1375 40.857 33.3233 40.7464 33.4248 40.3981C33.9845 38.4792 33.2813 36.6367 33.2011 35.5011C33.108 34.348 33.0004 33.5121 32.9488 33.0994C32.9192 32.8982 32.8829 32.7138 32.747 32.2176" stroke="white" strokeWidth="2.45091" strokeLinecap="round"/>
                <path d="M36.1182 29.4354C37.0253 28.6752 39.4822 27.3174 40.9384 26.5072C42.3444 25.7248 42.944 24.9498 43.668 24.4717C43.836 24.3607 43.9634 24.2051 43.991 24.0495C44.17 23.0389 41.6315 22.3854 40.6672 21.9749C40.0923 21.7676 37.9693 21.1905 35.149 20.4658C34.1189 20.2067 33.9032 20.1684 33.3146 20.0798" stroke="white" strokeWidth="2.45091" strokeLinecap="round"/>
                <path d="M76.4057 17.5007C76.3442 17.0754 75.9459 15.6479 75.0405 14.4031C73.4853 12.2647 70.0987 12.171 68.228 12.0014C64.4694 11.6605 62.1681 12.1946 59.9698 12.9206C59.1789 13.1818 58.7992 13.9526 58.4473 14.6922C57.5625 16.5519 58.2096 19.168 58.5272 20.5234C58.8523 21.9106 60.291 22.9882 62.0463 23.9124C65.413 25.6851 71.8511 25.6977 73.9129 25.9437C75.63 26.1485 76.8237 26.8496 77.3366 27.4282C77.9967 28.1727 78.156 29.2566 78.1004 30.2009C77.9906 32.0676 76.1867 33.2548 74.912 34.469C73.538 35.7778 70.8238 36.0192 66.1886 36.1025C63.0386 36.1591 60.8914 34.4778 59.6196 33.3443C59.2594 32.7446 58.9405 32.0334 58.669 31.2789C58.5565 30.911 58.495 30.5733 58.4304 30.1338" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                <path d="M82.791 26.4122C83.3563 26.2053 86.999 25.8985 89.6517 25.6936C91.7168 25.6869 93.3991 25.8657 94.8128 26.0469C95.1911 26.0881 95.5958 26.1304 96.4666 26.0863" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                <path d="M92.1498 18.384C91.8212 19.0104 90.9156 21.4754 90.2308 23.6069C89.4647 25.9914 88.8266 27.9965 88.7047 31.2892C88.665 32.361 88.9835 33.0571 89.2935 33.7213C90.5468 34.824 92.9103 35.3561 94.7359 35.1838C95.1366 35.1289 95.5209 35.0965 96.2633 34.7125" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                <path d="M110.652 26.0052C110.652 25.9473 110.146 25.3479 109.216 24.4042C108.573 23.7507 107.752 23.7021 106.98 23.8014C105.392 24.0057 104.413 25.5346 103.644 26.8365C102.696 28.4422 102.456 30.1535 102.349 31.9098C102.301 32.693 102.774 33.4046 103.22 34.0647C103.638 34.6838 104.507 34.9622 105.442 35.1998C106.39 35.4409 107.323 35.1391 108.064 34.6856C109.462 33.8304 110.913 31.1464 111.925 29.3314C112.106 29.0083 112.334 28.74 112.426 28.819C113.587 29.8203 112.589 32.3102 113.389 33.495C114.77 34.2027 116.285 34.4324 117.254 34.3312C117.689 34.2299 118.011 34.0274 118.342 33.8187" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                <path d="M123.075 22.1043C123.107 24.7747 123.043 28.5156 122.746 30.4865C122.459 32.3987 122.073 33.717 121.956 35.3613C121.878 36.4629 122.648 32.5926 123.347 30.8409C123.943 29.3502 125.079 28.1572 126.496 26.7112C127.827 25.95 129.58 25.7028 131.252 25.4514C131.82 25.229 131.819 24.814 131.818 24.3865" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                <path d="M137.908 14.7205C137.875 15.6355 138.495 21.7711 139.591 26.9445C140.129 29.4851 141.089 31.4778 141.955 32.9187C142.424 33.701 143.306 34.0151 144.035 34.3208C144.973 34.7139 145.98 34.6386 146.726 34.3006C148.517 33.4885 148.606 31.1065 149.363 28.9991C150.508 25.8081 150.36 24.1083 150.656 22.1778C150.923 20.4303 151.286 18.9943 151.657 17.716C152.582 14.5271 151.574 26.3636 151.925 28.5543C152.189 30.1988 152.417 31.6917 152.869 33.0576C153.086 33.7116 153.574 34.248 154.121 34.7118C154.674 35.1809 155.89 35.2832 157.301 35.2599C159.733 35.2197 163.342 31.1089 165.852 27.7884C167.707 25.3349 168.913 22.8741 169.434 20.6965C169.775 19.2699 169.448 18.0559 169.08 17.4459C168.28 16.1186 166.337 16.4389 164.801 16.3861C163.208 16.3314 162.032 18.0592 161.223 19.3389C160.219 20.9277 160.734 22.8495 161.31 24.2369C161.997 25.8892 164.052 26.4014 167.003 26.8961C171.754 26.9934 175.222 26.9547 175.914 26.7619C176.257 26.6407 176.584 26.4723 177.396 25.8303" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                <path d="M178.359 20.4913C178.359 20.4624 178.359 20.4335 178.445 20.2739C178.53 20.1143 178.702 19.825 179.05 20.1315" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                <path d="M177.93 26.2896C177.684 27.0108 176.976 28.7141 176.673 30.2434C176.374 31.8508 176.105 33.7709 176.47 35.0236C176.691 35.2043 177.041 35.2285 177.05 35.1657" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                <path d="M191.036 24.4529C190.978 24.395 190.622 24.2205 189.957 24.0156C189.301 23.8138 188.571 24.1661 187.908 24.5043C187.267 24.8313 186.84 25.4217 186.566 26.0662C186.425 26.3957 186.472 26.7953 186.593 27.144C187.078 28.5393 188.92 28.8825 191.703 30.2817C192.29 30.577 192.283 31.0348 192.298 31.3995C192.357 32.8297 190.962 33.9225 189.751 34.6159C189.021 34.8315 187.967 34.9552 186.847 34.836C186.389 34.6884 186.154 34.3636 185.643 33.2884" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                <path d="M202.796 24.2791C204.612 22.8995 207.07 20.1919 208.137 17.9093C208.92 16.2324 208.328 14.4382 207.628 13.3376C207.451 13.0606 207.044 13.0146 206.693 12.9692C205.118 12.7657 203.817 15.0441 203.025 16.4772C201.631 19.0012 200.978 23.0105 200.578 25.8673C200.285 27.9526 200.236 30.3112 199.978 31.8145C199.844 32.598 199.695 33.4599 199.68 33.8258C199.592 35.9642 201.396 29.8675 202.435 28.5746C203.583 27.1455 205.557 26.1094 207.252 25.734C208.372 25.4859 209.385 25.8051 210.093 26.0334C210.926 26.3019 211.633 26.7918 212 27.5647C211.935 29.4056 211.008 31.6178 210.146 34.0077C210.013 34.5454 209.981 34.9712 210.431 35.2738" stroke="white" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            </div>
          )}

          {/* Back button - 只在需要时显示，不会被logo挤压 */}
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors touch-manipulation h-10 w-10 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Center - Empty space for better balance */}
        <div className="flex-1"></div>

        {/* Right side - Language switcher, Auth components, and Bolt badge */}
        <div className="flex items-center space-x-3">
          {/* Language switcher */}
          <LanguageSwitcher />

          {/* Auth section */}
          {loading ? (
            <div className="w-10 h-10 border-2 border-purple-400 border-t-transparent rounded-full animate-spin flex items-center justify-center"></div>
          ) : user ? (
            <div className="flex items-center space-x-3">
              {/* User info */}
              <div className="hidden sm:flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-2 h-10">
                <User className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white max-w-32 truncate">
                  {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]}
                </span>
              </div>
              
              {/* Mobile user indicator */}
              <div className="sm:hidden w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-purple-400" />
              </div>

              {/* Sign out button */}
              <button
                onClick={handleSignOut}
                className="p-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full transition-colors touch-manipulation h-10 w-10 flex items-center justify-center"
                title={t('landing.signOut')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Sign in button */
            <button
              onClick={handleSignIn}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full px-4 py-2 transition-all touch-manipulation h-10"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">{t('landing.signIn')}</span>
            </button>
          )}

          {/* Bolt.new Badge with Custom Image */}
          <a 
            href="https://bolt.new/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center h-10 w-10 rounded-full hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
            title="Built with Bolt.new"
          >
            <img 
              src="/white_circle_360x360 copy copy copy.png" 
              alt="Built with Bolt.new" 
              className="w-10 h-10 rounded-full object-cover"
            />
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;