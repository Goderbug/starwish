import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError(error.message);
        } else {
          console.log('Initial session:', session ? 'Found' : 'None');
        }
        
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error: any) {
        console.error('Exception in getInitialSession:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
          setError(error.message || 'Unknown error');
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
          setError(null); // Clear any previous errors
        }

        // Create or update user profile on sign in
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            console.log('Creating/updating user profile...');
            
            // First, let's test if we can access the users table
            const { data: testData, error: testError } = await supabase
              .from('users')
              .select('id')
              .eq('id', session.user.id)
              .maybeSingle();
            
            if (testError) {
              console.error('Error testing users table access:', testError);
              // Don't throw, just log
            } else {
              console.log('Users table access test:', testData ? 'User exists' : 'User not found');
            }

            // Try to upsert user profile
            const userData = {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.full_name || 
                    session.user.user_metadata?.name || 
                    session.user.email?.split('@')[0],
              avatar_url: session.user.user_metadata?.avatar_url,
              google_id: session.user.user_metadata?.provider_id,
            };

            console.log('Upserting user data:', userData);

            const { data, error } = await supabase
              .from('users')
              .upsert(userData, {
                onConflict: 'id'
              })
              .select()
              .single();
            
            if (error) {
              console.error('Error upserting user profile:', error);
              console.error('Error details:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
              });
            } else {
              console.log('User profile created/updated successfully:', data);
            }
          } catch (error: any) {
            console.error('Exception in user profile creation:', error);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, error };
};