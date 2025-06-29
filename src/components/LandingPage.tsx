import React, { useState, useEffect, useMemo } from 'react';
import { Heart, Sparkles, Gift, Plus, ArrowRight, Wand2, Link, History, Inbox, Clock, X, Tag, Calendar } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { User } from '@supabase/supabase-js';
import { Wish } from '../lib/supabase';
import TitleLogo from './TitleLogo';

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

interface StarConnection {
  from: WishStar;
  to: WishStar;
  distance: number;
}

// 发光圆点组件 - 更新颜色
const GlowingDot: React.FC<{ 
  size: number; 
  color: string; 
  brightness: number; 
  className?: string;
}> = ({ size, color, brightness, className = '' }) => (
  <div
    className={`rounded-full relative ${className}`}
    style={{ 
      width: size,
      height: size,
      backgroundColor: color,
      opacity: brightness,
      boxShadow: `
        0 0 ${size * 0.5}px ${color},
        0 0 ${size * 1}px ${color}40,
        0 0 ${size * 1.5}px ${color}20
      `,
    }}
  >
    {/* 内部高亮 */}
    <div
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
      style={{
        width: size * 0.3,
        height: size * 0.3,
        opacity: 0.8,
      }}
    />
    
    {/* 外部光晕动画 */}
    <div
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full animate-ping"
      style={{
        width: size * 1.5,
        height: size * 1.5,
        backgroundColor: color,
        opacity: 0.3,
        animationDuration: '3s',
      }}
    />
  </div>
);

// 功能插图组件 - 放大尺寸并添加被裁切效果
const FeatureIllustration: React.FC<{ type: 'sow' | 'weave' | 'surprise'; className?: string }> = ({ type, className = '' }) => {
  switch (type) {
    case 'sow':
      return (
        <div className={`relative ${className}`}>
          {/* 播种星愿插图 - 放大到 w-40 h-40 */}
          <div className="relative w-40 h-40 mx-auto">
            {/* 中心星星 */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            
            {/* 围绕的小星星 */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-twinkle"
                style={{
                  left: `${50 + 40 * Math.cos((i * 45) * Math.PI / 180)}%`,
                  top: `${50 + 40 * Math.sin((i * 45) * Math.PI / 180)}%`,
                  animationDelay: `${i * 0.3}s`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
            
            {/* 魔法粒子 */}
            {[...Array(20)].map((_, i) => (
              <div
                key={`particle-${i}`}
                className="absolute w-1.5 h-1.5 bg-yellow-300 rounded-full animate-float opacity-60"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        </div>
      );
      
    case 'weave':
      return (
        <div className={`relative ${className}`}>
          {/* 编织星链插图 - 放大到 w-40 h-40 */}
          <div className="relative w-40 h-40 mx-auto">
            {/* 连接的星星 */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 160">
              {/* 连线 */}
              <path
                d="M30 45 L65 30 L95 50 L70 90 L40 75 Z"
                stroke="url(#chainGradient)"
                strokeWidth="4"
                fill="none"
                className="animate-pulse"
                strokeDasharray="8,4"
              />
              <defs>
                <linearGradient id="chainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF3EEC" />
                  <stop offset="50%" stopColor="#FFAB3E" />
                  <stop offset="100%" stopColor="#FF3EEC" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* 星星节点 */}
            {[
              { x: 30, y: 45 },
              { x: 65, y: 30 },
              { x: 95, y: 50 },
              { x: 70, y: 90 },
              { x: 40, y: 75 }
            ].map((pos, i) => (
              <div
                key={i}
                className="absolute w-5 h-5 rounded-full animate-pulse"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  animationDelay: `${i * 0.2}s`,
                  backgroundColor: i % 2 === 0 ? '#FF3EEC' : '#FFAB3E',
                }}
              />
            ))}
            
            {/* 中心链接图标 */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
              <Link className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      );
      
    case 'surprise':
      return (
        <div className={`relative ${className}`}>
          {/* 随机惊喜插图 - 放大到 w-40 h-40 */}
          <div className="relative w-40 h-40 mx-auto">
            {/* 盲盒 */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border-2 border-white/30 backdrop-blur-sm flex items-center justify-center">
              <Gift className="w-10 h-10 text-yellow-400" />
            </div>
            
            {/* 问号和惊喜元素 */}
            {['?', '!', '✨'].map((symbol, i) => (
              <div
                key={i}
                className="absolute text-3xl font-bold text-yellow-400 animate-bounce"
                style={{
                  left: `${15 + i * 35}%`,
                  top: `${5 + (i % 2) * 30}%`,
                  animationDelay: `${i * 0.5}s`,
                }}
              >
                {symbol}
              </div>
            ))}
            
            {/* 流星轨迹 */}
            <div className="absolute top-4 right-4 w-16 h-1.5 bg-gradient-to-r from-yellow-400 to-transparent rounded-full animate-pulse opacity-70" />
            <div className="absolute bottom-6 left-4 w-12 h-1.5 bg-gradient-to-r from-pink-400 to-transparent rounded-full animate-pulse opacity-70" style={{ animationDelay: '0.5s' }} />
            
            {/* 环绕粒子 */}
            {[...Array(16)].map((_, i) => (
              <div
                key={`surprise-particle-${i}`}
                className="absolute w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping"
                style={{
                  left: `${50 + 45 * Math.cos((i * 22.5) * Math.PI / 180)}%`,
                  top: `${50 + 45 * Math.sin((i * 22.5) * Math.PI / 180)}%`,
                  animationDelay: `${i * 0.3}s`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
          </div>
        </div>
      );
      
    default:
      return null;
  }
};

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
  const [selectedWish, setSelectedWish] = useState<Wish | null>(null);

  // 根据星愿类型获取颜色 - 更新为新的颜色方案
  const getWishStarColor = (category: string, priority: string) => {
    const colors = {
      gift: {
        low: '#FFAB3E',    // 橙色
        medium: '#FF3EEC', // 粉色
        high: '#FFAB3E'    // 橙色
      },
      experience: {
        low: '#FF3EEC',    // 粉色
        medium: '#FFAB3E', // 橙色
        high: '#FF3EEC'    // 粉色
      },
      moment: {
        low: '#FFAB3E',    // 橙色
        medium: '#FF3EEC', // 粉色
        high: '#FFAB3E'    // 橙色
      }
    };
    return colors[category]?.[priority] || '#FFAB3E';
  };

  // 生成星愿星星分布 - 缩小安全区域，限制在更小的范围内
  const generateStarPosition = (index: number, total: number) => {
    // 定义更紧凑的安全区域：header下方(Y: 15-35%)，避开中心标题区域
    const safeZones = [
      // 左上区域 - 缩小范围
      { centerX: 25, centerY: 22, radiusX: 18, radiusY: 8, weight: 0.3 },
      // 右上区域 - 缩小范围
      { centerX: 75, centerY: 22, radiusX: 18, radiusY: 8, weight: 0.3 },
      // 左侧边缘 - 缩小范围
      { centerX: 15, centerY: 30, radiusX: 10, radiusY: 10, weight: 0.2 },
      // 右侧边缘 - 缩小范围
      { centerX: 85, centerY: 30, radiusX: 10, radiusY: 10, weight: 0.2 },
    ];

    // 根据星愿数量和索引选择分布区域
    const zoneIndex = index % safeZones.length;
    const zone = safeZones[zoneIndex];
    
    // 在选定区域内生成随机位置
    const angle = (index / total) * 2 * Math.PI + Math.random() * 0.8;
    const radiusX = zone.radiusX * (0.4 + Math.random() * 0.6);
    const radiusY = zone.radiusY * (0.4 + Math.random() * 0.6);
    
    let x = zone.centerX + Math.cos(angle) * radiusX;
    let y = zone.centerY + Math.sin(angle) * radiusY;
    
    // 确保星星在安全区域内，保持边距 - 缩小Y轴范围
    x = Math.max(8, Math.min(92, x));
    y = Math.max(18, Math.min(35, y)); // 进一步限制在更小的区域
    
    return { x, y };
  };

  // 计算两个星星之间的距离
  const calculateDistance = (star1: WishStar, star2: WishStar) => {
    const dx = star1.x - star2.x;
    const dy = star1.y - star2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 生成星星连线
  const generateConnections = (stars: WishStar[]): StarConnection[] => {
    const connections: StarConnection[] = [];
    const maxDistance = 25; // 最大连线距离（百分比）
    const maxConnectionsPerStar = 3; // 每个星星最多连接数

    stars.forEach((star, index) => {
      const nearbyStars = stars
        .filter((otherStar, otherIndex) => otherIndex !== index)
        .map(otherStar => ({
          star: otherStar,
          distance: calculateDistance(star, otherStar)
        }))
        .filter(({ distance }) => distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxConnectionsPerStar);

      nearbyStars.forEach(({ star: otherStar, distance }) => {
        // 避免重复连线
        const existingConnection = connections.find(conn => 
          (conn.from.id === star.id && conn.to.id === otherStar.id) ||
          (conn.from.id === otherStar.id && conn.to.id === star.id)
        );

        if (!existingConnection) {
          connections.push({
            from: star,
            to: otherStar,
            distance
          });
        }
      });
    });

    return connections;
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
          size: wish.priority === 'high' ? 16 : wish.priority === 'medium' ? 12 : 10,
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

  // 计算星星连线
  const starConnections = useMemo(() => {
    return generateConnections(wishStars);
  }, [wishStars]);

  // 处理星星点击
  const handleStarClick = (e: React.MouseEvent, wish: Wish) => {
    e.stopPropagation();
    setSelectedWish(wish);
  };

  // 关闭星愿详情弹窗
  const closeWishModal = () => {
    setSelectedWish(null);
  };

  // 获取类型图标
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'gift': return Gift;
      case 'experience': return Heart;
      case 'moment': return Clock;
      default: return Gift;
    }
  };

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
      {/* 星愿星空背景 - 限制在更小的安全区域 */}
      <div className="fixed inset-0 pointer-events-none">
        {/* SVG 连线层 - 更新连线颜色 */}
        <svg className="absolute inset-0 w-full h-full z-10">
          {starConnections.map((connection, index) => {
            // 计算连线的透明度，距离越近越亮
            const opacity = Math.max(0.2, 1 - (connection.distance / 25));
            // 根据连接的星星颜色选择连线颜色
            const lineColor = index % 2 === 0 ? '#FF3EEC' : '#FFAB3E';
            
            return (
              <line
                key={`connection-${index}`}
                x1={`${connection.from.x}%`}
                y1={`${connection.from.y}%`}
                x2={`${connection.to.x}%`}
                y2={`${connection.to.y}%`}
                stroke={lineColor}
                strokeWidth="1"
                opacity={opacity * 0.6}
                className="animate-pulse"
                style={{
                  animationDuration: `${3 + Math.random() * 2}s`,
                  animationDelay: `${Math.random() * 2}s`,
                  filter: `drop-shadow(0 0 2px ${lineColor}30)`,
                }}
              />
            );
          })}
        </svg>

        {/* 用户的星愿星星 - 只在安全区域显示 */}
        {wishStars.map((star) => (
          <div
            key={star.id}
            className="absolute group cursor-pointer z-20 wish-star-container pointer-events-auto"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={(e) => handleStarClick(e, star.wish)}
            title={`${t('wishModal.clickToView')} ${star.wish.title}`}
          >
            {/* 发光圆点本体 */}
            <div
              className="relative animate-pulse hover:animate-none transition-all duration-300 group-hover:scale-150"
              style={{
                animationDelay: `${star.twinkleDelay}s`,
                animationDuration: `${2 + Math.random()}s`,
              }}
            >
              <GlowingDot
                size={star.size}
                color={star.color}
                brightness={star.brightness}
                className="transition-all duration-300"
              />
            </div>

            {/* 悬停时显示的星愿信息 - 修改为从下方出现 */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-30">
              <div className="bg-black/90 backdrop-blur-sm text-white text-xs px-4 py-3 rounded-xl whitespace-nowrap border border-white/20 shadow-xl star-tooltip">
                <div className="font-bold text-sm mb-1">{star.wish.title}</div>
                <div className="text-gray-300 text-xs flex items-center space-x-2">
                  <span className="capitalize">{t(`category.${star.wish.category}`)}</span>
                  <span>•</span>
                  <span className="capitalize">{t(`priority.${star.wish.priority}`)}</span>
                </div>
                <div className="text-purple-300 text-xs mt-1">{t('wishModal.clickToView')}</div>
              </div>
              {/* 小箭头 - 修改为指向上方 */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-6 border-transparent border-b-black/90"></div>
            </div>
          </div>
        ))}

        {/* 背景装饰星星（静态，更少更精致） - 减少数量，让画面更简洁，使用新颜色 */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`bg-star-${i}`}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            <GlowingDot
              size={1 + Math.random() * 2}
              color={i % 2 === 0 ? '#FF3EEC' : '#FFAB3E'}
              brightness={0.2 + Math.random() * 0.3}
            />
          </div>
        ))}
      </div>

      {/* Main content - 减少顶部间距，让内容更靠上 */}
      <div className="text-center max-w-4xl mx-auto relative z-10 w-full" style={{ marginTop: '15vh' }}>
        {/* Title area - 现在更靠近顶部 */}
        <div className="mb-6 sm:mb-8 relative">
          {/* 使用统一的Figma设计标题 */}
          <div className="mb-2 sm:mb-4">
            <TitleLogo 
              size="large" 
              className="mx-auto"
            />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 font-light">
            {t('landing.subtitle')}
          </p>
        </div>

        {/* Stats - 只有在用户登录且有星愿时显示 */}
        {user && wishCount > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="inline-flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-full px-6 sm:px-8 py-3 sm:py-4 border border-white/20">
              <div className="flex items-center space-x-2">
                <GlowingDot size={16} color="#FFAB3E" brightness={1} />
                <span className="text-sm sm:text-base font-medium">
                  {wishCount} {t('landing.wishesPlanted')}
                </span>
              </div>
              <div className="w-px h-6 bg-white/20"></div>
              <div className="text-xs sm:text-sm text-gray-300">
                ✨ {t('landing.starryNight')}
              </div>
            </div>
          </div>
        )}

        {/* Auth required message for non-authenticated users - 移除 auth.signInDescription */}
        {!user && (
          <div className="mb-8 p-6 bg-purple-500/20 backdrop-blur-sm rounded-2xl border border-purple-400/30">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <GlowingDot size={32} color="#FF3EEC" brightness={1} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">{t('auth.signInRequired')}</h3>
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
              <span>{wishCount === 0 ? t('landing.plantFirst') : t('landing.plantWish')}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {wishCount > 0 && (
              <button
                onClick={() => onNavigate('manage')}
                className="group w-full sm:w-auto bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-6 sm:px-8 py-4 rounded-full text-base sm:text-lg font-semibold transition-all duration-300 border border-white/20 hover:border-white/30 flex items-center justify-center space-x-2 min-h-[56px]"
              >
                <Wand2 className="w-5 h-5" />
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

        {/* Features showcase - 重新设计为卡片布局，修改title frame为左上对齐 */}
        <div className="space-y-8 sm:space-y-12 px-2 max-w-6xl mx-auto">
          {/* 播种星愿卡片 - 缩小高度以实现切割效果 */}
          <div className="group relative overflow-hidden">
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/10 hover:border-yellow-400/30 transition-all duration-500 group-hover:bg-white/8 feature-card relative overflow-hidden h-48 sm:h-56">
              {/* 背景装饰 */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-orange-500/3 to-transparent rounded-3xl"></div>
              
              <div className="relative z-10 flex flex-col lg:flex-row items-start gap-6 h-full">
                {/* 左侧：标题和描述 */}
                <div className="flex-1 space-y-3">
                  {/* 功能标题 - 修改为左上对齐，不使用inline-flex */}
                  <div className="flex items-center space-x-3 bg-black/30 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 w-fit">
                    <Wand2 className="w-5 h-5 text-white" />
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      {t('landing.feature1.title')}
                    </h3>
                  </div>
                  
                  {/* 描述文本 - 适当增大字号并加粗 */}
                  <p className="text-gray-300 text-lg sm:text-xl lg:text-2xl leading-relaxed font-semibold text-left max-w-2xl">
                    {t('landing.feature1.desc')}
                  </p>
                </div>
                
                {/* 右侧：示意动画 - 放大并添加被裁切效果 */}
                <div className="flex-shrink-0 lg:w-72 lg:h-72 flex items-center justify-center relative">
                  {/* 动画容器 - 部分被卡片边框裁切（约20%） */}
                  <div className="relative w-full h-full flex items-center justify-center" style={{ transform: 'translateX(20%) translateY(-15%)' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-3xl blur-2xl scale-150"></div>
                    <FeatureIllustration type="sow" className="relative z-10 scale-150" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 编织星链卡片 - 缩小高度以实现切割效果 */}
          <div className="group relative overflow-hidden">
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/10 hover:border-purple-400/30 transition-all duration-500 group-hover:bg-white/8 feature-card relative overflow-hidden h-48 sm:h-56">
              {/* 背景装饰 */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/3 to-transparent rounded-3xl"></div>
              
              <div className="relative z-10 flex flex-col lg:flex-row items-start gap-6 h-full">
                {/* 左侧：标题和描述 */}
                <div className="flex-1 space-y-3">
                  {/* 功能标题 - 修改为左上对齐，不使用inline-flex */}
                  <div className="flex items-center space-x-3 bg-black/30 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 w-fit">
                    <Link className="w-5 h-5 text-white" />
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      {t('landing.feature2.title')}
                    </h3>
                  </div>
                  
                  {/* 描述文本 - 适当增大字号并加粗 */}
                  <p className="text-gray-300 text-lg sm:text-xl lg:text-2xl leading-relaxed font-semibold text-left max-w-2xl">
                    {t('landing.feature2.desc')}
                  </p>
                </div>
                
                {/* 右侧：示意动画 - 放大并添加被裁切效果 */}
                <div className="flex-shrink-0 lg:w-72 lg:h-72 flex items-center justify-center relative">
                  {/* 动画容器 - 部分被卡片边框裁切（约20%） */}
                  <div className="relative w-full h-full flex items-center justify-center" style={{ transform: 'translateX(20%) translateY(-15%)' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl scale-150"></div>
                    <FeatureIllustration type="weave" className="relative z-10 scale-150" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 随机惊喜卡片 - 缩小高度以实现切割效果 */}
          <div className="group relative overflow-hidden">
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/10 hover:border-pink-400/30 transition-all duration-500 group-hover:bg-white/8 feature-card relative overflow-hidden h-48 sm:h-56">
              {/* 背景装饰 */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-blue-500/3 to-transparent rounded-3xl"></div>
              
              <div className="relative z-10 flex flex-col lg:flex-row items-start gap-6 h-full">
                {/* 左侧：标题和描述 */}
                <div className="flex-1 space-y-3">
                  {/* 功能标题 - 修改为左上对齐，不使用inline-flex */}
                  <div className="flex items-center space-x-3 bg-black/30 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 w-fit">
                    <Sparkles className="w-5 h-5 text-white" />
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      {t('landing.feature3.title')}
                    </h3>
                  </div>
                  
                  {/* 描述文本 - 适当增大字号并加粗 */}
                  <p className="text-gray-300 text-lg sm:text-xl lg:text-2xl leading-relaxed font-semibold text-left max-w-2xl">
                    {t('landing.feature3.desc')}
                  </p>
                </div>
                
                {/* 右侧：示意动画 - 放大并添加被裁切效果 */}
                <div className="flex-shrink-0 lg:w-72 lg:h-72 flex items-center justify-center relative">
                  {/* 动画容器 - 部分被卡片边框裁切（约20%） */}
                  <div className="relative w-full h-full flex items-center justify-center" style={{ transform: 'translateX(20%) translateY(-15%)' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-blue-500/10 rounded-3xl blur-2xl scale-150"></div>
                    <FeatureIllustration type="surprise" className="relative z-10 scale-150" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 星愿详情弹窗 */}
      {selectedWish && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 max-w-md w-full border border-white/20 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Background sparkles */}
            <div className="absolute inset-0">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    backgroundColor: i % 2 === 0 ? '#FF3EEC' : '#FFAB3E',
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${
                    selectedWish.category === 'gift' ? 'from-pink-400 to-rose-400' :
                    selectedWish.category === 'experience' ? 'from-purple-400 to-indigo-400' :
                    'from-blue-400 to-cyan-400'
                  } flex items-center justify-center`}>
                    {React.createElement(getCategoryIcon(selectedWish.category), {
                      className: "w-6 h-6 text-white"
                    })}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{t('wishModal.title')}</h3>
                    <p className="text-sm text-gray-400">{t(`category.${selectedWish.category}`)}</p>
                  </div>
                </div>
                
                <button
                  onClick={closeWishModal}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              </div>

              {/* Wish content */}
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">{selectedWish.title}</h4>
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${
                    selectedWish.priority === 'high' ? 'bg-red-500' :
                    selectedWish.priority === 'medium' ? 'bg-amber-500' :
                    'bg-emerald-500'
                  }`}>
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span className="text-white text-xs font-medium">{t(`priority.${selectedWish.priority}`)}</span>
                  </div>
                </div>

                {/* Description */}
                {selectedWish.description && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <h5 className="text-sm font-medium text-gray-300 mb-2">{t('wishModal.description')}</h5>
                    <p className="text-gray-200 leading-relaxed">{selectedWish.description}</p>
                  </div>
                )}

                {/* Tags */}
                {selectedWish.tags && selectedWish.tags.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">{t('wishModal.tags')}</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedWish.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price */}
                {selectedWish.estimated_price && (
                  <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20">
                    <h5 className="text-sm font-medium text-yellow-300 mb-1">{t('wishModal.price')}</h5>
                    <p className="text-yellow-400 font-medium">{selectedWish.estimated_price}</p>
                  </div>
                )}

                {/* Notes */}
                {selectedWish.notes && (
                  <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                    <h5 className="text-sm font-medium text-purple-300 mb-2">{t('wishModal.notes')}</h5>
                    <p className="text-purple-200 italic">"{selectedWish.notes}"</p>
                  </div>
                )}

                {/* Created date */}
                <div className="flex items-center space-x-2 text-xs text-gray-400 pt-4 border-t border-white/10">
                  <Calendar className="w-3 h-3" />
                  <span>{t('wishModal.createdAt')} {new Date(selectedWish.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>

              {/* Action button */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={closeWishModal}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl transition-all font-medium"
                >
                  {t('wishModal.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;