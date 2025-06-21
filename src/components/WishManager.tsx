import React, { useState, useMemo, useCallback } from 'react';
import { Star, Trash2, Share2, Copy, Plus, Check, Calendar, Tag, Filter, X, ChevronDown, ChevronUp, Search } from 'lucide-react';
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

type SortOption = 'newest' | 'oldest' | 'priority-high' | 'priority-low' | 'title-az' | 'title-za';
type FilterCategory = 'all' | 'gift' | 'experience' | 'moment';
type FilterPriority = 'all' | 'low' | 'medium' | 'high';

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
  
  // 筛选和排序状态
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 删除确认相关状态
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [wishToDelete, setWishToDelete] = useState<Wish | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // ✅ 修复：只检查基本条件，不检查用户状态
  const canWeaveChain = useMemo(() => {
    return selectedWishes.length > 0 && !isGeneratingLink;
  }, [selectedWishes.length, isGeneratingLink]);

  // 筛选和排序逻辑
  const filteredAndSortedWishes = useMemo(() => {
    let filtered = wishes;

    // 按类型筛选
    if (filterCategory !== 'all') {
      filtered = filtered.filter(wish => wish.category === filterCategory);
    }

    // 按优先级筛选
    if (filterPriority !== 'all') {
      filtered = filtered.filter(wish => wish.priority === filterPriority);
    }

    // 按搜索关键词筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(wish => 
        wish.title.toLowerCase().includes(query) ||
        wish.description.toLowerCase().includes(query) ||
        wish.tags.some(tag => tag.toLowerCase().includes(query)) ||
        wish.notes.toLowerCase().includes(query)
      );
    }

    // 排序
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'priority-high':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'priority-low':
          const priorityOrderLow = { high: 3, medium: 2, low: 1 };
          return priorityOrderLow[a.priority] - priorityOrderLow[b.priority];
        case 'title-az':
          return a.title.localeCompare(b.title);
        case 'title-za':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return sorted;
  }, [wishes, filterCategory, filterPriority, sortBy, searchQuery]);

  // 获取筛选统计
  const getFilterStats = () => {
    const stats = {
      all: wishes.length,
      gift: wishes.filter(w => w.category === 'gift').length,
      experience: wishes.filter(w => w.category === 'experience').length,
      moment: wishes.filter(w => w.category === 'moment').length,
      low: wishes.filter(w => w.priority === 'low').length,
      medium: wishes.filter(w => w.priority === 'medium').length,
      high: wishes.filter(w => w.priority === 'high').length,
    };
    return stats;
  };

  const filterStats = getFilterStats();

  // 清除所有筛选条件
  const clearAllFilters = () => {
    setFilterCategory('all');
    setFilterPriority('all');
    setSortBy('newest');
    setSearchQuery('');
  };

  // 检查是否有活跃的筛选条件
  const hasActiveFilters = filterCategory !== 'all' || filterPriority !== 'all' || searchQuery.trim() !== '' || sortBy !== 'newest';

  const toggleWishSelection = useCallback((wishId: string) => {
    setSelectedWishes(prev => 
      prev.includes(wishId) 
        ? prev.filter(id => id !== wishId)
        : [...prev, wishId]
    );
  }, []);

  const selectAllWishes = useCallback(() => {
    if (selectedWishes.length === filteredAndSortedWishes.length && filteredAndSortedWishes.length > 0) {
      setSelectedWishes([]);
    } else {
      setSelectedWishes(filteredAndSortedWishes.map(w => w.id));
    }
  }, [selectedWishes.length, filteredAndSortedWishes]);

  // 处理删除愿望点击
  const handleDeleteClick = (e: React.MouseEvent, wish: Wish) => {
    e.stopPropagation();
    setWishToDelete(wish);
    setShowDeleteModal(true);
  };

  // 确认删除愿望
  const confirmDelete = async () => {
    if (!wishToDelete) return;
    
    setIsDeleting(true);
    
    try {
      await onDeleteWish(wishToDelete.id);
      setShowDeleteModal(false);
      setWishToDelete(null);
    } catch (error) {
      console.error('删除星愿失败:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // 取消删除
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setWishToDelete(null);
  };

  // ✅ 修复：简化按钮文本逻辑
  const getWeaveButtonText = () => {
    if (isGeneratingLink) return '编织中...';
    if (selectedWishes.length === 0) return '请选择星愿';
    return t('manager.weaveChain');
  };

  // ✅ 修复：使用星愿的user_id，不检查当前用户状态
  const generateShareLink = useCallback(async () => {
    console.log('🔄 开始创建星链...', { 
      selectedWishesCount: selectedWishes.length
    });

    // 只检查基本条件
    if (selectedWishes.length === 0) {
      setError('请先选择要分享的星愿');
      return;
    }

    if (isGeneratingLink) {
      return;
    }

    setIsGeneratingLink(true);
    setError(null);
    
    try {
      // 显示编织动画
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // ✅ 关键修复：从第一个选中的星愿获取user_id
      const firstSelectedWish = wishes.find(w => w.id === selectedWishes[0]);
      if (!firstSelectedWish) {
        throw new Error('找不到选中的星愿');
      }
      
      const creatorId = firstSelectedWish.user_id; // 直接使用星愿的创建者ID
      console.log('📝 使用星愿创建者ID创建星链:', { creatorId, shareCode: generateShareCode() });
      
      const shareCode = generateShareCode();
      
      const { data: starChain, error: chainError } = await supabase
        .from('star_chains')
        .insert({
          creator_id: creatorId, // 使用星愿的创建者ID
          share_code: shareCode,
          is_active: true,
          is_opened: false,
          name: `星链 ${new Date().toLocaleDateString()}`,
          description: `包含 ${selectedWishes.length} 个星愿的神秘星链`,
          total_opens: 0
        })
        .select()
        .single();

      if (chainError) {
        console.error('❌ 创建星链失败:', chainError);
        throw new Error('创建星链失败，请重试');
      }

      console.log('✅ 星链创建成功:', starChain);

      // 添加星愿到星链
      const chainWishes = selectedWishes.map(wishId => ({
        chain_id: starChain.id,
        wish_id: wishId,
      }));

      console.log('📝 添加星愿到星链...', chainWishes);

      const { error: wishError } = await supabase
        .from('star_chain_wishes')
        .insert(chainWishes);

      if (wishError) {
        console.error('❌ 添加星愿到星链失败:', wishError);
        // 回滚：删除已创建的星链
        await supabase.from('star_chains').delete().eq('id', starChain.id);
        throw new Error('添加星愿失败，请重试');
      }

      console.log('✅ 星愿添加成功');

      const link = `${window.location.origin}?box=${shareCode}`;
      setGeneratedLink(link);
      setShowShareModal(true);
      
      console.log('🎉 星链创建完成:', link);
    } catch (error: any) {
      console.error('❌ 创建星链失败:', error);
      setError(error.message || '创建星链失败，请重试');
    } finally {
      setIsGeneratingLink(false);
    }
  }, [selectedWishes, isGeneratingLink, wishes]); // 添加wishes依赖

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
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
          <div className="relative mb-8">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 flex items-center justify-center animate-spin relative overflow-hidden">
              <div className="absolute inset-2 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 rounded-full animate-pulse"></div>
              <Star className="w-16 h-16 sm:w-20 sm:h-20 text-white animate-pulse relative z-10" fill="currentColor" />
            </div>
            
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
    <div className="min-h-screen p-4 pb-32">
      <div className="max-w-4xl mx-auto">
        {/* Page Title */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent mb-2 sm:mb-4">
            {t('manager.title')}
          </h1>
          <p className="text-gray-300 text-sm sm:text-base">
            ✨ {filteredAndSortedWishes.length} / {wishes.length} {t('manager.subtitle')} ✨
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-red-300 hover:text-red-200 text-xs"
            >
              关闭
            </button>
          </div>
        )}

        {/* 搜索和筛选工具栏 */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索星愿..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 筛选按钮 */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all relative ${
                showFilters || hasActiveFilters
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                  : 'bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">筛选</span>
              {hasActiveFilters && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full"></div>
              )}
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* 新星愿按钮 */}
            <button
              onClick={() => onNavigate('create')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 sm:px-6 py-3 rounded-xl flex items-center space-x-2 transition-all text-sm sm:text-base touch-manipulation"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('manager.newWish')}</span>
              <span className="sm:hidden">{t('common.new')}</span>
            </button>
          </div>

          {/* 筛选面板 */}
          {showFilters && (
            <div className="mt-4 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 星愿类型筛选 */}
                <div>
                  <h4 className="text-xs font-medium text-gray-300 mb-2">星愿类型</h4>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { value: 'all', label: '全部', count: filterStats.all },
                      { value: 'gift', label: t('category.gift'), count: filterStats.gift },
                      { value: 'experience', label: t('category.experience'), count: filterStats.experience },
                      { value: 'moment', label: t('category.moment'), count: filterStats.moment },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFilterCategory(option.value as FilterCategory)}
                        className={`px-2 py-1 rounded-lg text-xs transition-all ${
                          filterCategory === option.value
                            ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {option.label} ({option.count})
                      </button>
                    ))}
                  </div>
                </div>

                {/* 渴望程度筛选 */}
                <div>
                  <h4 className="text-xs font-medium text-gray-300 mb-2">渴望程度</h4>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { value: 'all', label: '全部', count: filterStats.all },
                      { value: 'high', label: t('priority.high'), count: filterStats.high },
                      { value: 'medium', label: t('priority.medium'), count: filterStats.medium },
                      { value: 'low', label: t('priority.low'), count: filterStats.low },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFilterPriority(option.value as FilterPriority)}
                        className={`px-2 py-1 rounded-lg text-xs transition-all ${
                          filterPriority === option.value
                            ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {option.label} ({option.count})
                      </button>
                    ))}
                  </div>
                </div>

                {/* 排序选项 */}
                <div>
                  <h4 className="text-xs font-medium text-gray-300 mb-2">排序方式</h4>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20"
                  >
                    <option value="newest">最新创建</option>
                    <option value="oldest">最早创建</option>
                    <option value="priority-high">渴望程度高→低</option>
                    <option value="priority-low">渴望程度低→高</option>
                    <option value="title-az">标题 A→Z</option>
                    <option value="title-za">标题 Z→A</option>
                  </select>
                </div>
              </div>

              {/* 清除筛选按钮 */}
              {hasActiveFilters && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-600/50 hover:bg-gray-600/70 text-gray-300 rounded-lg transition-all text-xs"
                  >
                    <X className="w-3 h-3" />
                    <span>清除筛选</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 筛选结果提示 */}
          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-between text-xs text-blue-300">
              <span>显示 {filteredAndSortedWishes.length} / {wishes.length} 个星愿</span>
              <button
                onClick={clearAllFilters}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                清除筛选
              </button>
            </div>
          )}
        </div>

        {/* Wishes grid */}
        {filteredAndSortedWishes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
              {hasActiveFilters ? (
                <Filter className="w-14 h-14 sm:w-16 sm:h-16 text-gray-400" />
              ) : (
                <Star className="w-14 h-14 sm:w-16 sm:h-16 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-300">
              {hasActiveFilters ? '没有符合条件的星愿' : t('manager.noWishes')}
            </h3>
            <p className="text-gray-400 mb-6">
              {hasActiveFilters ? '尝试调整筛选条件或清除筛选' : '开始播种你的第一颗星愿吧'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearAllFilters}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl transition-all touch-manipulation"
              >
                清除筛选条件
              </button>
            ) : (
              <button
                onClick={() => onNavigate('create')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl transition-all touch-manipulation"
              >
                {t('manager.plantFirst')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredAndSortedWishes.map((wish) => {
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

                  <div className="relative z-10 p-6">
                    {/* Priority badge in top left */}
                    <div className="mb-6">
                      <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full ${priorityInfo.color} ${priorityInfo.glow} shadow-lg`}>
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        <span className="text-white text-xs font-medium">{priorityInfo.label}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-xl mb-4 text-white leading-tight line-clamp-2">
                      {wish.title}
                    </h3>
                    
                    {/* Description */}
                    {wish.description && (
                      <p className="text-gray-300 text-sm mb-6 line-clamp-3 leading-relaxed">
                        {wish.description}
                      </p>
                    )}

                    {/* Tags */}
                    {wish.tags && wish.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {wish.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                        {wish.tags.length > 3 && (
                          <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-400">
                            +{wish.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Price */}
                    {wish.estimated_price && (
                      <div className="flex items-center space-x-2 mb-6">
                        <span className="text-yellow-400 text-sm">💰</span>
                        <span className="text-yellow-400 text-sm font-medium">{wish.estimated_price}</span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
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
                
                <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${categoryColors[wishToDelete.category]} flex items-center justify-center`}>
                      <Star className="w-4 h-4 text-white" fill="currentColor" />
                    </div>
                    <h4 className="font-semibold text-white">{wishToDelete.title}</h4>
                  </div>
                  {wishToDelete.description && (
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {wishToDelete.description}
                    </p>
                  )}
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                  <p className="text-red-400 text-sm text-center">
                    ⚠️ 删除后，这个星愿将从所有已分享的星链中移除
                  </p>
                </div>

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
                
                <div className="bg-black/30 rounded-xl p-4 mb-6 border border-white/10">
                  <p className="text-sm text-gray-400 mb-2">{t('manager.chainLabel')}:</p>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-white text-xs sm:text-sm break-all font-mono">
                      {generatedLink}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 mb-6 border border-purple-400/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                    <span className="text-sm font-medium text-purple-200">{t('manager.contains')} {selectedWishes.length} {t('manager.subtitle')}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {t('manager.randomNote')} ✨
                  </p>
                </div>

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

      {/* 底部悬浮的选择和创建星链组件 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent backdrop-blur-sm">
        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                {/* 左侧：全选按钮 */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={selectAllWishes}
                    className="flex items-center space-x-3 px-4 py-3 text-sm bg-white/10 hover:bg-white/20 rounded-xl transition-colors touch-manipulation"
                  >
                    <div className={`w-5 h-5 rounded border-2 border-white/40 flex items-center justify-center ${
                      selectedWishes.length === filteredAndSortedWishes.length && filteredAndSortedWishes.length > 0 ? 'bg-purple-500 border-purple-500' : ''
                    }`}>
                      {selectedWishes.length === filteredAndSortedWishes.length && filteredAndSortedWishes.length > 0 && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="font-medium">{t('manager.selectAll')}</span>
                    {selectedWishes.length > 0 && (
                      <span className="text-purple-300 font-semibold bg-purple-500/20 px-2 py-1 rounded-full text-xs">
                        {selectedWishes.length}
                      </span>
                    )}
                  </button>
                </div>
                
                {/* 右侧：操作按钮或提示文字 */}
                <div className="flex items-center space-x-3">
                  {selectedWishes.length > 0 ? (
                    <>
                      <button
                        onClick={() => setSelectedWishes([])}
                        className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
                      >
                        {t('manager.cancel')}
                      </button>
                      <button
                        onClick={generateShareLink}
                        disabled={!canWeaveChain}
                        className={`px-6 py-2 text-sm rounded-lg transition-all flex items-center space-x-2 shadow-lg touch-manipulation ${
                          canWeaveChain
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                            : 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <Share2 className="w-4 h-4" />
                        <span>{getWeaveButtonText()}</span>
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      💫 {t('manager.hint')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishManager;