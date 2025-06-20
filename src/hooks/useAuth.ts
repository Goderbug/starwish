import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    // ✅ 超级简化的初始化 - 由于禁用了持久化，每次都是全新开始
    const initializeAuth = async () => {
      try {
        console.log('🔍 检查当前会话状态...');
        
        // 由于禁用了持久化，这里通常不会有会话
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error('❌ 获取会话失败:', error);
            setUser(null);
          } else {
            setUser(session?.user || null);
            if (session?.user) {
              console.log('✅ 发现活跃会话:', session.user.email);
            } else {
              console.log('ℹ️ 无活跃会话（符合预期）');
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

    // ✅ 简化的认证状态监听器
    const setupAuthListener = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔄 认证状态变化:', event, session?.user?.email || '无用户');
          
          if (mounted) {
            setUser(session?.user || null);
            setLoading(false);

            // ✅ 简化用户资料更新逻辑
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('✅ 用户登录成功');
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

    // ✅ 减少超时时间，因为不需要等待持久化会话恢复
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.log('⚠️ 认证初始化超时，设置为未登录状态');
        setUser(null);
        setLoading(false);
      }
    }, 1000); // 减少到1秒

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