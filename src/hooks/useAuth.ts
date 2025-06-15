import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);

        // Create or update user profile on sign in
        if (event === 'SIGNED_IN' && session?.user) {
          const { error } = await supabase
            .from('users')
            .upsert({
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.full_name,
              avatar_url: session.user.user_metadata?.avatar_url,
              google_id: session.user.user_metadata?.provider_id,
            });
          
          if (error) {
            console.error('Error creating user profile:', error);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
};