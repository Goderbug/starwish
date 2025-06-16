import React, { useState, useEffect } from 'react';
import { Star, Sparkles, Gift, Heart, Clock, Wand2, UserPlus, LogIn } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, generateUserFingerprint } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './AuthModal';

interface BlindBoxProps {
  boxId: string | null;
  onBack: () => void;
}

const BlindBox: React.FC<BlindBoxProps> = ({ boxId, onBack }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [starChain, setStarChain] = useState<any>(null);
  const [selectedWish, setSelectedWish] = useState<any>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userFingerprint] = useState(() => generateUserFingerprint());

  useEffect(() => {
    if (boxId) {
      fetchStarChain();
    }
  }, [boxId]);

  const fetchStarChain = async () => {
    if (!boxId) return;

    try {
      console.log('🔍 获取星链数据:', boxId);
      
      // 获取星链基本信息
      const { data: chainData, error: chainError } = await supabase
        .from('star_chains')
        .select(`
          *,
          creator:users(name, email)
        `)
        .eq('share_code', boxId)
        .eq('is_active', true)
        .single();

      if (chainError) {
        console.error('❌ 获取星链失败:', chainError);
        throw chainError;
      }

      if (!chainData) {
        console.error('❌ 星链不存在');
        setError('Star chain not found or expired');
        return;
      }

      console.log('✅ 星链数据获取成功:', chainData);

      // 检查是否过期
      if (chainData.expires_at && new Date(chainData.expires_at) < new Date()) {
        console.error('❌ 星链已过期');
        setError('Star chain has expired');
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
        throw wishesError;
      }

      const wishes = wishesData?.map((item: any) => item.wish).filter(Boolean) || [];
      console.log('✅ 星愿数据获取成功:', wishes.length, '个星愿');

      if (wishes.length === 0) {
        console.error('❌ 星链中没有星愿');
        setError('No wishes found in this star chain');
        return;
      }

      setStarChain({
        ...chainData,
        wishes: wishes
      });

    } catch (error: any) {
      console.error('❌ 获取星链数据失败:', error);
      setError('Failed to load star chain');
    } finally {
      setLoading(false);
    }
  };

  const categoryIcons = {
    gift: Gift,
    experience: Heart,
    moment: Clock,
  };

  const openBlindBox = async () => {
    if (!starChain || !starChain.wishes || starChain.wishes.length === 0) {
      console.error('❌ 没有可用的星愿');
      setError('No wishes available');
      return;
    }
    
    console.log('🎁 开始打开盲盒，可用星愿:', starChain.wishes.length);
    setIsOpening(true);
    setError(null);
    
    try {
      // 显示开启动画
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 随机选择一个星愿
      const randomIndex = Math.floor(Math.random() * starChain.wishes.length);
      const chosen = starChain.wishes[randomIndex];
      
      console.log('🎯 随机选中星愿:', chosen.title, '索引:', randomIndex);
      setSelectedWish(chosen);

      // 记录开启行为
      try {
        console.log('📝 记录盲盒开启...');
        
        // 记录到 blind_box_opens 表
        const { error: openError } = await supabase
          .from('blind_box_opens')
          .insert({
            chain_id: starChain.id,
            wish_id: chosen.id,
            opener_fingerprint: userFingerprint,
            user_agent: navigator.userAgent,
            ip_hash: 'hashed_ip' // 在生产环境中应该使用真实的IP哈希
          });

        if (openError) {
          console.error('❌ 记录开启失败:', openError);
        } else {
          console.log('✅ 开启记录成功');
        }

        // 记录到用户的收到星愿列表（使用指纹识别）
        const { error: userWishError } = await supabase
          .from('user_opened_wishes')
          .insert({
            user_fingerprint: userFingerprint,
            wish_id: chosen.id,
            chain_id: starChain.id,
            creator_name: starChain.creator?.name || 'Anonymous'
          });

        if (userWishError) {
          console.error('❌ 保存用户星愿失败:', userWishError);
        } else {
          console.log('✅ 用户星愿保存成功');
        }

      } catch (recordError) {
        console.error('❌ 记录开启异常:', recordError);
        // 不影响主流程，继续显示结果
      }

      setHasOpened(true);
      
    } catch (error: any) {
      console.error('❌ 打开盲盒失败:', error);
      setError('Failed to open blind box');
    } finally {
      setIsOpening(false);
    }
  };

  // 处理注册后的数据迁移
  const handlePostRegistration = async () => {
    if (!user || !selectedWish) return;

    try {
      console.log('🔄 开始迁移匿名用户数据到注册用户...');
      
      // 检查是否已经存在该用户的记录
      const { data: existingRecord } = await supabase
        .from('user_opened_wishes')
        .select('id')
        .eq('wish_id', selectedWish.id)
        .eq('chain_id', starChain.id)
        .eq('user_fingerprint', userFingerprint)
        .single();

      if (existingRecord) {
        console.log('✅ 数据已存在，无需迁移');
        return;
      }

      // 创建新的记录关联到注册用户
      const { error } = await supabase
        .from('user_opened_wishes')
        .insert({
          user_fingerprint: userFingerprint,
          wish_id: selectedWish.id,
          chain_id: starChain.id,
          creator_name: starChain.creator?.name || 'Anonymous'
        });

      if (error) {
        console.error('❌ 数据迁移失败:', error);
      } else {
        console.log('✅ 数据迁移成功');
      }

    } catch (error) {
      console.error('❌ 数据迁移异常:', error);
    }
  };

  // 监听用户登录状态变化
  useEffect(() => {
    if (user && hasOpened && selectedWish) {
      handlePostRegistration();
    }
  }, [user, hasOpened, selectedWish]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !starChain) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-r from-gray-400/20 to-gray-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Star className="w-14 h-14 sm:w-16 sm:h-16 text-gray-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-gray-300">{t('blindbox.expired')}</h2>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">{error || t('blindbox.expiredDesc')}</p>
          <button
            onClick={onBack}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl transition-colors touch-manipulation"
          >
            {t('blindbox.goBack')}
          </button>
        </div>
      </div>
    );
  }

  if (isOpening) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
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
      <div className="min-h-screen p-4 flex items-center justify-center">
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

          {/* Registration prompt for anonymous users */}
          {!user && (
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6 mb-6 border border-blue-400/30">
              <div className="mb-4">
                <UserPlus className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-2 text-white">保存你的星愿收藏</h3>
                <p className="text-blue-200 text-sm mb-4">
                  注册账户后，这个美好的星愿将永久保存在你的收藏中，你还可以查看更多收到的星愿！
                </p>
              </div>
              
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl transition-all touch-manipulation font-medium flex items-center justify-center space-x-2"
              >
                <LogIn className="w-4 h-4" />
                <span>注册保存星愿</span>
              </button>
            </div>
          )}

          {/* Action button */}
          <button
            onClick={onBack}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-4 sm:py-5 rounded-xl transition-all text-lg font-semibold touch-manipulation min-h-[56px]"
          >
            {t('blindbox.doneButton')}
          </button>
        </div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode="signup"
          onModeChange={() => {}}
        />
      </div>
    );
  }

  // Initial blind box view
  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
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
        </div>

        {/* Open button */}
        <button
          onClick={openBlindBox}
          disabled={!starChain.wishes || starChain.wishes.length === 0}
          className="group w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 sm:px-12 py-4 sm:py-5 rounded-full text-lg sm:text-xl font-bold transition-all duration-300 transform active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 mx-auto relative overflow-hidden touch-manipulation min-h-[64px]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 animate-shimmer"></div>
          <Star className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-spin relative z-10" fill="currentColor" />
          <span className="relative z-10">{t('blindbox.openButton')}</span>
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-pulse relative z-10" />
        </button>
      </div>
    </div>
  );
};

export default BlindBox;