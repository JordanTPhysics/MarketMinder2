"use client";

import { useState, useEffect } from 'react';
import { createClient } from './supabase/client';
import { User } from '@supabase/supabase-js';

interface UserProfile extends User {
  subscription_id: number;
  username: string;
  subscription_start: Date;  
  subscription_end: Date;
  subscription_cancelled: boolean;
  subscription_cancelled_at: Date;
  cancellation_reason: string;
  cancellation_reason_code: string;
  last_stripe_payment_at: Date;
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          setError(error.message);
        } else {
          const authUser = session?.user as UserProfile;
          const userProfile = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', authUser.id)
            .single();
          if (userProfile.error) {
            setError(userProfile.error.message);
          } else {
            setUser({
              ...authUser,
              subscription_start: userProfile.data.subscription_start,
              subscription_end: userProfile.data.subscription_end,
              subscription_cancelled: userProfile.data.subscription_cancelled,
              subscription_cancelled_at: userProfile.data.subscription_cancelled_at,
              cancellation_reason: userProfile.data.cancellation_reason,
              cancellation_reason_code: userProfile.data.cancellation_reason_code,
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get session');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user as UserProfile ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading, error };
}
