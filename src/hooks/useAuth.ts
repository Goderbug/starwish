import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Get initial session with faster timeout
    const getInitialSession = async () => {
      try {
        // Set a shorter timeout for better UX
        timeoutId = setTimeout(() => {
          if (mounted && loading) {
            console.warn('Auth loading timeout - proceeding without authentication');
            setUser(null);
            setLoading(false);
          }
        }, 2000); // Reduced from 5s to 2s

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          clearTimeout(timeoutId);
          
          if (error) {
            console.error('Auth session error:', error);
            setUser(null);
          } else {
            setUser(session?.user ?? null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to get session:', error);
        if (mounted) {
          clearTimeout(timeoutId);
          setUser(null);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (mounted) {
          clearTimeout(timeoutId);
          setUser(session?.user ?? null);
          setLoading(false);

          // Create or update user profile on sign in
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              const { error } = await supabase
                .from('users')
                .upsert({
                  id: session.user.id,
                  email: session.user.email!,
                  name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
                  avatar_url: session.user.user_metadata?.avatar_url,
                  google_id: session.user.user_metadata?.provider_id,
                }, {
                  onConflict: 'id'
                });
              
              if (error) {
                console.error('Error creating user profile:', error);
              }
            } catch (error) {
              console.error('Failed to create user profile:', error);
            }
          }
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []); // Remove loading dependency to prevent infinite loop

  return { user, loading };
};