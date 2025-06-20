import React, { createContext, useContext, useState, useEffect } from 'react';

type SupportedLanguage = 'zh' | 'en';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

const translations = {
  zh: {
    // Landing Page
    'landing.title': '星愿盲盒',
    'landing.subtitle': '在浩瀚星空中播种心愿，让惊喜如流星般降临',
    'landing.wishesPlanted': '颗星愿已播种',
    'landing.starryNight': '夜空中闪烁着你的星愿',
    'landing.plantWish': '播种星愿',
    'landing.plantFirst': '播种第一颗星愿',
    'landing.manageWishes': '管理星愿',
    'landing.shareHistory': '分享记录',
    'landing.receivedWishes': '收到的星愿',
    'landing.signIn': '登录',
    'landing.signOut': '退出登录',
    'landing.feature1.title': '播种星愿',
    'landing.feature1.desc': '创建属于你的星愿清单，记录那些或大或小的愿望。可以是一次特别的旅行，一本心仪的书籍，或是一顿简单的晚餐。每一个愿望都是一颗独特的星星。',
    'landing.feature2.title': '编织星链',
    'landing.feature2.desc': '当你准备好分享这些愿望时，点击生成星链。这是一条专属的加密链接，只有收到链接的人才能打开你的星愿盲盒。',
    'landing.feature3.title': '随机惊喜',
    'landing.feature3.desc': '收到星链的特别之人点击链接，可以打开你的星愿盲盒。系统会随机抽取一个愿望显示给他/她，而其他愿望则保持神秘，你也不会知道他/她抽到了哪个愿望。',

    // Auth
    'auth.signIn': '登录',
    'auth.signUp': '注册',
    'auth.signInWithGoogle': '使用 Google 登录',
    'auth.signUpWithGoogle': '使用 Google 注册',
    'auth.or': '或',
    'auth.email': '邮箱',
    'auth.emailPlaceholder': '输入你的邮箱',
    'auth.password': '密码',
    'auth.passwordPlaceholder': '输入密码（至少6位）',
    'auth.name': '姓名',
    'auth.namePlaceholder': '输入你的姓名',
    'auth.loading': '处理中...',
    'auth.noAccount': '还没有账户？',
    'auth.hasAccount': '已有账户？',
    'auth.welcome': '欢迎回来',
    'auth.signInRequired': '请先登录以使用完整功能',
    'auth.signInDescription': '登录后即可开始播种你的星愿，编织神秘的星链分享给特别的人',

    // Create Wish
    'create.title': '播种新的星愿',
    'create.titleLabel': '心愿标题',
    'create.titlePlaceholder': '说出你的心愿...',
    'create.descLabel': '详细描述',
    'create.descPlaceholder': '为你的星愿添加更多细节...',
    'create.categoryLabel': '心愿类型',
    'create.priorityLabel': '心愿强度',
    'create.submitButton': '播种这颗星愿',
    'create.planting': '星愿播种中...',
    'create.plantingDesc': '正在将你的心愿播种到星空中...',

    // Categories
    'category.gift': '礼物',
    'category.experience': '体验',
    'category.moment': '时光',

    // Priorities
    'priority.low': '心动',
    'priority.medium': '渴望',
    'priority.high': '超想要',

    // Wish Manager
    'manager.title': '我的星愿花园',
    'manager.subtitle': '个心愿',
    'manager.newWish': '新星愿',
    'manager.selectAll': '全选',
    'manager.selected': '已选择',
    'manager.cancel': '取消',
    'manager.weaveChain': '编织星链',
    'manager.hint': '点击星愿卡片来选择，然后编织成神秘的星链分享给特别的人',
    'manager.noWishes': '还没有星愿哦',
    'manager.plantFirst': '播种第一颗星愿',
    'manager.weaving': '正在编织星链',
    'manager.weavingDesc': '将星愿连成神秘的星之链',
    'manager.chainComplete': '星链编织完成',
    'manager.shareDesc': '把这条神秘的星链分享给你的那个特别的人吧！',
    'manager.chainLabel': '神秘星链',
    'manager.contains': '包含',
    'manager.randomNote': '对方打开后只会随机看到其中一个星愿，其他的将保持神秘',
    'manager.copyLink': '复制链接',
    'manager.copied': '已复制!',
    'manager.done': '完成',

    // Blind Box
    'blindbox.title': '星愿盲盒',
    'blindbox.prepared': '有人为你准备了',
    'blindbox.mysterousWishes': '个神秘星愿',
    'blindbox.openButton': '开启盲盒',
    'blindbox.opening': '流星划过夜空',
    'blindbox.openingDesc': '流星正在穿越夜空...',
    'blindbox.giftTitle': '流星馈赠',
    'blindbox.giftDesc': '流星礼物已经到达',
    'blindbox.mysteryMessage': '在所有星愿中，这一颗被幸运选中了！其他的星愿依然静静地在夜空中闪烁着...',
    'blindbox.doneButton': '完成',
    'blindbox.expired': '星链已失效',
    'blindbox.expiredDesc': '这个星链已过期或无效',
    'blindbox.goBack': '返回',
    'blindbox.selectHint': '只有一个星愿会被随机选中哦！',

    // Share History
    'shareHistory.title': '分享记录',
    'shareHistory.subtitle': '查看你创建的所有星链分享',
    'shareHistory.loading': '加载中...',
    'shareHistory.noShares': '还没有分享记录',
    'shareHistory.noSharesDesc': '创建星链并分享给特别的人吧！',
    'shareHistory.untitledChain': '未命名星链',
    'shareHistory.code': '代码',
    'shareHistory.active': '活跃',
    'shareHistory.inactive': '已停用',
    'shareHistory.opens': '打开次数',
    'shareHistory.wishes': '心愿数',
    'shareHistory.created': '创建时间',
    'shareHistory.expires': '过期时间',
    'shareHistory.permanent': '永久',
    'shareHistory.noExpiry': '不过期',
    'shareHistory.containedWishes': '包含的心愿',
    'shareHistory.more': '更多',
    'shareHistory.copyLink': '复制链接',
    'shareHistory.copied': '已复制！',
    'shareHistory.preview': '预览',

    // Received Wishes
    'receivedWishes.title': '收到的星愿',
    'receivedWishes.subtitle': '你打开过的所有神秘星愿',
    'receivedWishes.loading': '加载中...',
    'receivedWishes.noWishes': '还没有收到星愿',
    'receivedWishes.noWishesDesc': '当你打开别人分享的星链时，收到的星愿会出现在这里',
    'receivedWishes.from': '来自',
    'receivedWishes.anonymous': '神秘人',
    'receivedWishes.yourNotes': '你的笔记',
    'receivedWishes.notesPlaceholder': '记录你对这个星愿的想法...',
    'receivedWishes.received': '已收到',

    // Common
    'common.back': '返回',
    'common.new': '新增',
  },
  en: {
    // Landing Page
    'landing.title': 'Star Wish Blind Box',
    'landing.subtitle': 'Plant your wishes among the stars, let surprises fall like meteors',
    'landing.wishesPlanted': 'wishes planted',
    'landing.starryNight': 'Your wishes twinkle in the starry night',
    'landing.plantWish': 'Plant Wish',
    'landing.plantFirst': 'Plant Your First Wish',
    'landing.manageWishes': 'Manage Wishes',
    'landing.shareHistory': 'Share History',
    'landing.receivedWishes': 'Received Wishes',
    'landing.signIn': 'Sign In',
    'landing.signOut': 'Sign Out',
    'landing.feature1.title': 'Plant Star Wishes',
    'landing.feature1.desc': 'Create your own wish list and record those big and small desires. It could be a special trip, a favorite book, or a simple dinner. Each wish is a unique star.',
    'landing.feature2.title': 'Weave Star Chain',
    'landing.feature2.desc': 'When you\'re ready to share these wishes, click to generate a star chain. This is an exclusive encrypted link that only the recipient can use to open your star wish blind box.',
    'landing.feature3.title': 'Random Surprise',
    'landing.feature3.desc': 'The special person who receives the star chain can click the link to open your star wish blind box. The system will randomly select one wish to show them, while other wishes remain mysterious, and you won\'t know which one they got.',

    // Auth
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.signInWithGoogle': 'Sign in with Google',
    'auth.signUpWithGoogle': 'Sign up with Google',
    'auth.or': 'or',
    'auth.email': 'Email',
    'auth.emailPlaceholder': 'Enter your email',
    'auth.password': 'Password',
    'auth.passwordPlaceholder': 'Enter password (at least 6 characters)',
    'auth.name': 'Name',
    'auth.namePlaceholder': 'Enter your name',
    'auth.loading': 'Loading...',
    'auth.noAccount': 'Don\'t have an account?',
    'auth.hasAccount': 'Already have an account?',
    'auth.welcome': 'Welcome back',
    'auth.signInRequired': 'Please sign in to use full features',
    'auth.signInDescription': 'After signing in, you can start planting your star wishes and weave mysterious star chains to share with special people',

    // Create Wish
    'create.title': 'Plant a New Star Wish',
    'create.titleLabel': 'Wish Title',
    'create.titlePlaceholder': 'Tell your wish...',
    'create.descLabel': 'Description',
    'create.descPlaceholder': 'Add more details to your wish...',
    'create.categoryLabel': 'Category',
    'create.priorityLabel': 'Priority',
    'create.submitButton': 'Plant This Wish',
    'create.planting': 'Planting wish...',
    'create.plantingDesc': 'Planting your wish among the stars...',

    // Categories
    'category.gift': 'Gift',
    'category.experience': 'Experience',
    'category.moment': 'Moment',

    // Priorities
    'priority.low': 'Interested',
    'priority.medium': 'Desired',
    'priority.high': 'Craving',

    // Wish Manager
    'manager.title': 'My Star Wish Garden',
    'manager.subtitle': 'wishes',
    'manager.newWish': 'New',
    'manager.selectAll': 'Select All',
    'manager.selected': 'selected',
    'manager.cancel': 'Cancel',
    'manager.weaveChain': 'Weave Chain',
    'manager.hint': 'Click wish cards to select, then weave them into a mysterious star chain to share with someone special',
    'manager.noWishes': 'No wishes yet',
    'manager.plantFirst': 'Plant Your First Wish',
    'manager.weaving': 'Weaving star chain',
    'manager.weavingDesc': 'Connecting wishes into a mysterious star chain',
    'manager.chainComplete': 'Star Chain Complete',
    'manager.shareDesc': 'Share this mysterious star chain with your special someone!',
    'manager.chainLabel': 'Mysterious Star Chain',
    'manager.contains': 'Contains',
    'manager.randomNote': 'They will only see one randomly selected wish, others will remain mysterious',
    'manager.copyLink': 'Copy Link',
    'manager.copied': 'Copied!',
    'manager.done': 'Done',

    // Blind Box
    'blindbox.title': 'Star Wish Blind Box',
    'blindbox.prepared': 'Someone prepared',
    'blindbox.mysterousWishes': 'mysterious wishes for you',
    'blindbox.openButton': 'Open Box',
    'blindbox.opening': 'Meteors crossing the night sky',
    'blindbox.openingDesc': 'Meteors crossing the night sky...',
    'blindbox.giftTitle': 'Meteor Gift',
    'blindbox.giftDesc': 'A meteor gift has arrived',
    'blindbox.mysteryMessage': 'Among all wishes, this one was chosen by luck! Other wishes still twinkle quietly in the night sky...',
    'blindbox.doneButton': 'Done',
    'blindbox.expired': 'Star link has expired',
    'blindbox.expiredDesc': 'This star link has expired or is invalid',
    'blindbox.goBack': 'Go Back',
    'blindbox.selectHint': 'Only one wish will be randomly selected!',

    // Share History
    'shareHistory.title': 'Share History',
    'shareHistory.subtitle': 'View all your created star chain shares',
    'shareHistory.loading': 'Loading...',
    'shareHistory.noShares': 'No shares yet',
    'shareHistory.noSharesDesc': 'Create star chains and share them with special people!',
    'shareHistory.untitledChain': 'Untitled Chain',
    'shareHistory.code': 'Code',
    'shareHistory.active': 'Active',
    'shareHistory.inactive': 'Inactive',
    'shareHistory.opens': 'Opens',
    'shareHistory.wishes': 'Wishes',
    'shareHistory.created': 'Created',
    'shareHistory.expires': 'Expires',
    'shareHistory.permanent': 'Permanent',
    'shareHistory.noExpiry': 'No expiry',
    'shareHistory.containedWishes': 'Contained wishes',
    'shareHistory.more': 'more',
    'shareHistory.copyLink': 'Copy Link',
    'shareHistory.copied': 'Copied!',
    'shareHistory.preview': 'Preview',

    // Received Wishes
    'receivedWishes.title': 'Received Wishes',
    'receivedWishes.subtitle': 'All the mysterious wishes you\'ve opened',
    'receivedWishes.loading': 'Loading...',
    'receivedWishes.noWishes': 'No received wishes yet',
    'receivedWishes.noWishesDesc': 'When you open star chains shared by others, received wishes will appear here',
    'receivedWishes.from': 'From',
    'receivedWishes.anonymous': 'Anonymous',
    'receivedWishes.yourNotes': 'Your notes',
    'receivedWishes.notesPlaceholder': 'Record your thoughts about this wish...',
    'receivedWishes.received': 'Received',

    // Common
    'common.back': 'Back',
    'common.new': 'New',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<SupportedLanguage>('zh');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('starwish-language') as SupportedLanguage;
    if (savedLanguage && (savedLanguage === 'zh' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    } else {
      // Auto-detect browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('en')) {
        setLanguage('en');
      }
    }
  }, []);

  const handleSetLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang);
    localStorage.setItem('starwish-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};