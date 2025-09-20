"use client";

import { useState, useEffect } from 'react';
import { getUserRequestStatsClient } from './request-tracker-client';

export interface RequestStatus {
  dailyRequests: number;
  totalRequests: number;
  dailyLimit: number;
  remainingRequests: number;
  lastRequestDate: string;
}

export interface RequestError {
  type: 'limit_exceeded' | 'network_error' | 'auth_error' | 'unknown';
  message: string;
  remainingTime?: string; // Time until reset
}

/**
 * Hook to manage request status and display
 * Shows status after successful requests, handles errors gracefully
 */
export function useRequestStatus(userId?: string) {
  const [status, setStatus] = useState<RequestStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<RequestError | null>(null);

  // Load status after successful requests
  const refreshStatus = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const userStats = await getUserRequestStatsClient(userId);
      
      setStatus({
        dailyRequests: userStats.daily_requests,
        totalRequests: userStats.total_requests,
        dailyLimit: userStats.daily_limit,
        remainingRequests: Math.max(0, userStats.daily_limit - userStats.daily_requests),
        lastRequestDate: userStats.last_request_date
      });
    } catch (err) {
      console.error('Error refreshing request status:', err);
      // Don't set error for status refresh - it's not critical
    } finally {
      setLoading(false);
    }
  };

  // Handle API errors and convert to user-friendly messages
  const handleApiError = (response: Response, responseData?: any): RequestError => {
    if (response.status === 429) {
      // Calculate time until reset (next day)
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const timeUntilReset = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(timeUntilReset / (1000 * 60 * 60));
      const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
      
      return {
        type: 'limit_exceeded',
        message: 'Daily request limit exceeded',
        remainingTime: `${hours}h ${minutes}m until reset`
      };
    }
    
    if (response.status === 401) {
      return {
        type: 'auth_error',
        message: 'Please sign in to continue'
      };
    }
    
    if (response.status >= 500) {
      return {
        type: 'network_error',
        message: 'Service temporarily unavailable. Please try again later.'
      };
    }
    
    return {
      type: 'unknown',
      message: responseData?.error || 'An unexpected error occurred'
    };
  };

  return {
    status,
    loading,
    error,
    refreshStatus,
    handleApiError,
    setError
  };
}
