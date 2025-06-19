import React, { useEffect, useState } from 'react';
import { Star, Heart, Sparkles, Gift, Plus, List, ArrowRight, Wand2, Link, History, Inbox } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { User } from '@supabase/supabase-js';
import { Wish } from '../lib/supabase';

interface LandingPageProps {
  onNavigate: (page: 'create' | 'manage' | 'shareHistory' | 'receivedWishes') => void;
  wishCount: number;
  onAuthRequired: () => void;
  user: User | null;
  loading: boolean;
  wishes?: Wish[];
}

interface WishStar {
  id: string;
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleDelay: number;
  color: string;
  wish: Wish;
}

interface ShootingStar {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  delay: number;
}

const LandingPage: React.FC<LandingPageProps> = ({ 
  onNavigate, 
  wishCount, 
  onAuthRequired, 
  user, 
  loading,
  wishes = []
}) => {
  const { t } = useLanguage();
  const [wishStars, setWishStars] = useState<WishStar[]>([]);
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);
  const [showShootingStarMessage, setShowShootingStarMessage] = useState(false);

  // 根据星愿类型获取颜色
  const getWishStarColor = (category: string, priority: string) => {
    const colors = {
      gift: {
        low: '#fbbf24',    // yellow-400
        medium: '#f59e0b', // yellow-500
        high: '#d97706'    // yellow-600
      },
      experience: {
        low: '#a78bfa',    // violet-400
        medium: '#8b5cf6', // violet-500
        high: '#7c3aed'    // violet-600
      },
      moment: {
        low: '#60a5fa',    // blue-400
        medium: '#3b82f6', // blue-500
        high: '#2563eb'    // blue-600
      }
    };
    return colors[category]?.[priority] || '#fbbf24';
  };

  // 生成星愿星星
  useEffect(() => {
    if (user && wishes.length > 0) {
      const stars: WishStar[] = wishes.map((wish, index) => ({
        id: wish.id,
        x: Math.random() * 100,
        y: Math.random() * 80, // 避免与内容重叠
        size: wish.priority === 'high' ? 6 : wish.priority === 'medium' ? 4 : 3,
        brightness: wish.priority === 'high' ? 1 : wish.priority === 'medium' ? 0.8 : 0.6,
        twinkleDelay: Math.random() * 3,
        color: getWishStarColor(wish.category, wish.priority),
        wish
      }));
      setWishStars(stars);
    } else {
      setWishStars([]);
    }
  }, [user, wishes]);

  // 生成流星效果（仅当用户登录但没有星愿时）
  useEffect(() => {
    if (user && wishes.length === 0) {
      const generateShootingStar = () => {
        const star: ShootingStar = {
          id: Math.random().toString(36).substr(2, 9),
          startX: Math.random() * 100,
          startY: Math.random() * 30,
          endX: Math.random() * 100,
          endY: Math.random() * 30 + 40,
          duration: 2 + Math.random() * 2,
          delay: Math.random() * 5
        };
        return star;
      };

      // 创建初始流星
      const initialStars = Array.from({ length: 3 }, generateShootingStar);
      setShootingStars(initialStars);

      // 显示引导消息
      const messageTimer = setTimeout(() => {
        setShowShootingStarMessage(true);
      }, 2000);

      // 定期生成新流星
      const interval = setInterval(() => {
        setShootingStars(prev => {
          const newStar = generateShootingStar();
          return [...prev.slice(-2), newStar]; // 保持最多3颗流星
        });
      }, 4000);

      return () => {
        clearTimeout(messageTimer);
        clearInterval(interval);
      };
    } else {
      setShootingStars([]);
      setShowShootingStarMessage(false);
    }
  }, [user, wishes.length]);

  // 如果还在加载中，显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8 overflow-hidden">
      {/* 星愿星空背景 */}
      <div className="fixed inset-0 pointer-events-none">
        {/* 用户的星愿星星 */}
        {wishStars.map((star) => (
          <div
            key={star.id}
            className="absolute group cursor-pointer pointer-events-auto"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            title={star.wish.title}
          >
            {/* 星星本体 */}
            <div
              className="relative animate-pulse"
              style={{
                animationDelay: `${star.twinkleDelay}s`,
                animationDuration: `${2 + Math.random()}s`,
              }}
            >
              <Star
                className="drop-shadow-lg transition-all duration-300 group-hover:scale-150"
                style={{
                  width: `${star.size * 4}px`,
                  height: `${star.size * 4}px`,
                  color: star.color,
                  opacity: star.brightness,
                  filter: `drop-shadow(0 0 ${star.size * 2}px ${star.color}40)`,
                }}
                fill="currentColor"
              />
              
              {/* 星星光晕 */}
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{
                  background: `radial-gradient(circle, ${star.color}40 0%, transparent 70%)`,
                  animationDelay: `${star.twinkleDelay + 1}s`,
                  animationDuration: '3s',
                }}
              />
            </div>

            {/* 悬停时显示的星愿信息 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap border border-white/20">
                <div className="font-medium">{star.wish.title}</div>
                <div className="text-gray-300 text-xs">
                  {star.wish.category} • {star.wish.priority}
                </div>
              </div>
              {/* 小箭头 */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
            </div>
          </div>
        ))}

        {/* 流星效果（仅当没有星愿时显示） */}
        {shootingStars.map((star) => (
          <div
            key={star.id}
            className="absolute pointer-events-none"
            style={{
              left: `${star.startX}%`,
              top: `${star.startY}%`,
              animation: `shootingStar ${star.duration}s linear ${star.delay}s infinite`,
              '--end-x': `${star.endX - star.startX}vw`,
              '--end-y': `${star.endY - star.startY}vh`,
            } as React.CSSProperties}
          >
            <div className="w-2 h-2 bg-gradient-to-r from-yellow-300 to-transparent rounded-full">
              <div className="absolute inset-0 bg-yellow-300 rounded-full animate-pulse"></div>
              {/* 流星尾巴 */}
              <div className="absolute top-1/2 left-0 w-8 h-0.5 bg-gradient-to-r from-yellow-300/80 to-transparent transform -translate-y-1/2 -translate-x-full"></div>
            </div>
          </div>
        ))}

        {/* 背景装饰星星（静态） */}
        {[...Array(30)].map((_, i) => (
          <div
            key={`bg-star-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full opacity-40 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* 流星引导气泡 */}
      {showShootingStarMessage && user && wishes.length === 0 && (
        <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
          <div className="bg-gradient-to-r from-purple-500/90 to-pink-500/90 backdrop-blur-sm text-white px-6 py-4 rounded-2xl border border-white/20 shadow-xl max-w-sm text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="font-medium">流星划过夜空</span>
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <p className="text-sm text-purple-100 mb-3">
              快来播种你的第一颗星愿，让夜空绽放属于你的星光！
            </p>
            <button
              onClick={() => onNavigate('create')}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              播种星愿 ✨
            </button>
          </div>
          {/* 气泡尾巴 */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-purple-500/90"></div>
        </div>
      )}

      {/* Main content with top padding to account for header */}
      <div className="text-center max-w-4xl mx-auto relative z-10 w-full">
        {/* Logo area */}
        <div className="mb-6 sm:mb-8 relative">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 mb-4 sm:mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse"></div>
            <Star className="w-10 h-10 sm:w-12 sm:h-12 text-white relative z-10" fill="currentColor" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent mb-2 sm:mb-4 leading-tight">
            {t('landing.title')}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 font-light">
            {t('landing.subtitle')}
          </p>
        </div>

        {/* Stats - 只有在用户登录且有星愿时显示 */}
        {user && wishCount > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="inline-flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-full px-6 sm:px-8 py-3 sm:py-4 border border-white/20">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" fill="currentColor" />
                <span className="text-sm sm:text-base font-medium">
                  {wishCount} {t('landing.wishesPlanted')}
                </span>
              </div>
              <div className="w-px h-6 bg-white/20"></div>
              <div className="text-xs sm:text-sm text-gray-300">
                ✨ 夜空中闪烁着你的星愿
              </div>
            </div>
          </div>
        )}

        {/* Auth required message for non-authenticated users - 只有在确定未登录时显示 */}
        {!user && (
          <div className="mb-8 p-6 bg-purple-500/20 backdrop-blur-sm rounded-2xl border border-purple-400/30">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" fill="currentColor" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">{t('auth.signInRequired')}</h3>
              <p className="text-purple-200 text-sm sm:text-base mb-6">
                {t('auth.signInDescription')}
              </p>
            </div>
            
            <button
              onClick={onAuthRequired}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-xl transition-all touch-manipulation font-medium"
            >
              {t('landing.signIn')}
            </button>
          </div>
        )}

        {/* Action buttons - 只有在用户登录时显示 */}
        {user && (
          <div className="flex flex-col gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-16 px-4">
            <button
              onClick={() => onNavigate('create')}
              className="group w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 sm:px-8 py-4 rounded-full text-base sm:text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 min-h-[56px]"
            >
              <Plus className="w-5 h-5" />
              <span>{wishCount === 0 ? '播种第一颗星愿' : t('landing.plantWish')}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {wishCount > 0 && (
              <button
                onClick={() => onNavigate('manage')}
                className="group w-full sm:w-auto bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-6 sm:px-8 py-4 rounded-full text-base sm:text-lg font-semibold transition-all duration-300 border border-white/20 hover:border-white/30 flex items-center justify-center space-x-2 min-h-[56px]"
              >
                <List className="w-5 h-5" />
                <span>{t('landing.manageWishes')}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {/* Additional navigation buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => onNavigate('shareHistory')}
                className="group flex-1 sm:flex-initial bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white px-4 sm:px-6 py-3 rounded-full text-sm sm:text-base font-medium transition-all border border-white/10 hover:border-white/20 flex items-center justify-center space-x-2"
              >
                <History className="w-4 h-4" />
                <span>{t('landing.shareHistory')}</span>
              </button>
              
              <button
                onClick={() => onNavigate('receivedWishes')}
                className="group flex-1 sm:flex-initial bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white px-4 sm:px-6 py-3 rounded-full text-sm sm:text-base font-medium transition-all border border-white/10 hover:border-white/20 flex items-center justify-center space-x-2"
              >
                <Inbox className="w-4 h-4" />
                <span>{t('landing.receivedWishes')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Features showcase */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8 px-2">
          <div className="text-left p-6 sm:p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:bg-white/10 transition-all duration-300 group">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
              <Wand2 className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-white">{t('landing.feature1.title')}</h3>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              {t('landing.feature1.desc')}
            </p>
          </div>

          <div className="text-left p-6 sm:p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:bg-white/10 transition-all duration-300 group">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
              <Link className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-white">{t('landing.feature2.title')}</h3>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              {t('landing.feature2.desc')}
            </p>
          </div>

          <div className="text-left p-6 sm:p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:bg-white/10 transition-all duration-300 group">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-pink-400 to-yellow-400 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-white">{t('landing.feature3.title')}</h3>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              {t('landing.feature3.desc')}
            </p>
          </div>
        </div>
      </div>

      {/* Decorative elements - hidden on mobile for cleaner look */}
      <div className="fixed bottom-10 left-10 opacity-20 hidden sm:block">
        <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300 animate-spin" style={{ animationDuration: '8s' }} />
      </div>
      <div className="fixed top-20 right-20 opacity-20 hidden sm:block">
        <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-300 animate-bounce" />
      </div>

      {/* CSS for shooting star animation */}
      <style jsx>{`
        @keyframes shootingStar {
          0% {
            transform: translate(0, 0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--end-x), var(--end-y));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;