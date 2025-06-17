import React, { useState, useEffect } from 'react';
import { Share2, Copy, Eye, Calendar, Users, ExternalLink, Check, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, StarChain } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const ShareHistory: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [starChains, setStarChains] = useState<StarChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchStarChains();
    }
  }, [user]);

  const fetchStarChains = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('star_chains')
        .select(`
          *,
          star_chain_wishes(
            wish:wishes(*)
          )
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const chainsWithWishes = data.map(chain => ({
        ...chain,
        wishes: chain.star_chain_wishes?.map((scw: any) => scw.wish) || []
      }));

      setStarChains(chainsWithWishes);
    } catch (error) {
      console.error('Error fetching star chains:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = async (shareCode: string) => {
    const link = `${window.location.origin}?box=${shareCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(shareCode);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // 简化的日期格式函数
  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return '今天';
    } else if (diffDays <= 7) {
      return `${diffDays}天前`;
    } else if (diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}周前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      });
    }
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

  // 获取开启状态显示
  const getOpenStatus = (chain: StarChain) => {
    if (chain.is_opened) {
      return {
        text: '已开启',
        icon: CheckCircle,
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30'
      };
    } else {
      return {
        text: '未开启',
        icon: XCircle,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30'
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">{t('shareHistory.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('shareHistory.title')}</h1>
          <p className="text-gray-300">{t('shareHistory.subtitle')}</p>
        </div>

        {/* Share chains list */}
        {starChains.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-28 h-28 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Share2 className="w-14 h-14 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-300">{t('shareHistory.noShares')}</h3>
            <p className="text-gray-400 mb-6">{t('shareHistory.noSharesDesc')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {starChains.map((chain) => {
              const openStatus = getOpenStatus(chain);
              const StatusIcon = openStatus.icon;
              
              return (
                <div
                  key={chain.id}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all"
                >
                  {/* Chain header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                          <Share2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {chain.name || t('shareHistory.untitledChain')}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {t('shareHistory.code')}: {chain.share_code}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status indicator - 替换原来的 active/inactive */}
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${openStatus.bgColor} ${openStatus.color} border ${openStatus.borderColor}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span>{openStatus.text}</span>
                    </div>
                  </div>

                  {/* Chain stats - 统一布局设计 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    {/* 开启状态 - 替换原来的开启次数 */}
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      <div className={`text-2xl font-bold mb-1 ${openStatus.color}`}>
                        {chain.is_opened ? '✓' : '○'}
                      </div>
                      <div className="text-xs text-gray-400">开启状态</div>
                    </div>
                    
                    {/* 心愿数 */}
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white mb-1">{chain.wishes?.length || 0}</div>
                      <div className="text-xs text-gray-400">{t('shareHistory.wishes')}</div>
                    </div>
                    
                    {/* 创建时间 - 使用简化格式 */}
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white mb-1">{formatShortDate(chain.created_at)}</div>
                      <div className="text-xs text-gray-400">{t('shareHistory.created')}</div>
                    </div>
                    
                    {/* 过期时间 */}
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      {chain.expires_at ? (
                        <>
                          <div className="text-2xl font-bold text-white mb-1">{formatShortDate(chain.expires_at)}</div>
                          <div className="text-xs text-gray-400">{t('shareHistory.expires')}</div>
                        </>
                      ) : (
                        <>
                          <div className="text-2xl font-bold text-white mb-1">∞</div>
                          <div className="text-xs text-gray-400">{t('shareHistory.noExpiry')}</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 开启详情 - 只有已开启的才显示 */}
                  {chain.is_opened && chain.opened_at && (
                    <div className="mb-4 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                      <div className="flex items-center space-x-2 text-sm text-green-300">
                        <CheckCircle className="w-4 h-4" />
                        <span>已于 {formatDate(chain.opened_at)} 开启</span>
                      </div>
                    </div>
                  )}

                  {/* Wishes preview */}
                  {chain.wishes && chain.wishes.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">
                        {t('shareHistory.containedWishes')}:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {chain.wishes.slice(0, 3).map((wish) => (
                          <span
                            key={wish.id}
                            className="px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300"
                          >
                            {wish.title}
                          </span>
                        ))}
                        {chain.wishes.length > 3 && (
                          <span className="px-3 py-1 bg-white/10 rounded-full text-sm text-gray-400">
                            +{chain.wishes.length - 3} {t('shareHistory.more')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* 只有未开启的盲盒才能复制链接 */}
                    {!chain.is_opened ? (
                      <button
                        onClick={() => copyShareLink(chain.share_code)}
                        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all ${
                          copiedId === chain.share_code
                            ? 'bg-green-500 text-white'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                        }`}
                      >
                        {copiedId === chain.share_code ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>{t('shareHistory.copied')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>{t('shareHistory.copyLink')}</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600/50 text-gray-400 rounded-xl cursor-not-allowed">
                        <XCircle className="w-4 h-4" />
                        <span>盲盒已开启，链接已失效</span>
                      </div>
                    )}
                    
                    {/* 预览按钮 - 已开启的显示为灰色 */}
                    <button
                      onClick={() => window.open(`${window.location.origin}?box=${chain.share_code}`, '_blank')}
                      className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all ${
                        chain.is_opened 
                          ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                      disabled={chain.is_opened}
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>{chain.is_opened ? '已失效' : t('shareHistory.preview')}</span>
                    </button>
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

export default ShareHistory;