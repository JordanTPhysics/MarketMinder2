"use client";

import React from 'react';
import Link from 'next/link';
import { RequestStatus, RequestError } from '../utils/request-status';
import { Button } from './ui/button';

interface RequestStatusDisplayProps {
  status: RequestStatus | null;
  error: RequestError | null;
  loading: boolean;
  onRefreshStatus: () => void;
  onClearError: () => void;
}

export function RequestStatusDisplay({ 
  status, 
  error, 
  loading, 
  onRefreshStatus, 
  onClearError 
}: RequestStatusDisplayProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="text-sm text-text">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4 w-full">
        {error.type === 'limit_exceeded' ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-slate-800 font-semibold text-sm mb-1">
                  Daily Request Limit Exceeded
                </h3>
                <p className="text-slate-600 text-sm mb-2">
                  {error.message}
                </p>
                {error.remainingTime && (
                  <p className="text-slate-500 text-xs">
                    Resets in: {error.remainingTime}
                  </p>
                )}
                {status && (
                  <div className="mt-3 text-xs text-slate-700">
                    <div className="flex flex-wrap gap-3">
                      <span>
                        Today: <span className="font-semibold">{status.dailyRequests}/{status.dailyLimit}</span>
                      </span>
                      <span>
                        Remaining: <span className="font-semibold">{status.remainingRequests}</span>
                      </span>
                      <span>
                        Total: <span className="font-semibold">{status.totalRequests}</span>
                      </span>
                    </div>
                  </div>
                )}
                <div className="mt-3">
                  <Button size="sm" variant="outline" className="text-slate-700 border-slate-200 hover:text-slate-800">
                    <Link href="/protected/upgrade">Upgrade Now</Link>
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearError}
                className="text-slate-600 hover:text-slate-800"
              >
                ×
              </Button>
            </div>
          </div>
        ) : error.type === 'auth_error' ? (
          <div className="bg-yellow-50 border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-foreground-secondary font-semibold text-sm mb-1">
                  Authentication Required
                </h3>
                <p className="textforeground text-sm">
                  {error.message}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearError}
                className="textforeground hover:text-foreground-secondary"
              >
                ×
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-orange-800 font-semibold text-sm mb-1">
                  Request Error
                </h3>
                <p className="text-orange-600 text-sm">
                  {error.message}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearError}
                className="text-orange-600 hover:text-orange-800"
              >
                ×
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status) {
    return (
      <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-600">
                Requests today: <span className="font-semibold">{status.dailyRequests}/{status.dailyLimit}</span>
              </span>
              <span className="text-slate-600">
                Remaining: <span className="font-semibold">{status.remainingRequests}</span>
              </span>
              <span className="text-slate-600">
                Total: <span className="font-semibold">{status.totalRequests}</span>
              </span>
            </div>
            {status.remainingRequests <= 5 && status.remainingRequests > 0 && (
              <p className="text-orange-600 text-xs mt-1">
                ⚠️ Only {status.remainingRequests} requests remaining today
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefreshStatus}
            className="text-slate-600 hover:text-slate-800"
          >
            ↻
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
