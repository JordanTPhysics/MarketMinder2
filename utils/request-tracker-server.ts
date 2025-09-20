import { createClient } from './supabase/server';

export interface RequestLimitResult {
  canMakeRequest: boolean;
  dailyLimit: number;
  currentRequests: number;
  remainingRequests: number;
}

export interface IncrementResult {
  success: boolean;
  newTotal: number;
  error?: string;
}

/**
 * Check if user has hit their daily request limit (Server-side)
 * Calls Supabase RPC function: check_daily_request_limit
 * Now returns a simple boolean
 */
export async function checkDailyRequestLimitServer(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    
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
 * Increment the user's total requests by 1 (Server-side)
 * Calls Supabase RPC function: increment_request_count
 */
export async function incrementRequestCountServer(userId: string): Promise<IncrementResult> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase.rpc('increment_user_requests', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error incrementing request count:', error);
      return {
        success: false,
        newTotal: 0,
        error: error.message
      };
    }

    return {
      success: true,
      newTotal: data.new_total
    };
  } catch (error) {
    console.error('Failed to increment request count:', error);
    return {
      success: false,
      newTotal: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Increment user requests with result count (Server-side)
 * Calls your custom Supabase RPC function: increment_user_requests
 */
export async function incrementUserRequestsWithCount(userId: string, resultCount: number): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase.rpc('increment_user_requests', {
      p_user_id: userId,
      p_result_count: resultCount
    });

    if (error) {
      console.error('Error incrementing user requests with count:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Failed to increment user requests with count:', error);
    return false;
  }
}
