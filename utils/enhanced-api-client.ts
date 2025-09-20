import { createClient } from './supabase/client';
import { RequestError } from './request-status';

/**
 * Enhanced API client that handles authentication and error processing
 */
export class EnhancedApiClient {
  private supabase = createClient();

  /**
   * Make an authenticated API call with error handling
   */
  async makeRequest<T = any>(
    endpoint: string, 
    options: RequestInit = {},
    onError?: (error: RequestError) => void
  ): Promise<T> {
    try {
      // Get the current session
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (!session) {
        const error: RequestError = {
          type: 'auth_error',
          message: 'Please sign in to continue'
        };
        onError?.(error);
        throw new Error('No active session found');
      }

      const response = await fetch(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const responseData = await response.json().catch(() => ({}));
        
        // Handle specific error types
        if (response.status === 429) {
          const error: RequestError = {
            type: 'limit_exceeded',
            message: 'Daily request limit exceeded',
            remainingTime: this.calculateTimeUntilReset()
          };
          onError?.(error);
          throw new Error('Daily request limit exceeded');
        }
        
        if (response.status === 401) {
          const error: RequestError = {
            type: 'auth_error',
            message: 'Please sign in to continue'
          };
          onError?.(error);
          throw new Error('Authentication required');
        }
        
        if (response.status >= 500) {
          const error: RequestError = {
            type: 'network_error',
            message: 'Service temporarily unavailable. Please try again later.'
          };
          onError?.(error);
          throw new Error('Service temporarily unavailable');
        }
        
        const error: RequestError = {
          type: 'unknown',
          message: responseData?.error || `API call failed: ${response.status}`
        };
        onError?.(error);
        throw new Error(responseData?.error || `API call failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      // Re-throw the error if it's already been handled
      if (error instanceof Error && error.message.includes('Daily request limit exceeded')) {
        throw error;
      }
      
      // Handle network errors
      const networkError: RequestError = {
        type: 'network_error',
        message: 'Network error. Please check your connection and try again.'
      };
      onError?.(networkError);
      throw error;
    }
  }

  /**
   * Make a POST request to the nearby places API
   */
  async getNearbyPlaces(params: {
    type: string;
    lat: number;
    lng: number;
  }, onError?: (error: RequestError) => void) {
    return this.makeRequest('/api/getNearbyPlaces', {
      method: 'POST',
      body: JSON.stringify(params),
    }, onError);
  }

  /**
   * Make a POST request to the Google Maps places API
   */
  async getGmapsPlaces(params: {
    type: string;
    city: string;
    country: string;
    postCode?: string;
  }, onError?: (error: RequestError) => void) {
    return this.makeRequest('/api/getGmapsPlaces', {
      method: 'POST',
      body: JSON.stringify(params),
    }, onError);
  }

  /**
   * Calculate time until daily reset (next day at midnight)
   */
  private calculateTimeUntilReset(): string {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilReset = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(timeUntilReset / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }
}

// Export a singleton instance
export const apiClient = new EnhancedApiClient();
