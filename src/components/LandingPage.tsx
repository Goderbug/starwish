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

  // 检查位置是否与 Logo 区域冲突
  const isPositionConflictingWithLogo = (x: number, y: number) => {
    const logoX = 50; // Logo 在页面中心
    const logoY = 25; // Logo 的大概位置（相对于标题区域）
    const logoRadius = 15; // Logo 的安全半径
    
    const distance = Math.sqrt(Math.pow(x - logoX, 2) + Math.pow(y - logoY, 2));
    return distance < logoRadius;
  };

  // 生成围绕标题区域的星愿星星位置 - 避开 Logo 区域
  const generateStarPosition = (index: number, total: number) => {
    const centerX = 50; // 页面中心X
    const centerY = 40; // 标题区域中心Y，稍微下移避开 Logo
    
    // 创建多个同心圆环，但避开 Logo 区域
    const rings = Math.ceil(total / 8); // 每环最多8颗星
    const currentRing = Math.floor(index / 8);
    const positionInRing = index % 8;
    
    // 调整半径，从 Logo 外围开始
    const baseRadius = 18 + currentRing * 10; // 从18%开始，确保不与 Logo 冲突
    const maxRadius = 35; // 最大半径限制
    
    const angleStep = (2 * Math.PI) / Math.min(8, total - currentRing * 8);
    let angle = positionInRing * angleStep + (currentRing * Math.PI / 8);
    
    // 如果星星数量较少，优先分布在 Logo 的左右两侧
    if (total <= 4) {
      const preferredAngles = [
        -Math.PI / 3,  // 右上
        Math.PI / 3,   // 右下
        -2 * Math.PI / 3, // 左上
        2 * Math.PI / 3   // 左下
      ];
      if (index < preferredAngles.length) {
        angle = preferredAngles[index];
      }
    }
    
    // 添加一些随机偏移让分布更自然
    const radiusOffset = (Math.random() - 0.5) * 6;
    const angleOffset = (Math.random() - 0.5) * 0.3;
    
    const finalRadius = Math.min(maxRadius, Math.max(18, baseRadius + radiusOffset));
    const finalAngle = angle + angleOffset;
    
    // 计算相对于中心的位置
    let x = centerX + Math.cos(finalAngle) * finalRadius;
    let y = centerY + Math.sin(finalAngle) * finalRadius * 0.6; // 垂直方向压缩
    
    // 检查是否与 Logo 冲突，如果冲突则调整位置
    let attempts = 0;
    while (isPositionConflictingWithLogo(x, y) && attempts < 10) {
      // 如果冲突，增加半径或调整角度
      const newRadius = finalRadius + 5 + attempts * 3;
      const newAngle = finalAngle + (attempts % 2 === 0 ? 0.5 : -0.5);
      
      x = centerX + Math.cos(newAngle) * newRadius;
      y = centerY + Math.sin(newAngle) * newRadius * 0.6;
      attempts++;
    }
    
    // 严格限制星星在安全区域内
    return {
      x: Math.max(15, Math.min(85, x)),
      y: Math.max(15, Math.min(55, y))
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
          size: wish.priority === 'high' ? 28 : wish.priority === 'medium' ? 24 : 20,
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
      {/* 背景装饰星星（静态，更少更精致） */}
      <div className="fixed inset-0 pointer-events-none">
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

      {/* Main content with top padding to account for header */}
      <div className="text-center max-w-4xl mx-auto relative z-10 w-full">
        {/* Logo and title area with wish stars */}
        <div className="mb-6 sm:mb-8 relative">
          {/* 用户的星愿星星 - 现在相对于这个容器定位，会随内容滚动，并避开 Logo */}
          {wishStars.map((star) => (
            <div
              key={star.id}
              className="absolute group cursor-pointer z-20 wish-star-container"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              title={star.wish.title}
            >
              {/* 6角星本体 */}
              <div
                className="relative animate-pulse hover:animate-none transition-all duration-300 group-hover:scale-125 six-pointed-star"
                style={{
                  animationDelay: `${star.twinkleDelay}s`,
                  animationDuration: `${2 + Math.random()}s`,
                }}
              >
                <SixPointedStar
                  size={star.size}
                  color={star.color}
                  brightness={star.brightness}
                  className="drop-shadow-lg transition-all duration-300 star-glow-intense"
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
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-30">
                <div className="bg-black/90 backdrop-blur-sm text-white text-xs px-4 py-3 rounded-xl whitespace-nowrap border border-white/20 shadow-xl star-tooltip">
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

          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 mb-4 sm:mb-6 relative overflow-hidden z-30">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse"></div>
            <Star className="w-10 h-10 sm:w-12 sm:h-12 text-white relative z-10" fill="currentColor" />
          </div>
          
          {/* Title */}
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