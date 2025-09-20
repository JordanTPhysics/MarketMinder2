import { createClient } from './supabase/client';

/**
 * Check if user has hit their daily request limit (Client-side)
 * Calls Supabase RPC function: check_daily_request_limit
 * Now returns a simple boolean
 */
export async function checkDailyRequestLimitClient(userId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase.rpc('check_daily_request_limit', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error checking daily request limit:', error);
      throw error;
    }

    return data === true;
  } catch (error) {
    console.error('Failed to check daily request limit:', error);
    throw error;
  }
}

/**
 * Get user's current request statistics (Client-side)
 */
export async function getUserRequestStatsClient(userId: string) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('user_request_tracking')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user request stats:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get user request stats:', error);
    throw error;
  }
}
