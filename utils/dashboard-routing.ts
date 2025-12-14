/**
 * Utility functions for routing to the correct dashboard based on subscription tier
 */

/**
 * Get the dashboard route based on subscription ID
 * @param subscriptionId - The user's subscription ID (1=Free, 2=Professional/Business, 3=Enterprise)
 * @returns The dashboard route path
 */
export function getDashboardRoute(subscriptionId: number | null | undefined): string {
  // Default to original dashboard if no subscription or free plan
  if (!subscriptionId || subscriptionId === 1) {
    return '/protected/dashboard';
  }

  // Map subscription IDs to dashboard routes
  switch (subscriptionId) {
    case 2: // Professional/Business plan
      return '/protected/dashboard/business';
    case 3: // Enterprise plan
      return '/protected/dashboard/professional'; // Using professional as enterprise dashboard
    default:
      return '/protected/dashboard';
  }
}

/**
 * Server-side function to get dashboard route
 * Requires Supabase server client
 */
export async function getDashboardRouteServer(supabase: any): Promise<string> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return '/protected/dashboard'; // Default route
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return '/protected/dashboard'; // Default route
    }

    return getDashboardRoute(profile.subscription_id);
  } catch (error) {
    console.error('Error getting dashboard route:', error);
    return '/protected/dashboard'; // Default route on error
  }
}


