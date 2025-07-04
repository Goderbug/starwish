import React, { createContext, useContext, useState, useEffect } from 'react';

type SupportedLanguage = 'zh' | 'en';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, any>) => string;
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
    'landing.feature1.desc': '创建你的愿望清单，无论大小。一场旅行、一本文集，或一顿晚餐，每个愿望都是一颗闪耀的星星。',
    'landing.feature2.title': '编织星链',
    'landing.feature2.desc': '准备好分享了吗？生成星链，一条专属加密链接，只有你选中的人才能打开。',
    'landing.feature3.title': '随机惊喜',
    'landing.feature3.desc': '对方点击后，系统会随机展示一个愿望。其余将继续保密，你也无法知道他们看到了哪一个。',

    // Wish Details Modal
    'wishModal.title': '星愿详情',
    'wishModal.description': '详细描述',
    'wishModal.tags': '标签',
    'wishModal.price': '预估价格',
    'wishModal.notes': '备注',
    'wishModal.createdAt': '创建于',
    'wishModal.close': '关闭',
    'wishModal.clickToView': '点击查看详情',

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

    // Create Wish
    'create.title': '播种新的星愿',
    'create.subtitle': '在星空中种下你的心愿种子',
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
    'manager.weaving': '正在编织星链',
    'manager.hint': '点击星愿卡片来选择，然后编织成神秘的星链分享给特别的人',
    'manager.noWishes': '还没有星愿哦',
    'manager.plantFirst': '播种第一颗星愿',
    'manager.plantFirstDesc': '开始播种你的第一颗星愿吧',
    'manager.weavingDesc': '将星愿连成神秘的星之链',
    'manager.chainComplete': '星链编织完成',
    'manager.shareDesc': '把这条神秘的星链分享给你的那个特别的人吧！',
    'manager.chainLabel': '神秘星链',
    'manager.contains': '包含',
    'manager.randomNote': '对方打开后只会随机看到其中一个星愿，其他的将保持神秘',
    'manager.copyLink': '复制链接',
    'manager.copied': '已复制!',
    'manager.done': '完成',
    'manager.searchPlaceholder': '搜索星愿...',
    'manager.filter': '筛选',
    'manager.wishType': '星愿类型',
    'manager.all': '全部',
    'manager.desireLevel': '渴望程度',
    'manager.sortBy': '排序方式',
    'manager.sortNewest': '最新创建',
    'manager.sortOldest': '最早创建',
    'manager.sortPriorityHigh': '渴望程度高→低',
    'manager.sortPriorityLow': '渴望程度低→高',
    'manager.sortTitleAZ': '标题 A→Z',
    'manager.sortTitleZA': '标题 Z→A',
    'manager.clearFilters': '清除筛选',
    'manager.noMatchingWishes': '没有符合条件的星愿',
    'manager.adjustFilters': '尝试调整筛选条件或清除筛选',
    'manager.showingResults': '显示 {{current}} / {{total}} 个星愿',
    'manager.deleteWish': '删除星愿',
    'manager.confirmDelete': '确认删除星愿',
    'manager.deleteWarning': '你确定要删除这个星愿吗？此操作无法撤销。',
    'manager.deleteNote': '删除后，这个星愿将从所有已分享的星链中移除',
    'manager.deleting': '删除中...',
    'manager.confirmDeleteButton': '确认删除',
    'manager.selectWishesFirst': '请选择星愿',
    'manager.starChain': '星链',
    'manager.mysterousWishes': '个神秘星愿的星链',
    'manager.createChainFailed': '创建星链失败，请重试',
    'manager.addWishesFailed': '添加星愿失败，请重试',

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
    'blindbox.loading': '加载中...',
    'blindbox.chainNotFound': '这个星愿盲盒不存在或已失效',
    'blindbox.fetchError': '获取星链失败，请重试',
    'blindbox.fetchWishesError': '获取星愿失败，请重试',
    'blindbox.noWishes': '星链中没有星愿',
    'blindbox.inactive': '星链未激活',
    'blindbox.alreadyOpened': '这个星愿盲盒已经被开启过了',
    'blindbox.permissionDenied': '权限不足，请重新登录后重试',
    'blindbox.accessDenied': '访问被拒绝，可能星链已失效',
    'blindbox.updateFailed': '更新星链状态失败：',
    'blindbox.openedByOthers': '这个盲盒已经被其他人开启了',
    'blindbox.openFailed': '开启失败，请重试',
    'blindbox.boxOpened': '盲盒已开启',
    'blindbox.chainExpired': '星链已失效',
    'blindbox.chainInvalid': '这个星链已过期或无效',
    'blindbox.savedToCollection': '星愿已保存到你的收藏',
    'blindbox.savedDesc': '这个美好的星愿已经永久保存在你的账户中，你可以在"收到的星愿"页面查看所有收藏！',
    'blindbox.loginRequired': '需要登录才能开启星愿盲盒',
    'blindbox.loginDesc': '为了确保这个珍贵的星愿能够安全地保存到你的收藏中，请先登录或注册账户。',
    'blindbox.loginNote': '登录后，这个盲盒将永远属于你，其他人无法再次开启',
    'blindbox.loginToOpen': '登录开启星愿盲盒',
    'blindbox.oneTimeUse': '每个星愿盲盒只能开启一次，开启后链接将失效',
    'blindbox.loggedInAs': '已登录',
    'blindbox.opened': '已开启',

    // Share History
    'shareHistory.title': '分享记录',
    'shareHistory.subtitle': '查看你创建的所有星链分享',
    'shareHistory.loading': '加载中...',
    'shareHistory.noShares': '还没有分享记录',
    'shareHistory.noSharesDesc': '创建星链并分享给特别的人吧！',
    'shareHistory.untitledChain': '未命名星链',
    'shareHistory.starChain': '星链',
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
    'shareHistory.realtimeMonitoring': '实时监听状态变化',
    'shareHistory.refresh': '刷新',
    'shareHistory.refreshing': '刷新中...',
    'shareHistory.refreshStatus': '刷新状态',
    'shareHistory.all': '全部',
    'shareHistory.opened': '已开启',
    'shareHistory.unopened': '未开启',
    'shareHistory.openStatus': '开启状态',
    'shareHistory.checkLatestStatus': '检查最新状态',
    'shareHistory.openedAt': '已于 {{date}} 开启',
    'shareHistory.blindBoxOpened': '盲盒已开启，链接已失效',
    'shareHistory.expired': '已失效',
    'shareHistory.today': '今天',
    'shareHistory.daysAgo': '{{days}}天前',
    'shareHistory.weeksAgo': '{{weeks}}周前',
    'shareHistory.noOpenedChains': '暂无已开启的星链',
    'shareHistory.noUnopenedChains': '暂无未开启的星链',
    'shareHistory.noOpenedChainsDesc': '还没有星链被开启过',
    'shareHistory.noUnopenedChainsDesc': '所有星链都已经被开启了',
    'shareHistory.viewAll': '查看全部',
    'shareHistory.showingFiltered': '显示 {{count}} 个{{type}}的星链',

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
    'common.close': '关闭',
    'common.edit': '编辑',
    'common.confirm': '确认',
    'common.cancel': '取消',
    'common.saving': '保存中...',
  },
  en: {
    // Landing Page
    'landing.title': 'Star Wish Blind Box',
    'landing.subtitle': 'Sow a star, grow a wish.',
    'landing.wishesPlanted': 'wishes planted',
    'landing.starryNight': 'Your wishes twinkle in the starry night',
    'landing.plantWish': 'Sow a Wish',
    'landing.plantFirst': 'Sow Your First Wish',
    'landing.manageWishes': 'Manage Wishes',
    'landing.shareHistory': 'Share History',
    'landing.receivedWishes': 'Received Wishes',
    'landing.signIn': 'Sign In',
    'landing.signOut': 'Sign Out',
    'landing.feature1.title': 'Sow Star Wishes',
    'landing.feature1.desc': 'Create your own wish list. A dream trip, a favorite book, or a simple dinner—each wish is a shining star.',
    'landing.feature2.title': 'Weave Star Chain',
    'landing.feature2.desc': 'Ready to share? Generate a star chain—an exclusive, encrypted link only your chosen one can open.',
    'landing.feature3.title': 'Random Surprise',
    'landing.feature3.desc': 'When they click the link, one random wish is revealed. The rest stay hidden. You won\'t know which one they saw.',

    // Wish Details Modal
    'wishModal.title': 'Wish Details',
    'wishModal.description': 'Description',
    'wishModal.tags': 'Tags',
    'wishModal.price': 'Estimated Price',
    'wishModal.notes': 'Notes',
    'wishModal.createdAt': 'Created on',
    'wishModal.close': 'Close',
    'wishModal.clickToView': 'Click to view details',

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

    // Create Wish
    'create.title': 'Sow a New Star Wish',
    'create.subtitle': 'Plant your wish seed among the stars',
    'create.titleLabel': 'Wish Title',
    'create.titlePlaceholder': 'Tell your wish...',
    'create.descLabel': 'Description',
    'create.descPlaceholder': 'Add more details to your wish...',
    'create.categoryLabel': 'Category',
    'create.priorityLabel': 'Priority',
    'create.submitButton': 'Sow This Wish',
    'create.planting': 'Sowing wish...',
    'create.plantingDesc': 'Sowing your wish among the stars...',

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
    'manager.weaving': 'Weaving star chain',
    'manager.hint': 'Click wish cards to select, then weave them into a mysterious star chain to share with someone special',
    'manager.noWishes': 'No wishes yet',
    'manager.plantFirst': 'Sow Your First Wish',
    'manager.plantFirstDesc': 'Start sowing your first star wish',
    'manager.weavingDesc': 'Connecting wishes into a mysterious star chain',
    'manager.chainComplete': 'Star Chain Complete',
    'manager.shareDesc': 'Share this mysterious star chain with your special someone!',
    'manager.chainLabel': 'Mysterious Star Chain',
    'manager.contains': 'Contains',
    'manager.randomNote': 'They will only see one randomly selected wish, others will remain mysterious',
    'manager.copyLink': 'Copy Link',
    'manager.copied': 'Copied!',
    'manager.done': 'Done',
    'manager.searchPlaceholder': 'Search wishes...',
    'manager.filter': 'Filter',
    'manager.wishType': 'Wish Type',
    'manager.all': 'All',
    'manager.desireLevel': 'Desire Level',
    'manager.sortBy': 'Sort By',
    'manager.sortNewest': 'Newest First',
    'manager.sortOldest': 'Oldest First',
    'manager.sortPriorityHigh': 'Priority High→Low',
    'manager.sortPriorityLow': 'Priority Low→High',
    'manager.sortTitleAZ': 'Title A→Z',
    'manager.sortTitleZA': 'Title Z→A',
    'manager.clearFilters': 'Clear Filters',
    'manager.noMatchingWishes': 'No matching wishes',
    'manager.adjustFilters': 'Try adjusting filters or clear filters',
    'manager.showingResults': 'Showing {{current}} / {{total}} wishes',
    'manager.deleteWish': 'Delete wish',
    'manager.confirmDelete': 'Confirm Delete Wish',
    'manager.deleteWarning': 'Are you sure you want to delete this wish? This action cannot be undone.',
    'manager.deleteNote': 'After deletion, this wish will be removed from all shared star chains',
    'manager.deleting': 'Deleting...',
    'manager.confirmDeleteButton': 'Confirm Delete',
    'manager.selectWishesFirst': 'Please select wishes',
    'manager.starChain': 'Starchain',
    'manager.mysterousWishes': 'mysterious wishes',
    'manager.createChainFailed': 'Failed to create star chain, please try again',
    'manager.addWishesFailed': 'Failed to add wishes, please try again',

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
    'blindbox.loading': 'Loading...',
    'blindbox.chainNotFound': 'This star wish blind box does not exist or has expired',
    'blindbox.fetchError': 'Failed to fetch star chain, please try again',
    'blindbox.fetchWishesError': 'Failed to fetch wishes, please try again',
    'blindbox.noWishes': 'No wishes in this star chain',
    'blindbox.inactive': 'Star chain is not active',
    'blindbox.alreadyOpened': 'This star wish blind box has already been opened',
    'blindbox.permissionDenied': 'Permission denied, please log in again and try',
    'blindbox.accessDenied': 'Access denied, star chain may have expired',
    'blindbox.updateFailed': 'Failed to update star chain status: ',
    'blindbox.openedByOthers': 'This blind box has already been opened by someone else',
    'blindbox.openFailed': 'Failed to open, please try again',
    'blindbox.boxOpened': 'Blind box opened',
    'blindbox.chainExpired': 'Star chain expired',
    'blindbox.chainInvalid': 'This star chain has expired or is invalid',
    'blindbox.savedToCollection': 'Wish saved to your collection',
    'blindbox.savedDesc': 'This beautiful wish has been permanently saved to your account. You can view all your collections in the "Received Wishes" page!',
    'blindbox.loginRequired': 'Login required to open star wish blind box',
    'blindbox.loginDesc': 'To ensure this precious wish can be safely saved to your collection, please log in or register an account first.',
    'blindbox.loginNote': 'After logging in, this blind box will belong to you forever, and others cannot open it again',
    'blindbox.loginToOpen': 'Login to open star wish blind box',
    'blindbox.oneTimeUse': 'Each star wish blind box can only be opened once, the link will expire after opening',
    'blindbox.loggedInAs': 'Logged in as',
    'blindbox.opened': 'Opened',

    // Share History
    'shareHistory.title': 'Share History',
    'shareHistory.subtitle': 'View all your created star chain shares',
    'shareHistory.loading': 'Loading...',
    'shareHistory.noShares': 'No shares yet',
    'shareHistory.noSharesDesc': 'Create star chains and share them with special people!',
    'shareHistory.untitledChain': 'Untitled Chain',
    'shareHistory.starChain': 'Starchain',
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
    'shareHistory.realtimeMonitoring': 'Real-time status monitoring',
    'shareHistory.refresh': 'Refresh',
    'shareHistory.refreshing': 'Refreshing...',
    'shareHistory.refreshStatus': 'Refresh status',
    'shareHistory.all': 'All',
    'shareHistory.opened': 'Opened',
    'shareHistory.unopened': 'Unopened',
    'shareHistory.openStatus': 'Open Status',
    'shareHistory.checkLatestStatus': 'Check latest status',
    'shareHistory.openedAt': 'Opened on {{date}}',
    'shareHistory.blindBoxOpened': 'Blind box opened, link expired',
    'shareHistory.expired': 'Expired',
    'shareHistory.today': 'Today',
    'shareHistory.daysAgo': '{{days}} days ago',
    'shareHistory.weeksAgo': '{{weeks}} weeks ago',
    'shareHistory.noOpenedChains': 'No opened chains yet',
    'shareHistory.noUnopenedChains': 'No unopened chains yet',
    'shareHistory.noOpenedChainsDesc': 'No star chains have been opened yet',
    'shareHistory.noUnopenedChainsDesc': 'All star chains have been opened',
    'shareHistory.viewAll': 'View All',
    'shareHistory.showingFiltered': 'Showing {{count}} {{type}} chains',

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
    'common.close': 'Close',
    'common.edit': 'Edit',
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',
    'common.saving': 'Saving...',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 默认语言改为英文
  const [language, setLanguage] = useState<SupportedLanguage>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('starwish-language') as SupportedLanguage;
    if (savedLanguage && (savedLanguage === 'zh' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    } else {
      // 默认使用英文，不再自动检测浏览器语言
      setLanguage('en');
    }
  }, []);

  const handleSetLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang);
    localStorage.setItem('starwish-language', lang);
  };

  const t = (key: string, params?: Record<string, any>): string => {
    let translation = translations[language][key as keyof typeof translations[typeof language]] || key;
    
    // Simple parameter replacement
    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
      });
    }
    
    return translation;
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