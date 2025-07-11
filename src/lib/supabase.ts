import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      // ✅ 关键修改：完全禁用会话持久化
      persistSession: false,
      // ✅ 禁用自动刷新令牌
      autoRefreshToken: false,
      // ✅ 禁用URL中的会话检测
      detectSessionInUrl: false,
      // ✅ 禁用存储
      storage: undefined,
      // ✅ 禁用存储键
      storageKey: undefined,
      // 使用PKCE流程
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'starwish-app'
      }
    }
  }
);

// Database types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  google_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Wish {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: 'gift' | 'experience' | 'moment';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  estimated_price: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface StarChain {
  id: string;
  creator_id: string;
  name?: string;
  description?: string;
  share_code: string;
  expires_at?: string;
  is_active: boolean;
  is_opened: boolean;
  opened_at?: string;
  opener_fingerprint?: string;
  total_opens: number;
  created_at: string;
  updated_at: string;
  creator?: User;
  wishes?: Wish[];
}

export interface BlindBoxOpen {
  id: string;
  chain_id: string;
  wish_id: string;
  opener_fingerprint?: string;
  opened_at: string;
  user_agent?: string;
  ip_hash?: string;
}

export interface UserOpenedWish {
  id: string;
  user_fingerprint: string;
  wish_id: string;
  chain_id: string;
  creator_name?: string;
  opened_at: string;
  is_favorite: boolean;
  notes: string;
  wish?: Wish;
  star_chain?: StarChain;
}

// Utility functions
export const generateShareCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateUserFingerprint = (): string => {
  try {
    // Generate a unique fingerprint for anonymous users
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('StarWish fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  } catch (error) {
    console.error('Error generating fingerprint:', error);
    return 'fallback-' + Date.now().toString(36);
  }
};

// Auth helpers
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`
      }
    });
    return { data, error };
  } catch (error) {
    console.error('Google sign in error:', error);
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    console.log('🔄 Starting sign out...');
    
    // ✅ 先清理本地存储
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('sb-')) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
      
      console.log('🧹 清理了本地存储数据');
    } catch (cleanupError) {
      console.warn('⚠️ 清理本地存储时出现警告:', cleanupError);
    }
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Sign out error:', error);
    } else {
      console.log('✅ Sign out completed successfully');
    }
    
    return { error };
  } catch (error) {
    console.error('❌ Sign out failed:', error);
    return { error };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  } catch (error) {
    console.error('Get user error:', error);
    return { user: null, error };
  }
};