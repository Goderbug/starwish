import React, { useState } from 'react';
import { Star, Trash2, Share2, Copy, Gift, Heart, Clock, Plus, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { WishData } from '../types/wish';

interface WishManagerProps {
  wishes: WishData[];
  onDeleteWish: (id: string) => void;
  onUpdateWish: (id: string, updates: Partial<WishData>) => void;
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
  const [selectedWishes, setSelectedWishes] = useState<string[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

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

  const priorityColors = {
    low: 'bg-gray-500',
    medium: 'bg-yellow-500',
    high: 'bg-red-500',
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

  const generateShareLink = async () => {
    if (selectedWishes.length === 0) return;
    
    setIsGeneratingLink(true);
    
    // Simulate star chain weaving animation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const boxId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const wishData = selectedWishes.map(id => wishes.find(w => w.id === id)).filter(Boolean);
    
    // Store wish data for the blind box
    localStorage.setItem(`blindbox_${boxId}`, JSON.stringify(wishData));
    
    const link = `${window.location.origin}${window.location.pathname}?box=${boxId}`;
    setGeneratedLink(link);
    setIsGeneratingLink(false);
    setShowShareModal(true);
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
        {/* Action button in top right */}
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
                  className="px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all flex items-center space-x-1 shadow-lg touch-manipulation"
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
              
              return (
                <div
                  key={wish.id}
                  className={`relative p-5 sm:p-6 bg-white/5 backdrop-blur-sm rounded-2xl border-2 transition-all cursor-pointer active:scale-95 touch-manipulation ${
                    isSelected 
                      ? 'border-purple-400 bg-purple-400/10 shadow-lg shadow-purple-400/20' 
                      : 'border-white/10 hover:border-white/20 hover:bg-white/10'
                  }`}
                  onClick={() => toggleWishSelection(wish.id)}
                >
                  {/* Selection indicator */}
                  <div className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected 
                      ? 'bg-purple-500 border-purple-500 scale-110' 
                      : 'border-white/30 hover:border-white/50'
                  }`}>
                    {isSelected && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Category icon and priority */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${categoryColors[wish.category]} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${priorityColors[wish.priority]}`}></div>
                      <span className="text-xs text-gray-400">{t(`priority.${wish.priority}`)}</span>
                    </div>
                  </div>

                  {/* Title and description */}
                  <h3 className="font-semibold text-base sm:text-lg mb-2 text-white pr-8">{wish.title}</h3>
                  {wish.description && (
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">{wish.description}</p>
                  )}

                  {/* Tags */}
                  {wish.tags && wish.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {wish.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300"
                        >
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
                  {wish.estimatedPrice && (
                    <p className="text-sm text-yellow-400 mb-4">💰 {wish.estimatedPrice}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {new Date(wish.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteWish(wish.id);
                      }}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors touch-manipulation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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