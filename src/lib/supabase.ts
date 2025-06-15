import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: Log environment variables (remove in production)
console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[HIDDEN]' : 'undefined');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Test database connection
supabase.from('users').select('count', { count: 'exact', head: true })
  .then(({ error, count }) => {
    if (error) {
      console.error('Database connection test failed:', error);
    } else {
      console.log('Database connection successful. Users table accessible.');
    }
  });

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
  // Generate a unique fingerprint for anonymous users
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx!.textBaseline = 'top';
  ctx!.font = '14px Arial';
  ctx!.fillText('StarWish fingerprint', 2, 2);
  
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
};

// Auth helpers
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}` // 重定向到应用首页
      }
    });
    
    if (error) {
      console.error('Google sign in error:', error);
    }
    
    return { data, error };
  } catch (error) {
    console.error('Google sign in exception:', error);
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
    }
    return { error };
  } catch (error) {
    console.error('Sign out exception:', error);
    return { error };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Get current user error:', error);
    }
    return { user, error };
  } catch (error) {
    console.error('Get current user exception:', error);
    return { user: null, error };
  }
};

// Test auth functionality
export const testAuth = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('Current session:', session ? 'Active' : 'None');
    if (error) {
      console.error('Session error:', error);
    }
    return { session, error };
  } catch (error) {
    console.error('Test auth exception:', error);
    return { session: null, error };
  }
};