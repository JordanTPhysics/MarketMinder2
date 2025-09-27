"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Plan names based on subscription ID
const PLAN_NAMES: Record<number, string> = {
  1: "Free",
  2: "Professional", 
  3: "Enterprise"
};

export default function PaymentSuccessPage() {
  const [status, setStatus] = useState<string>("pending");
  const [subscriptionId, setSubscriptionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Get the logged-in user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setStatus("not-logged-in");
          setLoading(false);
          return;
        }

        // Get user profile subscription_id
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("subscription_id")
          .eq("user_id", user.id)
          .single();

        if (profileError) {
          console.error("Profile error:", profileError);
          setStatus("error");
          setLoading(false);
          return;
        }

        if (profileData) {
          setSubscriptionId(profileData.subscription_id);

          // Check if subscription is upgraded (not Free plan with ID 1)
          if (profileData.subscription_id > 1) {
            setStatus("active");
          } else {
            setStatus("pending");
            // Retry in 3s until webhook updates
            setTimeout(checkStatus, 3000);
          }
        } else {
          setStatus("pending");
          setTimeout(checkStatus, 3000);
        }
      } catch (error) {
        console.error("Error checking status:", error);
        setStatus("error");
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-800 to-violet-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-text animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text mb-2">Processing Payment...</h2>
          <p className="text-text/70">Please wait while we verify your payment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-violet-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {status === "active" && subscriptionId ? (
          <div className="text-center">
            {/* Success State */}
            <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-8 border border-border">
              <CheckCircle className="w-20 h-20 text-success mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-text mb-4 font-serif">
                Payment Successful!
              </h1>
              <p className="text-xl text-text/80 mb-6">
                Your subscription has been activated successfully.
              </p>
              
              {/* Plan Details */}
              <div className="bg-foreground/20 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-text mb-4">
                  Your New Plan: {PLAN_NAMES[subscriptionId]}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-text/80">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-success mr-2" />
                    <span>Increased request limits</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-success mr-2" />
                    <span>Priority support</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-success mr-2" />
                    <span>Advanced features</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-success mr-2" />
                    <span>Monthly billing</span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="space-y-4">
                <Button asChild size="lg" className="w-full">
                  <Link href="/protected/dashboard">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link href="/protected/upgrade">
                    View All Plans
                  </Link>
                </Button>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-8 bg-background/30 backdrop-blur-sm rounded-xl p-6 border border-border">
              <h3 className="text-lg font-semibold text-text mb-3">
                What's Next?
              </h3>
              <div className="text-sm text-text/70 space-y-2">
                <p>• Your new limits are now active</p>
                <p>• You'll receive a confirmation email shortly</p>
                <p>• Manage your subscription in your account settings</p>
                <p>• Contact support if you have any questions</p>
              </div>
            </div>
          </div>
        ) : status === "pending" ? (
          <div className="text-center">
            <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-8 border border-border">
              <Loader2 className="w-20 h-20 text-text animate-spin mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-text mb-4 font-serif">
                Processing Your Payment
              </h1>
              <p className="text-xl text-text/80 mb-6">
                Please wait while we activate your subscription...
              </p>
              <div className="text-sm text-text/60">
                This usually takes just a few moments.
              </div>
            </div>
          </div>
        ) : status === "not-logged-in" ? (
          <div className="text-center">
            <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-8 border border-border">
              <XCircle className="w-20 h-20 text-danger mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-text mb-4 font-serif">
                Please Sign In
              </h1>
              <p className="text-xl text-text/80 mb-6">
                You need to be signed in to view your subscription status.
              </p>
              <Button asChild size="lg" className="w-full">
                <Link href="/sign-in">
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            {/* Error State */}
            <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-8 border border-border">
              <XCircle className="w-20 h-20 text-danger mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-text mb-4 font-serif">
                Something Went Wrong
              </h1>
              <p className="text-xl text-text/80 mb-6">
                We're having trouble verifying your payment status.
              </p>
              
              <div className="space-y-4">
                <Button asChild size="lg" className="w-full">
                  <Link href="/protected/dashboard">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link href="/protected/upgrade">
                    Try Again
                  </Link>
                </Button>
              </div>
            </div>

            {/* Help Section */}
            <div className="mt-8 bg-background/30 backdrop-blur-sm rounded-xl p-6 border border-border">
              <h3 className="text-lg font-semibold text-text mb-3">
                Need Help?
              </h3>
              <div className="text-sm text-text/70 space-y-2">
                <p>• Check your payment method and try again</p>
                <p>• Contact our support team for assistance</p>
                <p>• Verify your billing information</p>
                <p>• Check your bank for any declined transactions</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
