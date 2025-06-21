import React, { useState, useEffect } from 'react';
import { Share2, Copy, Eye, Calendar, Users, ExternalLink, Check, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, StarChain } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

type FilterType = 'all' | 'unopened' | 'opened';

const ShareHistory: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [starChains, setStarChains] = useState<StarChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStarChains();
      // ✅ 设置实时监听星链状态变化
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    } else {
      setLoading(false);
    }
  }, [user]);

  // ✅ 新增：实时监听星链状态变化
  const setupRealtimeSubscription = () => {
    if (!user) return () => {};

    console.log('🔄 设置实时监听星链状态变化...');

    const subscription = supabase
      .channel('star_chains_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'star_chains',
          filter: `creator_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🎉 检测到星链状态实时变化:', payload.new);
          
          // 更新本地状态中对应的星链
          setStarChains(prev => prev.map(chain => 
            chain.id === payload.new.id 
              ? { ...chain, ...payload.new }
              : chain
          ));

          // 如果是开启状态变化，显示通知
          if (payload.new.is_opened && !payload.old.is_opened) {
            console.log('🎊 星链已被开启:', payload.new.share_code);
            // 可以在这里添加通知逻辑
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 实时订阅状态:', status);
      });

    return () => {
      console.log('🔌 取消实时监听');
      subscription.unsubscribe();
    };
  };

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

  // ✅ 新增：手动刷新功能
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStarChains();
    setRefreshing(false);
  };

  // ✅ 新增：检查单个星链的最新状态
  const checkChainStatus = async (chainId: string) => {
    try {
      const { data, error } = await supabase
        .from('star_chains')
        .select('is_opened, opened_at, opener_fingerprint, total_opens')
        .eq('id', chainId)
        .single();

      if (error) throw error;

      // 更新本地状态
      setStarChains(prev => prev.map(chain => 
        chain.id === chainId 
          ? { ...chain, ...data }
          : chain
      ));

      return data;
    } catch (error) {
      console.error('检查星链状态失败:', error);
      return null;
    }
  };

  // 筛选星链
  const filteredStarChains = starChains.filter(chain => {
    switch (activeFilter) {
      case 'opened':
        return chain.is_opened;
      case 'unopened':
        return !chain.is_opened;
      case 'all':
      default:
        return true;
    }
  });

  // 获取各状态的数量
  const getFilterCounts = () => {
    const opened = starChains.filter(chain => chain.is_opened).length;
    const unopened = starChains.filter(chain => !chain.is_opened).length;
    return {
      all: starChains.length,
      opened,
      unopened
    };
  };

  const filterCounts = getFilterCounts();

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
        {/* Header with Filter Tabs */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('shareHistory.title')}</h1>
              <p className="text-gray-300">{t('shareHistory.subtitle')}</p>
              {/* ✅ 新增：实时状态提示 */}
              <div className="flex items-center space-x-2 mt-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400">实时监听状态变化</span>
              </div>
            </div>
            
            {/* ✅ 新增：刷新按钮 */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                  refreshing 
                    ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="刷新状态"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm">{refreshing ? '刷新中...' : '刷新'}</span>
              </button>

              {/* Filter Tabs */}
              {starChains.length > 0 && (
                <div className="flex bg-white/5 backdrop-blur-sm rounded-xl p-1 border border-white/10">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                      activeFilter === 'all'
                        ? 'bg-white/20 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>全部</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      activeFilter === 'all' ? 'bg-white/20' : 'bg-white/10'
                    }`}>
                      {filterCounts.all}
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setActiveFilter('unopened')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                      activeFilter === 'unopened'
                        ? 'bg-blue-500/20 text-blue-300 shadow-lg'
                        : 'text-gray-400 hover:text-blue-300 hover:bg-blue-500/10'
                    }`}
                  >
                    <XCircle className="w-3 h-3" />
                    <span>未开启</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      activeFilter === 'unopened' ? 'bg-blue-500/20' : 'bg-white/10'
                    }`}>
                      {filterCounts.unopened}
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setActiveFilter('opened')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                      activeFilter === 'opened'
                        ? 'bg-green-500/20 text-green-300 shadow-lg'
                        : 'text-gray-400 hover:text-green-300 hover:bg-green-500/10'
                    }`}
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>已开启</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      activeFilter === 'opened' ? 'bg-green-500/20' : 'bg-white/10'
                    }`}>
                      {filterCounts.opened}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
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
        ) : filteredStarChains.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-28 h-28 bg-gradient-to-r from-gray-400/20 to-gray-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              {activeFilter === 'opened' ? (
                <CheckCircle className="w-14 h-14 text-gray-400" />
              ) : (
                <XCircle className="w-14 h-14 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-300">
              {activeFilter === 'opened' ? '暂无已开启的星链' : '暂无未开启的星链'}
            </h3>
            <p className="text-gray-400 mb-6">
              {activeFilter === 'opened' 
                ? '还没有星链被开启过' 
                : '所有星链都已经被开启了'
              }
            </p>
            <button
              onClick={() => setActiveFilter('all')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl transition-all"
            >
              查看全部
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 显示当前筛选结果数量 */}
            {activeFilter !== 'all' && (
              <div className="text-center py-2">
                <p className="text-sm text-gray-400">
                  显示 {filteredStarChains.length} 个
                  {activeFilter === 'opened' ? '已开启' : '未开启'}的星链
                </p>
              </div>
            )}
            
            {filteredStarChains.map((chain) => {
              const openStatus = getOpenStatus(chain);
              const StatusIcon = openStatus.icon;
              
              return (
                <div
                  key={chain.id}
                  className={`bg-white/5 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-500 ${
                    chain.is_opened 
                      ? 'border-green-500/30 bg-green-500/5' 
                      : 'border-white/10 hover:bg-white/10'
                  }`}
                >
                  {/* Chain header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          chain.is_opened 
                            ? 'bg-gradient-to-r from-green-400 to-emerald-400' 
                            : 'bg-gradient-to-r from-purple-400 to-pink-400'
                        }`}>
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
                    
                    {/* ✅ 改进：状态指示器增加动画效果 */}
                    <div className="flex items-center space-x-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 transition-all duration-500 ${openStatus.bgColor} ${openStatus.color} border ${openStatus.borderColor} ${
                        chain.is_opened ? 'animate-pulse' : ''
                      }`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{openStatus.text}</span>
                        {chain.is_opened && (
                          <div className="w-1 h-1 bg-green-400 rounded-full animate-ping"></div>
                        )}
                      </div>
                      
                      {/* ✅ 新增：单个星链状态检查按钮 */}
                      <button
                        onClick={() => checkChainStatus(chain.id)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="检查最新状态"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Chain stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    {/* 开启状态 */}
                    <div className={`rounded-xl p-4 text-center transition-all duration-500 ${
                      chain.is_opened ? 'bg-green-500/10' : 'bg-white/5'
                    }`}>
                      <div className={`text-2xl font-bold mb-1 transition-all duration-500 ${openStatus.color}`}>
                        {chain.is_opened ? '✓' : '○'}
                      </div>
                      <div className="text-xs text-gray-400">开启状态</div>
                    </div>
                    
                    {/* 心愿数 */}
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white mb-1">{chain.wishes?.length || 0}</div>
                      <div className="text-xs text-gray-400">{t('shareHistory.wishes')}</div>
                    </div>
                    
                    {/* 创建时间 */}
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

                  {/* ✅ 改进：开启详情增加动画效果 */}
                  {chain.is_opened && chain.opened_at && (
                    <div className="mb-4 p-3 bg-green-500/10 rounded-xl border border-green-500/20 animate-fade-in">
                      <div className="flex items-center space-x-2 text-sm text-green-300">
                        <CheckCircle className="w-4 h-4 animate-pulse" />
                        <span>已于 {formatDate(chain.opened_at)} 开启</span>
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
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
                    
                    {/* 预览按钮 */}
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