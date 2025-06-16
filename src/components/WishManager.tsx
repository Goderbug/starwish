import React, { useState } from 'react';
import { Star, Trash2, Share2, Copy, Gift, Heart, Clock, Plus, Check, List, Sparkles, Calendar, Tag } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, generateShareCode, Wish } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface WishManagerProps {
  wishes: Wish[];
  onDeleteWish: (id: string) => void;
  onUpdateWish: (id: string, updates: Partial<Wish>) => void;
  onBack: () => void;
  onNavigate: (page: 'create') => void;
}

const WishManager: React.FC<WishManagerProps> = ({ 
  wishes, 
  onDeleteWish, 
  onUpdateWish, 
  onBack, 
  onNavigate 
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedWishes, setSelectedWishes] = useState<string[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 删除确认相关状态
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [wishToDelete, setWishToDelete] = useState<Wish | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const categoryIcons = {
    gift: Sparkles,
    experience: Heart,
    moment: Calendar,
  };

  const categoryColors = {
    gift: 'from-pink-400 to-rose-400',
    experience: 'from-purple-400 to-indigo-400',
    moment: 'from-blue-400 to-cyan-400',
  };

  const priorityConfig = {
    low: { 
      color: 'bg-emerald-500', 
      label: t('priority.low'),
      glow: 'shadow-emerald-500/30'
    },
    medium: { 
      color: 'bg-amber-500', 
      label: t('priority.medium'),
      glow: 'shadow-amber-500/30'
    },
    high: { 
      color: 'bg-red-500', 
      label: t('priority.high'),
      glow: 'shadow-red-500/30'
    },
  };

  const toggleWishSelection = (wishId: string) => {
    setSelectedWishes(prev => 
      prev.includes(wishId) 
        ? prev.filter(id => id !== wishId)
        : [...prev, wishId]
    );
  };

  const selectAllWishes = () => {
    if (selectedWishes.length === wishes.length) {
      setSelectedWishes([]);
    } else {
      setSelectedWishes(wishes.map(w => w.id));
    }
  };

  // 处理删除愿望点击
  const handleDeleteClick = (e: React.MouseEvent, wish: Wish) => {
    e.stopPropagation();
    console.log('🗑️ 准备删除星愿:', wish.title);
    setWishToDelete(wish);
    setShowDeleteModal(true);
  };

  // 确认删除愿望
  const confirmDelete = async () => {
    if (!wishToDelete) return;
    
    setIsDeleting(true);
    console.log('🗑️ 确认删除星愿:', wishToDelete.title);
    
    try {
      await onDeleteWish(wishToDelete.id);
      console.log('✅ 星愿删除成功');
      setShowDeleteModal(false);
      setWishToDelete(null);
    } catch (error) {
      console.error('❌ 删除星愿失败:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // 取消删除
  const cancelDelete = () => {
    console.log('❌ 取消删除星愿');
    setShowDeleteModal(false);
    setWishToDelete(null);
  };

  const generateShareLink = async () => {
    console.log('🔄 开始编织星链检查...', { 
      selectedWishesCount: selectedWishes.length,
      user: user ? { id: user.id, email: user.email } : null,
      userExists: !!user
    });

    if (selectedWishes.length === 0) {
      setError('请先选择要分享的星愿');
      return;
    }
    
    if (!user) {
      console.error('❌ 用户未登录');
      setError('请先登录后再创建星链');
      return;
    }
    
    console.log('✅ 用户验证通过，开始编织星链...', { 
      userId: user.id,
      wishCount: selectedWishes.length 
    });
    
    setIsGeneratingLink(true);
    setError(null);
    
    try {
      // 验证用户是否存在于数据库中
      console.log('🔍 验证用户数据库记录...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        console.error('❌ 用户数据库验证失败:', userError);
        // 如果用户不存在，尝试创建用户记录
        console.log('🔄 尝试创建用户记录...');
        const { error: createUserError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.full_name || user.user_metadata?.name,
            avatar_url: user.user_metadata?.avatar_url,
            google_id: user.user_metadata?.provider_id,
          });
        
        if (createUserError) {
          console.error('❌ 创建用户记录失败:', createUserError);
          throw new Error('用户验证失败，请重新登录');
        }
        console.log('✅ 用户记录创建成功');
      } else {
        console.log('✅ 用户数据库验证成功:', userData);
      }
      
      // 验证选中的星愿是否属于当前用户
      console.log('🔍 验证星愿所有权...');
      const { data: wishData, error: wishError } = await supabase
        .from('wishes')
        .select('id, user_id, title')
        .in('id', selectedWishes)
        .eq('user_id', user.id);
      
      if (wishError) {
        console.error('❌ 星愿验证失败:', wishError);
        throw new Error('验证星愿失败，请重试');
      }
      
      if (!wishData || wishData.length !== selectedWishes.length) {
        console.error('❌ 星愿数量不匹配:', { 
          expected: selectedWishes.length, 
          actual: wishData?.length || 0 
        });
        throw new Error('部分星愿不存在或不属于您，请刷新页面重试');
      }
      
      console.log('✅ 星愿验证成功:', wishData.map(w => w.title));
      
      // 显示编织动画
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 创建星链
      const shareCode = generateShareCode();
      console.log('📝 创建星链记录...', { shareCode });
      
      const starChainData = {
        creator_id: user.id,
        share_code: shareCode,
        is_active: true,
        name: `星链 ${new Date().toLocaleDateString()}`,
        description: `包含 ${selectedWishes.length} 个星愿的神秘星链`
      };
      
      console.log('📝 星链数据:', starChainData);
      
      const { data: starChain, error: chainError } = await supabase
        .from('star_chains')
        .insert(starChainData)
        .select()
        .single();

      if (chainError) {
        console.error('❌ 创建星链失败:', chainError);
        throw new Error(`创建星链失败: ${chainError.message || '未知错误'}`);
      }

      console.log('✅ 星链创建成功:', starChain);

      // 添加星愿到星链
      const chainWishes = selectedWishes.map(wishId => ({
        chain_id: starChain.id,
        wish_id: wishId,
      }));

      console.log('📝 添加星愿到星链...', chainWishes);

      const { error: wishError2 } = await supabase
        .from('star_chain_wishes')
        .insert(chainWishes);

      if (wishError2) {
        console.error('❌ 添加星愿到星链失败:', wishError2);
        // 如果添加星愿失败，尝试删除已创建的星链
        await supabase
          .from('star_chains')
          .delete()
          .eq('id', starChain.id);
        throw new Error(`添加星愿失败: ${wishError2.message || '未知错误'}`);
      }

      console.log('✅ 星愿添加成功');

      const link = `${window.location.origin}?box=${shareCode}`;
      setGeneratedLink(link);
      setIsGeneratingLink(false);
      setShowShareModal(true);
      
      console.log('🎉 星链编织完成:', link);
    } catch (error: any) {
      console.error('❌ 编织星链失败:', error);
      setError(error.message || '编织星链失败，请重试');
      setIsGeneratingLink(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = generatedLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const closeModal = () => {
    setShowShareModal(false);
    setGeneratedLink('');
    setSelectedWishes([]);
    setLinkCopied(false);
    setError(null);
  };

  // Star chain weaving animation
  if (isGeneratingLink) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
        {/* Animated star particles */}
        <div className="absolute inset-0">
          {[...Array(80)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            />
          ))}
        </div>

        <div className="text-center relative z-10">
          {/* Central weaving animation */}
          <div className="relative mb-8">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 flex items-center justify-center animate-spin relative overflow-hidden">
              <div className="absolute inset-2 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 rounded-full animate-pulse"></div>
              <Star className="w-16 h-16 sm:w-20 sm:h-20 text-white animate-pulse relative z-10" fill="currentColor" />
            </div>
            
            {/* Expanding energy rings */}
            {[1, 2, 3, 4].map(ring => (
              <div
                key={ring}
                className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"
                style={{
                  animationDelay: `${ring * 0.3}s`,
                  animationDuration: '2s',
                  transform: `scale(${1 + ring * 0.2})`,
                }}
              />
            ))}
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-4 animate-pulse bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent">
            ✨ {t('manager.weaving')} ✨
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 animate-pulse mb-4">
            {t('manager.weavingDesc')}
          </p>
          <p className="text-gray-400 text-sm sm:text-base">
            {t('manager.contains')} {selectedWishes.length} {t('manager.subtitle')}
          </p>
          
          {/* Progress dots */}
          <div className="mt-8 flex justify-center space-x-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Title - 移到这里并居中 */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 mb-4 sm:mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse"></div>
            <List className="w-8 h-8 sm:w-10 sm:h-10 text-white relative z-10" />
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent mb-2 sm:mb-4">
            {t('manager.title')}
          </h1>
          <p className="text-gray-300 text-sm sm:text-base">
            ✨ {wishes.length} {t('manager.subtitle')} ✨
          </p>
        </div>

        {/* Action button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => onNavigate('create')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-3 sm:px-4 py-2 rounded-xl flex items-center space-x-1 sm:space-x-2 transition-all text-sm sm:text-base touch-manipulation"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('manager.newWish')}</span>
            <span className="sm:hidden">{t('common.new')}</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-red-300 hover:text-red-200 text-xs"
            >
              关闭
            </button>
          </div>
        )}

        {/* Selection controls */}
        <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={selectAllWishes}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors touch-manipulation"
              >
                <div className={`w-4 h-4 rounded border-2 border-white/40 flex items-center justify-center ${
                  selectedWishes.length === wishes.length ? 'bg-purple-500 border-purple-500' : ''
                }`}>
                  {selectedWishes.length === wishes.length && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <span>{t('manager.selectAll')}</span>
              </button>
              
              {selectedWishes.length > 0 && (
                <span className="text-sm font-medium text-purple-300">
                  {t('manager.selected')} {selectedWishes.length}
                </span>
              )}
            </div>
            
            {selectedWishes.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedWishes([])}
                  className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
                >
                  {t('manager.cancel')}
                </button>
                <button
                  onClick={generateShareLink}
                  disabled={isGeneratingLink || !user}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all flex items-center space-x-1 shadow-lg touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{t('manager.weaveChain')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Selection hint */}
          {selectedWishes.length === 0 && (
            <p className="text-sm text-gray-400 text-center mt-2">
              💫 {t('manager.hint')}
            </p>
          )}
        </div>

        {/* Wishes grid */}
        {wishes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star className="w-14 h-14 sm:w-16 sm:h-16 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-300">{t('manager.noWishes')}</h3>
            <button
              onClick={() => onNavigate('create')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl transition-all touch-manipulation"
            >
              {t('manager.plantFirst')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {wishes.map((wish) => {
              const Icon = categoryIcons[wish.category];
              const isSelected = selectedWishes.includes(wish.id);
              const priorityInfo = priorityConfig[wish.priority];
              
              return (
                <div
                  key={wish.id}
                  className={`group relative bg-white/5 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 cursor-pointer active:scale-95 touch-manipulation overflow-hidden ${
                    isSelected 
                      ? 'border-purple-400 bg-purple-400/10 shadow-lg shadow-purple-400/20 scale-105' 
                      : 'border-white/10 hover:border-white/20 hover:bg-white/10'
                  }`}
                  onClick={() => toggleWishSelection(wish.id)}
                >
                  {/* Background gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${categoryColors[wish.category]} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                  
                  {/* Selection indicator */}
                  <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                    isSelected 
                      ? 'bg-purple-500 border-purple-500 scale-110' 
                      : 'border-white/30 hover:border-white/50'
                  }`}>
                    {isSelected && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>

                  <div className="relative z-10 p-5 sm:p-6">
                    {/* Header with icon and priority */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${categoryColors[wish.category]} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      
                      {/* Priority badge - 重新设计位置 */}
                      <div className={`px-3 py-1 rounded-full ${priorityInfo.color} ${priorityInfo.glow} shadow-lg flex items-center space-x-1`}>
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        <span className="text-white text-xs font-medium">{priorityInfo.label}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-lg mb-3 text-white leading-tight pr-8 line-clamp-2">
                      {wish.title}
                    </h3>
                    
                    {/* Description */}
                    {wish.description && (
                      <p className="text-gray-300 text-sm mb-4 line-clamp-3 leading-relaxed">
                        {wish.description}
                      </p>
                    )}

                    {/* Tags */}
                    {wish.tags && wish.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {wish.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                        {wish.tags.length > 3 && (
                          <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-400">
                            +{wish.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Price */}
                    {wish.estimated_price && (
                      <div className="flex items-center space-x-1 mb-4">
                        <span className="text-yellow-400 text-sm">💰</span>
                        <span className="text-yellow-400 text-sm font-medium">{wish.estimated_price}</span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(wish.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <button
                        onClick={(e) => handleDeleteClick(e, wish)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors touch-manipulation opacity-0 group-hover:opacity-100"
                        title="删除星愿"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Selection glow effect */}
                  {isSelected && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/10 to-pink-400/10 pointer-events-none"></div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && wishToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900/95 backdrop-blur-sm rounded-3xl p-6 sm:p-8 max-w-md w-full border border-white/20 relative overflow-hidden">
              {/* Background sparkles */}
              <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-red-300 rounded-full animate-pulse"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                    }}
                  />
                ))}
              </div>

              <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white">
                    确认删除星愿
                  </h3>
                  <p className="text-gray-300 text-center text-sm sm:text-base">
                    你确定要删除这个星愿吗？此操作无法撤销。
                  </p>
                </div>
                
                {/* Wish preview */}
                <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${categoryColors[wishToDelete.category]} flex items-center justify-center`}>
                      {React.createElement(categoryIcons[wishToDelete.category], { className: "w-4 h-4 text-white" })}
                    </div>
                    <h4 className="font-semibold text-white">{wishToDelete.title}</h4>
                  </div>
                  {wishToDelete.description && (
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {wishToDelete.description}
                    </p>
                  )}
                </div>

                {/* Warning */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                  <p className="text-red-400 text-sm text-center">
                    ⚠️ 删除后，这个星愿将从所有已分享的星链中移除
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={cancelDelete}
                    disabled={isDeleting}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 sm:py-4 rounded-xl transition-colors touch-manipulation disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-3 sm:py-4 rounded-xl transition-all touch-manipulation disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>删除中...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>确认删除</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 max-w-md w-full border border-white/20 relative overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Background sparkles */}
              <div className="absolute inset-0">
                {[...Array(30)].map((_, i) => (
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
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Share2 className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                    ✨ {t('manager.chainComplete')} ✨
                  </h3>
                  <p className="text-gray-300 text-center text-sm sm:text-base">
                    {t('manager.shareDesc')}
                  </p>
                </div>
                
                {/* Link display */}
                <div className="bg-black/30 rounded-xl p-4 mb-6 border border-white/10">
                  <p className="text-sm text-gray-400 mb-2">{t('manager.chainLabel')}:</p>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-white text-xs sm:text-sm break-all font-mono">
                      {generatedLink}
                    </p>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 mb-6 border border-purple-400/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                    <span className="text-sm font-medium text-purple-200">{t('manager.contains')} {selectedWishes.length} {t('manager.subtitle')}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {t('manager.randomNote')} ✨
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={copyLink}
                    className={`flex-1 py-3 sm:py-4 rounded-xl flex items-center justify-center space-x-2 transition-all touch-manipulation ${
                      linkCopied 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                    }`}
                  >
                    {linkCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{t('manager.copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>{t('manager.copyLink')}</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 sm:py-4 rounded-xl transition-colors touch-manipulation"
                  >
                    {t('manager.done')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishManager;