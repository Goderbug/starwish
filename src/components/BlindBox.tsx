import React, { useState, useEffect } from 'react';
import { Star, Sparkles, Gift, Heart, Clock, Wand2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { WishData } from '../types/wish';

interface BlindBoxProps {
  boxId: string | null;
  wishes: WishData[];
  onBack: () => void;
}

const BlindBox: React.FC<BlindBoxProps> = ({ boxId, wishes, onBack }) => {
  const { t } = useLanguage();
  const [boxWishes, setBoxWishes] = useState<WishData[]>([]);
  const [selectedWish, setSelectedWish] = useState<WishData | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    if (boxId) {
      const savedBoxData = localStorage.getItem(`blindbox_${boxId}`);
      if (savedBoxData) {
        const wishData = JSON.parse(savedBoxData);
        setBoxWishes(wishData);
      }
    }
  }, [boxId]);

  const categoryIcons = {
    gift: Gift,
    experience: Heart,
    moment: Clock,
  };

  const openBlindBox = async () => {
    if (boxWishes.length === 0) return;
    
    setIsOpening(true);
    
    // Dramatic opening animation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Randomly select a wish
    const randomIndex = Math.floor(Math.random() * boxWishes.length);
    const chosen = boxWishes[randomIndex];
    setSelectedWish(chosen);
    setHasOpened(true);
    setIsOpening(false);
  };

  if (!boxWishes.length && boxId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-r from-gray-400/20 to-gray-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Star className="w-14 h-14 sm:w-16 sm:h-16 text-gray-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-gray-300">{t('blindbox.expired')}</h2>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">{t('blindbox.expiredDesc')}</p>
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
              {selectedWish.estimatedPrice && (
                <p className="text-yellow-400 text-base sm:text-lg mb-4">💰 {selectedWish.estimatedPrice}</p>
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

          {/* Action button - only "Done" */}
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
            {t('blindbox.prepared')} {boxWishes.length} {t('blindbox.mysterousWishes')}
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
          className="group w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 sm:px-12 py-4 sm:py-5 rounded-full text-lg sm:text-xl font-bold transition-all duration-300 transform active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 mx-auto relative overflow-hidden touch-manipulation min-h-[64px]"
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