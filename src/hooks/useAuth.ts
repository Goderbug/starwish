import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 获取初始会话...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error('❌ 获取会话失败:', error);
            setUser(null);
          } else if (session?.user) {
            console.log('✅ 发现现有会话:', session.user.email);
            setUser(session.user);
          } else {
            console.log('ℹ️ 未找到现有会话');
            setUser(null);
          }
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('❌ 获取会话异常:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    // Set up auth state listener BEFORE getting initial session
    const setupAuthListener = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔄 认证状态变化:', event, session?.user?.email || '无用户');
          
          if (mounted) {
            // 立即更新用户状态，确保UI同步
            const newUser = session?.user ?? null;
            setUser(newUser);
            setLoading(false);
            setInitialized(true);

            // 在后台处理用户资料更新，不阻塞UI
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('✅ 用户登录成功，更新用户资料...');
              // 异步处理，不等待结果
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
                  if (error) {
                    console.error('❌ 更新用户资料失败:', error);
                  } else {
                    console.log('✅ 用户资料更新成功');
                  }
                })
                .catch((error) => {
                  console.error('❌ 更新用户资料异常:', error);
                });
            }

            if (event === 'SIGNED_OUT') {
              console.log('🚪 用户已登出');
            }
          }
        }
      );
      
      authSubscription = subscription;
      return subscription;
    };

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted && !initialized) {
        console.warn('⚠️ 认证初始化超时 - 设置为未登录状态');
        setUser(null);
        setLoading(false);
        setInitialized(true);
      }
    }, 3000); // 减少到3秒超时

    // 先设置监听器，再获取初始会话
    setupAuthListener();
    getInitialSession();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  return { user, loading, initialized };
};