"use client";

import React from 'react';
import Link from 'next/link';
import { useSubscription } from '@/utils/use-subscription';
import { getDashboardRoute } from '@/utils/dashboard-routing';

interface DashboardLinkProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
  [key: string]: any; // Allow other props to be passed through
}

/**
 * Client component that renders a Link to the correct dashboard based on user's subscription
 */
export function DashboardLink({ children, className, asChild, ...props }: DashboardLinkProps) {
  const { subscription, loading } = useSubscription();
  const dashboardRoute = getDashboardRoute(subscription);

  if (loading) {
    // Show loading state or return children with default route
    return (
      <Link href="/protected/dashboard" className={className} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <Link href={dashboardRoute} className={className} {...props}>
      {children}
    </Link>
  );
}


