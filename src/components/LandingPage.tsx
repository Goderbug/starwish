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

// 6-pointed star SVG component
const SixPointedStar: React.FC<{ 
  size: number; 
  color: string; 
  brightness: number; 
  className?: string;
}> = ({ size, color, brightness, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    style={{ 
      filter: `drop-shadow(0 0 ${size * 0.3}px ${color}) drop-shadow(0 0 ${size * 0.6}px ${color}40)`,
      opacity: brightness
    }}
  >
    <path
      d="M12 2L14.09 8.26L20 9L14.09 15.74L12 22L9.91 15.74L4 9L9.91 8.26L12 2Z"
      fill={color}
      stroke={color}
      strokeWidth="0.5"
    />
    <path
      d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z"
      fill="white"
      opacity="0.8"
    />
  </svg>
);

// Halley's Comet component
const HalleysComet: React.FC<{ 
  startX: number; 
  startY: number; 
  endX: number; 
  endY: number; 
  duration: number; 
  delay: number; 
}> = ({ startX, startY, endX, endY, duration, delay }) => (
  <div
    className="absolute pointer-events-none"
    style={{
      left: `${startX}%`,
      top: `${startY}%`,
      animation: `halleysComet ${duration}s linear ${delay}s infinite`,
      '--end-x': `${endX - startX}vw`,
      '--end-y': `${endY - startY}vh`,
    } as React.CSSProperties}
  >
    {/* Comet head */}
    <div className="relative">
      <div className="w-3 h-3 bg-gradient-to-r from-blue-200 via-white to-yellow-200 rounded-full relative z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-yellow-300 rounded-full animate-pulse"></div>
        <div className="absolute inset-0.5 bg-white rounded-full opacity-90"></div>
      </div>
      
      {/* Comet tail - multiple layers for realistic effect */}
      <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-full">
        {/* Main tail */}
        <div className="w-16 h-1 bg-gradient-to-r from-blue-300/80 via-cyan-200/60 to-transparent rounded-full"></div>
        {/* Secondary tail */}
        <div className="w-12 h-0.5 bg-gradient-to-r from-yellow-200/70 via-orange-200/50 to-transparent rounded-full mt-0.5"></div>
        {/* Dust trail */}
        <div className="w-20 h-2 bg-gradient-to-r from-blue-100/40 via-cyan-100/30 to-transparent rounded-full -mt-1 blur-sm"></div>
      </div>
      
      {/* Sparkle effects around comet head */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
          style={{
            left: `${Math.cos(i * 60 * Math.PI / 180) * 8}px`,
            top: `${Math.sin(i * 60 * Math.PI / 180) * 8}px`,
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  </div>
);

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

  // 生成围绕中心区域的星愿星星位置
  const generateStarPosition = (index: number, total: number) => {
    // 创建多个同心圆环，星星围绕中心分布
    const rings = Math.ceil(total / 8); // 每环最多8颗星
    const currentRing = Math.floor(index / 8);
    const positionInRing = index % 8;
    
    // 基础半径和角度
    const baseRadius = 25 + currentRing * 15; // 从25%开始，每环增加15%
    const angleStep = (2 * Math.PI) / Math.min(8, total - currentRing * 8);
    const angle = positionInRing * angleStep + (currentRing * Math.PI / 8); // 每环稍微旋转
    
    // 添加一些随机偏移让分布更自然
    const radiusOffset = (Math.random() - 0.5) * 8;
    const angleOffset = (Math.random() - 0.5) * 0.3;
    
    const finalRadius = baseRadius + radiusOffset;
    const finalAngle = angle + angleOffset;
    
    // 计算相对于中心的位置
    const centerX = 50; // 页面中心
    const centerY = 45; // 稍微偏上，避开内容区域
    
    const x = centerX + Math.cos(finalAngle) * finalRadius;
    const y = centerY + Math.sin(finalAngle) * finalRadius * 0.6; // 垂直方向压缩，更符合视觉效果
    
    // 确保星星在可见区域内
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(10, Math.min(80, y))
    };
  };

  // 生成星愿星星
  useEffect(() => {
    if (user && wishes.length > 0) {
      const stars: WishStar[] = wishes.map((wish, index) => {
        const position = generateStarPosition(index, wishes.length);
        return {
          id: wish.id,
          x: position.x,
          y: position.y,
          size: wish.priority === 'high' ? 32 : wish.priority === 'medium' ? 28 : 24,
          brightness: wish.priority === 'high' ? 1 : wish.priority === 'medium' ? 0.9 : 0.8,
          twinkleDelay: Math.random() * 3,
          color: getWishStarColor(wish.category, wish.priority),
          wish
        };
      });
      setWishStars(stars);
    } else {
      setWishStars([]);
    }
  }, [user, wishes]);

  // 生成哈雷彗星效果（仅当用户登录但没有星愿时）
  useEffect(() => {
    if (user && wishes.length === 0) {
      const generateComet = () => {
        const comet: ShootingStar = {
          id: Math.random().toString(36).substr(2, 9),
          startX: Math.random() * 30, // 从左侧开始
          startY: Math.random() * 40 + 10, // 上半部分
          endX: Math.random() * 30 + 60, // 到右侧结束
          endY: Math.random() * 40 + 40, // 下半部分
          duration: 4 + Math.random() * 3, // 更慢的速度，更优雅
          delay: Math.random() * 8
        };
        return comet;
      };

      // 创建初始彗星
      const initialComets = Array.from({ length: 2 }, generateComet);
      setShootingStars(initialComets);

      // 显示引导消息
      const messageTimer = setTimeout(() => {
        setShowShootingStarMessage(true);
      }, 3000);

      // 定期生成新彗星
      const interval = setInterval(() => {
        setShootingStars(prev => {
          const newComet = generateComet();
          return [...prev.slice(-1), newComet]; // 保持最多2颗彗星
        });
      }, 6000);

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
        {/* 用户的星愿星星 - 6角星设计 */}
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
            {/* 6角星本体 */}
            <div
              className="relative animate-pulse hover:animate-none transition-all duration-300 group-hover:scale-125"
              style={{
                animationDelay: `${star.twinkleDelay}s`,
                animationDuration: `${2 + Math.random()}s`,
              }}
            >
              <SixPointedStar
                size={star.size}
                color={star.color}
                brightness={star.brightness}
                className="drop-shadow-lg transition-all duration-300"
              />
              
              {/* 额外的光晕效果 */}
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-30"
                style={{
                  background: `radial-gradient(circle, ${star.color}60 0%, transparent 70%)`,
                  animationDelay: `${star.twinkleDelay + 1}s`,
                  animationDuration: '4s',
                  width: `${star.size * 1.5}px`,
                  height: `${star.size * 1.5}px`,
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>

            {/* 悬停时显示的星愿信息 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
              <div className="bg-black/90 backdrop-blur-sm text-white text-xs px-4 py-3 rounded-xl whitespace-nowrap border border-white/20 shadow-xl">
                <div className="font-bold text-sm mb-1">{star.wish.title}</div>
                <div className="text-gray-300 text-xs flex items-center space-x-2">
                  <span className="capitalize">{star.wish.category}</span>
                  <span>•</span>
                  <span className="capitalize">{star.wish.priority}</span>
                </div>
              </div>
              {/* 小箭头 */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-6 border-transparent border-t-black/90"></div>
            </div>
          </div>
        ))}

        {/* 哈雷彗星效果（仅当没有星愿时显示） */}
        {shootingStars.map((comet) => (
          <HalleysComet
            key={comet.id}
            startX={comet.startX}
            startY={comet.startY}
            endX={comet.endX}
            endY={comet.endY}
            duration={comet.duration}
            delay={comet.delay}
          />
        ))}

        {/* 背景装饰星星（静态，更少更精致） */}
        {[...Array(15)].map((_, i) => (
          <div
            key={`bg-star-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* 彗星引导气泡 */}
      {showShootingStarMessage && user && wishes.length === 0 && (
        <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
          <div className="bg-gradient-to-r from-blue-500/95 to-purple-500/95 backdrop-blur-sm text-white px-8 py-6 rounded-3xl border border-white/30 shadow-2xl max-w-sm text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
              <span className="font-bold text-lg">哈雷彗星划过</span>
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            <p className="text-sm text-blue-100 mb-4 leading-relaxed">
              传说中，向划过的彗星许愿会实现哦！<br/>
              快来播种你的第一颗星愿吧 ✨
            </p>
            <button
              onClick={() => onNavigate('create')}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🌟 播种星愿
            </button>
          </div>
          {/* 气泡尾巴 */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-12 border-transparent border-t-blue-500/95"></div>
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
                <SixPointedStar size={20} color="#fbbf24" brightness={1} />
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
    </div>
  );
};

export default LandingPage;