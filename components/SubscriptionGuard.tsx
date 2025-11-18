"use client";

import React from 'react';
import { useSubscription } from '@/utils/use-subscription';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredPlan?: 'free' | 'professional' | 'enterprise' | 'paid';
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

export function SubscriptionGuard({ 
  children, 
  requiredPlan = 'free',
  fallback = null,
  loading = <div className="text-text">Loading...</div>
}: SubscriptionGuardProps) {
  const { subscription, loading: subscriptionLoading, isProfessional, isEnterprise, hasPaidPlan } = useSubscription();

  if (subscriptionLoading) {
    return <>{loading}</>;
  }

  if (!subscription) {
    return <>{fallback}</>;
  }

  // Check if user has required plan access
  const hasAccess = (() => {
    switch (requiredPlan) {
      case 'free':
        return true; // Everyone has access to free features
      case 'professional':
        return isProfessional || isEnterprise;
      case 'enterprise':
        return isEnterprise;
      case 'paid':
        return hasPaidPlan;
      default:
        return true;
    }
  })();

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Convenience components for common use cases
export function FreeOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <SubscriptionGuard requiredPlan="free" fallback={fallback}>
      {children}
    </SubscriptionGuard>
  );
}

export function PaidOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <SubscriptionGuard requiredPlan="paid" fallback={fallback}>
      {children}
    </SubscriptionGuard>
  );
}

export function ProfessionalOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <SubscriptionGuard requiredPlan="professional" fallback={fallback}>
      {children}
    </SubscriptionGuard>
  );
}

export function EnterpriseOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <SubscriptionGuard requiredPlan="enterprise" fallback={fallback}>
      {children}
    </SubscriptionGuard>
  );
}
