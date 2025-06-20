import React, { useState, useEffect } from 'react';
import { Heart, Star, Calendar, User, Gift, Clock, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, UserOpenedWish } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const ReceivedWishes: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth(); // 使用用户ID而不是指纹
  const [openedWishes, setOpenedWishes] = useState<UserOpenedWish[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOpenedWishes();
    }
  }, [user]);

  const fetchOpenedWishes = async () => {
    if (!user) return;

    try {
      // ✅ 修改：使用用户ID查询收到的星愿
      const { data, error } = await supabase
        .from('user_opened_wishes')
        .select(`
          *,
          wish:wishes(*),
          star_chain:star_chains(*)
        `)
        .eq('user_fingerprint', user.id) // 使用用户ID而不是指纹
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

  const updateNotes = async (wishId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('user_opened_wishes')
        .update({ notes })
        .eq('id', wishId);

      if (error) throw error;

      setOpenedWishes(prev =>
        prev.map(wish =>
          wish.id === wishId ? { ...wish, notes } : wish
        )
      );
    } catch (error) {
      console.error('Error updating notes:', error);
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

  // ✅ 新增：未登录状态处理
  if (!user) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-28 h-28 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-14 h-14 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-300">请先登录</h3>
          <p className="text-gray-400 mb-6">登录后即可查看你收到的所有星愿</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">{t('receivedWishes.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-8">
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

                    {/* Personal notes */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        {t('receivedWishes.yourNotes')}:
                      </label>
                      <textarea
                        value={openedWish.notes}
                        onChange={(e) => updateNotes(openedWish.id, e.target.value)}
                        placeholder={t('receivedWishes.notesPlaceholder')}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all resize-none text-sm"
                        rows={2}
                      />
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