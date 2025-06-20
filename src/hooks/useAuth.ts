import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    // 简化的初始化函数
    const initializeAuth = async () => {
      try {
        console.log('🔍 初始化认证状态...');
        
        // 获取当前会话
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error('❌ 获取会话失败:', error);
            // 如果是刷新令牌错误，静默处理
            if (error.message?.includes('refresh_token') || error.message?.includes('Invalid Refresh Token')) {
              console.log('🧹 检测到无效令牌，清除状态');
              try {
                await supabase.auth.signOut();
              } catch (signOutError) {
                console.error('登出失败:', signOutError);
              }
            }
            setUser(null);
          } else {
            setUser(session?.user || null);
            if (session?.user) {
              console.log('✅ 用户已登录:', session.user.email);
            } else {
              console.log('ℹ️ 用户未登录');
            }
          }
          setLoading(false);
        }
      } catch (error: any) {
        console.error('❌ 初始化认证异常:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    // 设置认证状态监听器
    const setupAuthListener = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔄 认证状态变化:', event, session?.user?.email || '无用户');
          
          if (mounted) {
            // 立即更新用户状态
            setUser(session?.user || null);
            setLoading(false);

            // 处理用户资料更新（后台异步）
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('✅ 用户登录，更新资料...');
              // 异步更新用户资料，不阻塞UI
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

    // 设置超时保护
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⚠️ 认证初始化超时，设置为未登录状态');
        setUser(null);
        setLoading(false);
      }
    }, 2000); // 减少到2秒

    // 先设置监听器，再初始化
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

  // 简化返回值，去除 initialized
  return { user, loading };
};