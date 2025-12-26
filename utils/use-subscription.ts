"use client";

import { useState, useEffect } from 'react';
import { createClient } from './supabase/client';


export function useSubscription() {
  const [subscription, setSubscription] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const getSubscription = async () => {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        // Get user profile with subscription_id
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('subscription_id')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching subscription:', profileError);
          setError('Failed to fetch subscription');
          setSubscription(1); // Default to free plan
        } else {
          setSubscription(profile?.subscription_id || 1); // Default to free plan if no profile
        }
      } catch (err) {
        console.error('Subscription hook error:', err);
        setError('Failed to load subscription');
        setSubscription(1); // Default to free plan
      } finally {
        setLoading(false);
      }
    };

    getSubscription();

    // Listen for auth changes to refresh subscription
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          getSubscription();
        } else {
          setSubscription(null);
          setLoading(false);
        }
      }
    );

    return () => authSubscription.unsubscribe();
  }, []);

  return { 
    subscription, 
    loading, 
    error,
    isFree: subscription === 1,
    isBusiness: subscription === 7,
    isProfessional: subscription === 2,
    isEnterprise: subscription === 3,
    hasPaidPlan: subscription && subscription > 1
  };
}
