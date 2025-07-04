import React, { useState, useEffect } from 'react';
import { Star, Sparkles, Gift, Heart, Clock, Wand2, UserPlus, LogIn } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './AuthModal';

interface BlindBoxProps {
  boxId: string | null;
  onBack: () => void;
}

const BlindBox: React.FC<BlindBoxProps> = ({ boxId, onBack }) => {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const [starChain, setStarChain] = useState<any>(null);
  const [selectedWish, setSelectedWish] = useState<any>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [componentLoading, setComponentLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [openingAttempted, setOpeningAttempted] = useState(false);

  useEffect(() => {
    if (boxId) {
      fetchStarChain();
    }
  }, [boxId]);

  const fetchStarChain = async () => {
    if (!boxId) return;

    try {
      if (import.meta.env.DEV) {
        console.log('🔍 获取星链数据:', boxId);
      }
      
      const { data: chainData, error: chainError } = await supabase
        .from('star_chains')
        .select(`
          *,
          creator:users(name, email)
        `)
        .eq('share_code', boxId)
        .single();

      if (chainError) {
        console.error('❌ 获取星链失败:', chainError);
        
        if (chainError.code === 'PGRST116') {
          setError(t('blindbox.chainNotFound'));
        } else {
          setError(t('blindbox.fetchError'));
        }
        return;
      }

      if (!chainData) {
        setError(t('blindbox.chainNotFound'));
        return;
      }

      const now = new Date();
      
      // ✅ 修复：更宽松的状态检查，允许查看已开启的结果
      if (chainData.is_opened) {
        const openedTime = new Date(chainData.opened_at);
        const timeDiff = now.getTime() - openedTime.getTime();
        const fiveMinutes = 5 * 60 * 1000; // 5分钟

        if (timeDiff > fiveMinutes) {
          // 超过5分钟的已开启星链，仍然允许查看，但不允许重新开启
          console.log('ℹ️ 星链已开启超过5分钟，显示已开启状态');
        }
      }
      
      // 检查是否过期
      if (chainData.expires_at && new Date(chainData.expires_at) < now) {
        setError(t('blindbox.expired'));
        return;
      }

      // 检查是否处于活跃状态
      if (!chainData.is_active) {
        setError(t('blindbox.inactive'));
        return;
      }

      // 获取星链中的星愿
      const { data: wishesData, error: wishesError } = await supabase
        .from('star_chain_wishes')
        .select(`
          wish:wishes(*)
        `)
        .eq('chain_id', chainData.id);

      if (wishesError) {
        console.error('❌ 获取星愿失败:', wishesError);
        setError(t('blindbox.fetchWishesError'));
        return;
      }

      const wishes = wishesData?.map((item: any) => item.wish).filter(Boolean) || [];

      if (wishes.length === 0) {
        setError(t('blindbox.noWishes'));
        return;
      }

      setStarChain({
        ...chainData,
        wishes: wishes
      });

      // ✅ 如果星链已开启，获取开启记录来显示结果
      if (chainData.is_opened && chainData.opened_at) {
        try {
          const { data: openRecord } = await supabase
            .from('blind_box_opens')
            .select('wish_id, wish:wishes(*)')
            .eq('chain_id', chainData.id)
            .order('opened_at', { ascending: false })
            .limit(1)
            .single();

          if (openRecord && openRecord.wish) {
            setSelectedWish(openRecord.wish);
            setHasOpened(true);
          }
        } catch (error) {
          console.warn('⚠️ 获取开启记录失败，但不影响主流程:', error);
        }
      }

    } catch (error: any) {
      console.error('❌ 获取星链数据失败:', error);
      setError(t('blindbox.fetchError'));
    } finally {
      setComponentLoading(false);
    }
  };

  const categoryIcons = {
    gift: Gift,
    experience: Heart,
    moment: Clock,
  };

  const openBlindBox = async () => {
    // ✅ 防止重复开启
    if (openingAttempted || isOpening) {
      console.log('⚠️ 开启操作已在进行中，忽略重复请求');
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!starChain || !starChain.wishes || starChain.wishes.length === 0) {
      setError(t('blindbox.noWishes'));
      return;
    }

    // ✅ 严格检查：如果已经开启，不允许再次开启
    if (starChain.is_opened) {
      setError(t('blindbox.alreadyOpened'));
      return;
    }
    
    setOpeningAttempted(true);
    setIsOpening(true);
    setError(null);
    
    try {
      // 显示开启动画
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 随机选择一个星愿
      const randomIndex = Math.floor(Math.random() * starChain.wishes.length);
      const chosen = starChain.wishes[randomIndex];
      
      setSelectedWish(chosen);

      try {
        // ✅ 关键修复：简化更新条件，移除过于严格的检查
        const { data: updateResult, error: updateChainError } = await supabase
          .from('star_chains')
          .update({
            is_opened: true,
            opened_at: new Date().toISOString(),
            opener_fingerprint: user.id,
            total_opens: starChain.total_opens + 1
          })
          .eq('id', starChain.id)
          .eq('is_opened', false) // 只检查是否未开启
          .select();

        // ✅ 改进错误处理：提供更详细的错误信息
        if (updateChainError) {
          console.error('❌ 更新星链状态失败:', updateChainError);
          
          // 检查是否是权限问题
          if (updateChainError.code === '42501') {
            throw new Error(t('blindbox.permissionDenied'));
          } else if (updateChainError.message?.includes('row-level security')) {
            throw new Error(t('blindbox.accessDenied'));
          } else {
            throw new Error(t('blindbox.updateFailed') + updateChainError.message);
          }
        }

        if (!updateResult || updateResult.length === 0) {
          // 重新检查星链状态
          const { data: currentChain } = await supabase
            .from('star_chains')
            .select('is_opened, opened_at, opener_fingerprint')
            .eq('id', starChain.id)
            .single();

          if (currentChain?.is_opened) {
            throw new Error(t('blindbox.openedByOthers'));
          } else {
            throw new Error(t('blindbox.openFailed'));
          }
        }

        console.log('✅ 星链状态更新成功');

        // ✅ 并行执行记录操作，提高性能
        const recordPromises = [];

        // 记录开启事件
        recordPromises.push(
          supabase
            .from('blind_box_opens')
            .insert({
              chain_id: starChain.id,
              wish_id: chosen.id,
              opener_fingerprint: user.id,
              user_agent: navigator.userAgent,
              ip_hash: 'hashed_ip'
            })
        );

        // 保存到用户的收到星愿列表
        recordPromises.push(
          supabase
            .from('user_opened_wishes')
            .insert({
              user_fingerprint: user.id,
              wish_id: chosen.id,
              chain_id: starChain.id,
              creator_name: starChain.creator?.name || 'Anonymous',
              opened_at: new Date().toISOString(),
              is_favorite: false,
              notes: ''
            })
        );

        // 等待所有记录操作完成
        const results = await Promise.allSettled(recordPromises);
        
        // 检查是否有失败的操作
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const operation = index === 0 ? '开启记录' : '用户星愿保存';
            console.warn(`⚠️ ${operation}失败:`, result.reason);
          }
        });

        // 更新本地状态
        setStarChain(prev => ({
          ...prev,
          is_opened: true,
          opened_at: new Date().toISOString(),
          opener_fingerprint: user.id
        }));

      } catch (recordError: any) {
        console.error('❌ 数据库操作失败:', recordError);
        setError(t('blindbox.openFailed') + recordError.message);
        setIsOpening(false);
        setOpeningAttempted(false);
        return;
      }

      setHasOpened(true);
      
    } catch (error: any) {
      console.error('❌ 打开盲盒失败:', error);
      setError(t('blindbox.openFailed') + error.message);
      setOpeningAttempted(false);
    } finally {
      setIsOpening(false);
    }
  };

  // 监听用户登录状态变化，登录后自动关闭登录弹窗
  useEffect(() => {
    if (user && showAuthModal) {
      setShowAuthModal(false);
    }
  }, [user, showAuthModal]);

  if (loading || componentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">{t('blindbox.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !starChain) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-r from-gray-400/20 to-gray-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Star className="w-14 h-14 sm:w-16 sm:h-16 text-gray-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-gray-300">
            {error?.includes(t('blindbox.alreadyOpened')) ? t('blindbox.boxOpened') : t('blindbox.chainExpired')}
          </h2>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">
            {error || t('blindbox.chainInvalid')}
          </p>
          <button
            onClick={onBack}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl transition-colors touch-manipulation"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  if (isOpening) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 flex items-center justify-center relative overflow-hidden px-4">
        {/* Animated particles */}
        <div className="absolute inset-0">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>

        <div className="text-center relative z-10">
          {/* Expanding star effect */}
          <div className="relative mb-8">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 animate-spin"></div>
              <Star className="w-16 h-16 sm:w-20 sm:h-20 text-white animate-spin relative z-10" fill="currentColor" />
            </div>
            
            {/* Expanding rings */}
            {[1, 2, 3].map(ring => (
              <div
                key={ring}
                className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"
                style={{
                  animationDelay: `${ring * 0.5}s`,
                  animationDuration: '2s',
                }}
              />
            ))}
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-4 animate-pulse">✨ {t('blindbox.opening')} ✨</h2>
          <p className="text-lg sm:text-xl text-gray-300 animate-pulse">{t('blindbox.openingDesc')}</p>
          
          {/* Progress indication */}
          <div className="mt-8 flex justify-center space-x-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 bg-white rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (hasOpened && selectedWish) {
    const Icon = categoryIcons[selectedWish.category];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 p-4 flex items-center justify-center">
        <div className="max-w-lg mx-auto text-center w-full">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 relative">
              <Star className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-pulse" fill="currentColor" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 animate-ping opacity-20"></div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">🌟 {t('blindbox.giftTitle')} 🌟</h1>
            <p className="text-gray-300 text-sm sm:text-base">{t('blindbox.giftDesc')}</p>
          </div>

          {/* Selected wish card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/20 mb-6 sm:mb-8 relative overflow-hidden">
            {/* Background sparkles */}
            <div className="absolute inset-0">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              {/* Category icon */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>

              {/* Wish content */}
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">{selectedWish.title}</h2>
              
              {selectedWish.description && (
                <p className="text-gray-200 text-base sm:text-lg mb-6 leading-relaxed">
                  {selectedWish.description}
                </p>
              )}

              {/* Tags */}
              {selectedWish.tags && selectedWish.tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {selectedWish.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white/20 rounded-full text-sm text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Price */}
              {selectedWish.estimated_price && (
                <p className="text-yellow-400 text-base sm:text-lg mb-4">💰 {selectedWish.estimated_price}</p>
              )}

              {/* Notes */}
              {selectedWish.notes && (
                <div className="bg-black/20 rounded-2xl p-4 mb-6">
                  <p className="text-sm text-gray-300 italic">"{selectedWish.notes}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Mystery message */}
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 border border-purple-400/30">
            <Wand2 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mx-auto mb-3" />
            <p className="text-purple-200 text-sm">
              {t('blindbox.mysteryMessage')}
            </p>
          </div>

          {/* Success message for logged in users */}
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl p-6 mb-6 border border-green-400/30">
            <div className="mb-4">
              <UserPlus className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-2 text-white">{t('blindbox.savedToCollection')}</h3>
              <p className="text-green-200 text-sm">
                {t('blindbox.savedDesc')}
              </p>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={onBack}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-4 sm:py-5 rounded-xl transition-all text-lg font-semibold touch-manipulation min-h-[56px]"
          >
            {t('blindbox.doneButton')}
          </button>
        </div>
      </div>
    );
  }

  // 未登录用户看到的登录提示界面
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 p-4 flex items-center justify-center">
        <div className="max-w-lg mx-auto text-center w-full">
          {/* Header */}
          <div className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent">
              ✨ {t('blindbox.title')} ✨
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              {t('blindbox.prepared')} {starChain.wishes?.length || 0} {t('blindbox.mysterousWishes')}
            </p>
          </div>

          {/* Blind box preview */}
          <div className="relative mb-8 sm:mb-12">
            {/* Floating particles around the box */}
            <div className="absolute inset-0 scale-150">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${3 + Math.random() * 4}s`,
                  }}
                >
                  <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 text-yellow-300 opacity-70" />
                </div>
              ))}
            </div>

            {/* The box itself */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto">
              <div className="w-full h-full bg-gradient-to-br from-purple-400/20 via-pink-400/20 to-yellow-400/20 rounded-3xl border-2 border-white/30 backdrop-blur-sm flex items-center justify-center relative overflow-hidden">
                {/* Inner glow */}
                <div className="absolute inset-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-white/20"></div>
                
                {/* Central star */}
                <div className="relative z-10">
                  <Star className="w-20 h-20 sm:w-24 sm:h-24 text-yellow-300 animate-pulse" fill="currentColor" />
                </div>

                {/* Magical shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer"></div>
              </div>

              {/* Floating rings */}
              {[1, 2, 3].map(ring => (
                <div
                  key={ring}
                  className="absolute inset-0 rounded-full border border-white/20 animate-ping"
                  style={{
                    animationDelay: `${ring}s`,
                    animationDuration: '3s',
                    transform: `scale(${1 + ring * 0.1})`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Login requirement message */}
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6 mb-8 border border-blue-400/30">
            <div className="mb-4">
              <LogIn className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-2 text-white">{t('blindbox.loginRequired')}</h3>
              <p className="text-blue-200 text-sm mb-4">
                {t('blindbox.loginDesc')}
              </p>
              <p className="text-blue-300 text-xs">
                💫 {t('blindbox.loginNote')}
              </p>
            </div>
            
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl transition-all touch-manipulation font-medium flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{t('blindbox.loginToOpen')}</span>
            </button>
          </div>

          {/* One-time use warning */}
          <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-4 border border-red-400/20 mb-6">
            <p className="text-sm text-red-300">
              ⚠️ {t('blindbox.oneTimeUse')}
            </p>
          </div>

          {/* Back button */}
          <button
            onClick={onBack}
            className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-all touch-manipulation"
          >
            {t('blindbox.goBack')}
          </button>
        </div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode="signin"
          onModeChange={() => {}}
        />
      </div>
    );
  }

  // Initial blind box view for logged in users
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 p-4 flex items-center justify-center">
      <div className="max-w-lg mx-auto text-center w-full">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent">
            ✨ {t('blindbox.title')} ✨
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            {t('blindbox.prepared')} {starChain.wishes?.length || 0} {t('blindbox.mysterousWishes')}
          </p>
        </div>

        {/* Blind box */}
        <div className="relative mb-8 sm:mb-12">
          {/* Floating particles around the box */}
          <div className="absolute inset-0 scale-150">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 4}s`,
                }}
              >
                <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 text-yellow-300 opacity-70" />
              </div>
            ))}
          </div>

          {/* The box itself */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto">
            <div className="w-full h-full bg-gradient-to-br from-purple-400/20 via-pink-400/20 to-yellow-400/20 rounded-3xl border-2 border-white/30 backdrop-blur-sm flex items-center justify-center relative overflow-hidden group cursor-pointer hover:scale-105 transition-transform duration-300 active:scale-95 touch-manipulation">
              {/* Inner glow */}
              <div className="absolute inset-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-white/20"></div>
              
              {/* Central star */}
              <div className="relative z-10">
                <Star className="w-20 h-20 sm:w-24 sm:h-24 text-yellow-300 animate-pulse group-hover:animate-spin transition-all duration-500" fill="currentColor" />
              </div>

              {/* Magical shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer"></div>
            </div>

            {/* Floating rings */}
            {[1, 2, 3].map(ring => (
              <div
                key={ring}
                className="absolute inset-0 rounded-full border border-white/20 animate-ping"
                style={{
                  animationDelay: `${ring}s`,
                  animationDuration: '3s',
                  transform: `scale(${1 + ring * 0.1})`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mb-6 sm:mb-8 space-y-4 px-2">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-sm text-yellow-400">
              ⭐ {t('blindbox.selectHint')}
            </p>
          </div>
          
          {/* One-time use warning */}
          <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-4 border border-red-400/20">
            <p className="text-sm text-red-300">
              ⚠️ {t('blindbox.oneTimeUse')}
            </p>
          </div>

          {/* User info */}
          <div className="bg-green-500/10 backdrop-blur-sm rounded-2xl p-4 border border-green-400/20">
            <p className="text-sm text-green-300">
              ✅ {t('blindbox.loggedInAs')}: {user.user_metadata?.full_name || user.email?.split('@')[0]}
            </p>
          </div>
        </div>

        {/* Open button */}
        <button
          onClick={openBlindBox}
          disabled={!starChain.wishes || starChain.wishes.length === 0 || starChain.is_opened || openingAttempted}
          className="group w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 sm:px-12 py-4 sm:py-5 rounded-full text-lg sm:text-xl font-bold transition-all duration-300 transform active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 mx-auto relative overflow-hidden touch-manipulation min-h-[64px]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 animate-shimmer"></div>
          <Star className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-spin relative z-10" fill="currentColor" />
          <span className="relative z-10">
            {starChain.is_opened ? t('blindbox.opened') : openingAttempted ? t('blindbox.opening') : t('blindbox.openButton')}
          </span>
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-pulse relative z-10" />
        </button>
      </div>
    </div>
  );
};

export default BlindBox;