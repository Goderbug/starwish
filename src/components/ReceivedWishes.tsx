import React, { useState, useEffect } from 'react';
import { Heart, Star, Calendar, User, Gift, Clock, Sparkles, Check, X, Edit3 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, UserOpenedWish } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const ReceivedWishes: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [openedWishes, setOpenedWishes] = useState<UserOpenedWish[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 笔记编辑状态
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({});
  const [savingNotes, setSavingNotes] = useState<{ [key: string]: boolean }>({});

  // ✅ 简化：只在有用户时获取数据，不需要额外检查
  useEffect(() => {
    if (user) {
      fetchOpenedWishes();
    } else {
      // 如果没有用户，设置loading为false，显示空状态
      setLoading(false);
    }
  }, [user]);

  const fetchOpenedWishes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_opened_wishes')
        .select(`
          *,
          wish:wishes(*),
          star_chain:star_chains(*)
        `)
        .eq('user_fingerprint', user.id)
        .order('opened_at', { ascending: false });

      if (error) throw error;
      setOpenedWishes(data || []);
    } catch (error) {
      console.error('Error fetching opened wishes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (wishId: string, currentFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('user_opened_wishes')
        .update({ is_favorite: !currentFavorite })
        .eq('id', wishId);

      if (error) throw error;

      setOpenedWishes(prev =>
        prev.map(wish =>
          wish.id === wishId
            ? { ...wish, is_favorite: !currentFavorite }
            : wish
        )
      );
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  // 开始编辑笔记
  const startEditingNotes = (wishId: string, currentNotes: string) => {
    setEditingNotes(prev => ({
      ...prev,
      [wishId]: currentNotes
    }));
  };

  // 取消编辑笔记
  const cancelEditingNotes = (wishId: string) => {
    setEditingNotes(prev => {
      const newState = { ...prev };
      delete newState[wishId];
      return newState;
    });
  };

  // 保存笔记
  const saveNotes = async (wishId: string) => {
    const newNotes = editingNotes[wishId] || '';
    
    setSavingNotes(prev => ({ ...prev, [wishId]: true }));
    
    try {
      const { error } = await supabase
        .from('user_opened_wishes')
        .update({ notes: newNotes })
        .eq('id', wishId);

      if (error) throw error;

      // 更新本地状态
      setOpenedWishes(prev =>
        prev.map(wish =>
          wish.id === wishId ? { ...wish, notes: newNotes } : wish
        )
      );

      // 清除编辑状态
      cancelEditingNotes(wishId);
    } catch (error) {
      console.error('Error updating notes:', error);
    } finally {
      setSavingNotes(prev => ({ ...prev, [wishId]: false }));
    }
  };

  const categoryIcons = {
    gift: Gift,
    experience: Heart,
    moment: Clock,
  };

  const categoryColors = {
    gift: 'from-pink-400 to-rose-400',
    experience: 'from-purple-400 to-indigo-400',
    moment: 'from-blue-400 to-cyan-400',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">{t('receivedWishes.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 p-4 pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent">
            ✨ {t('receivedWishes.title')} ✨
          </h1>
          <p className="text-gray-300">{t('receivedWishes.subtitle')}</p>
        </div>

        {/* Wishes collection */}
        {openedWishes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-28 h-28 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-14 h-14 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-300">{t('receivedWishes.noWishes')}</h3>
            <p className="text-gray-400 mb-6">{t('receivedWishes.noWishesDesc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {openedWishes.map((openedWish) => {
              const wish = openedWish.wish;
              if (!wish) return null;

              const Icon = categoryIcons[wish.category];
              const isEditingThisNote = editingNotes.hasOwnProperty(openedWish.id);
              const isSavingThisNote = savingNotes[openedWish.id];
              
              return (
                <div
                  key={openedWish.id}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all relative overflow-hidden"
                >
                  {/* Background sparkles */}
                  <div className="absolute inset-0 opacity-30">
                    {[...Array(10)].map((_, i) => (
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
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${categoryColors[wish.category]} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-white">{wish.title}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <User className="w-3 h-3" />
                            <span>{t('receivedWishes.from')} {openedWish.creator_name || t('receivedWishes.anonymous')}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Favorite button */}
                      <button
                        onClick={() => toggleFavorite(openedWish.id, openedWish.is_favorite)}
                        className={`p-2 rounded-full transition-all ${
                          openedWish.is_favorite
                            ? 'text-red-400 bg-red-400/20'
                            : 'text-gray-400 hover:text-red-400 hover:bg-red-400/10'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${openedWish.is_favorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Wish content */}
                    {wish.description && (
                      <p className="text-gray-300 mb-4 leading-relaxed">
                        {wish.description}
                      </p>
                    )}

                    {/* Tags */}
                    {wish.tags && wish.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {wish.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Price */}
                    {wish.estimated_price && (
                      <p className="text-yellow-400 text-sm mb-4">💰 {wish.estimated_price}</p>
                    )}

                    {/* Original notes */}
                    {wish.notes && (
                      <div className="bg-black/20 rounded-xl p-3 mb-4">
                        <p className="text-sm text-gray-300 italic">"{wish.notes}"</p>
                      </div>
                    )}

                    {/* Personal notes section - 重新设计 */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-400">
                          {t('receivedWishes.yourNotes')}:
                        </label>
                        {!isEditingThisNote && (
                          <button
                            onClick={() => startEditingNotes(openedWish.id, openedWish.notes)}
                            className="flex items-center space-x-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>编辑</span>
                          </button>
                        )}
                      </div>

                      {isEditingThisNote ? (
                        // 编辑模式
                        <div className="space-y-3">
                          <textarea
                            value={editingNotes[openedWish.id] || ''}
                            onChange={(e) => setEditingNotes(prev => ({
                              ...prev,
                              [openedWish.id]: e.target.value
                            }))}
                            placeholder={t('receivedWishes.notesPlaceholder')}
                            className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all resize-none text-sm"
                            rows={3}
                            disabled={isSavingThisNote}
                          />
                          
                          {/* 确认和取消按钮 */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => saveNotes(openedWish.id)}
                              disabled={isSavingThisNote}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white rounded-lg transition-all text-xs font-medium"
                            >
                              {isSavingThisNote ? (
                                <>
                                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>保存中...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>确认</span>
                                </>
                              )}
                            </button>
                            
                            <button
                              onClick={() => cancelEditingNotes(openedWish.id)}
                              disabled={isSavingThisNote}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600/50 text-white rounded-lg transition-all text-xs font-medium"
                            >
                              <X className="w-3 h-3" />
                              <span>取消</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        // 显示模式
                        <div 
                          onClick={() => startEditingNotes(openedWish.id, openedWish.notes)}
                          className="min-h-[60px] p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 cursor-text hover:bg-white/10 transition-all text-sm flex items-start"
                        >
                          {openedWish.notes ? (
                            <span className="text-gray-200">{openedWish.notes}</span>
                          ) : (
                            <span className="text-gray-500 italic">{t('receivedWishes.notesPlaceholder')}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(openedWish.opened_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                        <span>{t('receivedWishes.received')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceivedWishes;