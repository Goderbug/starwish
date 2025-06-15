import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (error) {
            console.error('Auth session error:', error);
          }
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to get session:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Set a shorter timeout to prevent long loading
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth loading timeout - proceeding without authentication');
        setUser(null);
        setLoading(false);
      }
    }, 3000); // 3秒超时

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        if (mounted) {
          // 立即更新用户状态
          const newUser = session?.user ?? null;
          setUser(newUser);
          setLoading(false);

          // 在后台处理用户资料更新，不阻塞UI
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ User signed in, updating profile...');
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
                  console.error('Error creating user profile:', error);
                } else {
                  console.log('✅ User profile updated successfully');
                }
              })
              .catch((error) => {
                console.error('Failed to create user profile:', error);
              });
          }

          if (event === 'SIGNED_OUT') {
            console.log('🚪 User signed out');
          }
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
};