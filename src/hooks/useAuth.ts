import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    // ✅ 简化：减少调试日志，只保留关键信息
    const clearOldSessionData = async () => {
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
      } catch (error) {
        // 静默处理清理错误
      }
    };

    const initializeAuth = async () => {
      try {
        await clearOldSessionData();
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            if (error.message?.includes('refresh_token') || error.message?.includes('Invalid Refresh Token')) {
              await supabase.auth.signOut();
            }
            setUser(null);
          } else {
            setUser(session?.user || null);
          }
          setLoading(false);
        }
      } catch (error: any) {
        if (error.message?.includes('refresh_token') || error.message?.includes('Invalid Refresh Token')) {
          try {
            await clearOldSessionData();
            await supabase.auth.signOut();
          } catch (cleanupError) {
            // 静默处理清理错误
          }
        }
        
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    // ✅ 优化：减少重复的用户资料更新
    let lastUserUpdate = '';
    
    const setupAuthListener = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          // 只在开发环境显示详细日志
          if (import.meta.env.DEV) {
            console.log('🔄 认证状态变化:', event, session?.user?.email || '无用户');
          }
          
          if (mounted) {
            setUser(session?.user || null);
            setLoading(false);

            // ✅ 优化：只在必要时更新用户资料，避免重复操作
            if (event === 'SIGNED_IN' && session?.user) {
              const userKey = `${session.user.id}-${session.user.email}`;
              
              // 避免重复更新同一用户
              if (lastUserUpdate !== userKey) {
                lastUserUpdate = userKey;
                
                // 异步更新用户资料，不阻塞UI，不显示日志
                supabase
                  .from('users')
                  .upsert({
                    id: session.user.id,
                    email: session.user.email!,
                    name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
                    avatar_url: session.user.user_metadata?.avatar_url,
                    google_id: session.user.user_metadata?.provider_id,
                  }, {
                    onConflict: 'id'
                  })
                  .then(({ error }) => {
                    // 只在开发环境显示结果
                    if (import.meta.env.DEV && error) {
                      console.error('❌ 更新用户资料失败:', error);
                    }
                  });
              }
            }

            if (event === 'SIGNED_OUT') {
              lastUserUpdate = '';
              await clearOldSessionData();
            }
          }
        }
      );
      
      authSubscription = subscription;
      return subscription;
    };

    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        setUser(null);
        setLoading(false);
      }
    }, 2000);

    setupAuthListener();
    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  return { user, loading };
};