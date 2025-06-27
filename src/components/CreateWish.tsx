import React, { useState } from 'react';
import { Star, Heart, Clock, Gift, Sparkles, Wand2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { WishData } from '../types/wish';

interface CreateWishProps {
  onAddWish: (wish: Omit<WishData, 'id' | 'createdAt'>) => void;
  onBack: () => void;
}

const CreateWish: React.FC<CreateWishProps> = ({ onAddWish, onBack }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'gift' as WishData['category'],
    priority: 'medium' as WishData['priority'],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: 'gift', label: t('category.gift'), icon: Gift, color: 'from-pink-400 to-rose-400' },
    { value: 'experience', label: t('category.experience'), icon: Heart, color: 'from-purple-400 to-indigo-400' },
    { value: 'moment', label: t('category.moment'), icon: Clock, color: 'from-blue-400 to-cyan-400' },
  ];

  const priorities = [
    { value: 'low', label: t('priority.low'), color: 'bg-gray-500' },
    { value: 'medium', label: t('priority.medium'), color: 'bg-yellow-500' },
    { value: 'high', label: t('priority.high'), color: 'bg-red-500' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ 简化：只检查表单是否填写完整
    if (!formData.title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    // Simulate star planting animation delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 调用添加星愿函数，它会自动跳转到管理页面
    await onAddWish({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      tags: [],
      estimated_price: '',
      notes: '',
    });

    // 重置表单状态
    setFormData({
      title: '',
      description: '',
      category: 'gift',
      priority: 'medium',
    });
    
    setIsSubmitting(false);
    // 注意：不需要手动调用 onBack()，因为 onAddWish 会处理页面跳转
  };

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center animate-pulse">
              <Star className="w-14 h-14 sm:w-16 sm:h-16 text-white animate-spin" fill="currentColor" />
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-ping opacity-20"></div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">{t('create.planting')}</h2>
          <p className="text-gray-300 text-sm sm:text-base">{t('create.plantingDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 p-4 pb-8">
      <div className="max-w-2xl mx-auto">
        {/* Page Title - 移到这里并居中 */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 mb-4 sm:mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse"></div>
            <Wand2 className="w-8 h-8 sm:w-10 sm:h-10 text-white relative z-10" />
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent mb-2 sm:mb-4">
            {t('create.title')}
          </h1>
          <p className="text-gray-300 text-sm sm:text-base">
            ✨ 在星空中种下你的心愿种子 ✨
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Title */}
          <div className="group">
            <label className="block text-sm font-medium mb-3 text-gray-200">
              {t('create.titleLabel')} *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('create.titlePlaceholder')}
                className="w-full p-4 sm:p-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all text-base sm:text-lg touch-manipulation"
                required
                disabled={isSubmitting}
              />
              <Wand2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400 opacity-50" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-3 text-gray-200">
              {t('create.descLabel')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('create.descPlaceholder')}
              rows={4}
              className="w-full p-4 sm:p-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all resize-none text-base touch-manipulation"
              disabled={isSubmitting}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-4 text-gray-200">
              {t('create.categoryLabel')}
            </label>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: category.value })}
                    disabled={isSubmitting}
                    className={`p-4 sm:p-6 rounded-2xl border-2 transition-all transform active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${
                      formData.category === category.value
                        ? 'border-purple-400 bg-purple-400/20 shadow-lg shadow-purple-400/20 scale-105'
                        : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 active:bg-white/15'
                    }`}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r ${category.color} flex items-center justify-center mx-auto mb-2 sm:mb-3`}>
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="text-xs sm:text-sm font-medium leading-tight">{category.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium mb-4 text-gray-200">
              {t('create.priorityLabel')}
            </label>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              {priorities.map((priority) => (
                <button
                  key={priority.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: priority.value })}
                  disabled={isSubmitting}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all transform active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.priority === priority.value
                      ? 'border-purple-400 bg-purple-400/20 shadow-lg shadow-purple-400/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 active:bg-white/15'
                  }`}
                >
                  <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${priority.color} mx-auto mb-2`}></div>
                  <div className="text-sm font-medium">{priority.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!formData.title.trim() || isSubmitting}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-5 sm:p-6 rounded-2xl text-lg sm:text-xl font-semibold transition-all duration-300 transform active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 relative overflow-hidden touch-manipulation min-h-[64px]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 animate-shimmer"></div>
            <Star className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" fill="currentColor" />
            <span className="relative z-10">{t('create.submitButton')}</span>
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateWish;