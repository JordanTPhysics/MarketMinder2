"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PaymentResult {
  success: boolean;
  plan?: string;
  message?: string;
  error?: string;
}

const PaymentSuccessPage = () => {
  const searchParams = useSearchParams();
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Get payment parameters from URL
        const sessionId = searchParams.get('session_id');
        const success = searchParams.get('success');
        const plan = searchParams.get('plan');

        if (success === 'true' && sessionId) {
          // Call server action to verify and update subscription
          const response = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              plan: plan || 'Professional'
            }),
          });

          const result = await response.json();

          if (result.success) {
            setPaymentResult({
              success: true,
              plan: result.plan,
              message: `Welcome to ${result.plan}! Your account has been successfully upgraded.`
            });
          } else {
            setPaymentResult({
              success: false,
              error: result.error || 'Payment verification failed'
            });
          }
        } else if (success === 'false') {
          setPaymentResult({
            success: false,
            error: 'Payment was cancelled or failed'
          });
        } else {
          setPaymentResult({
            success: false,
            error: 'Invalid payment session'
          });
        }
      } catch (error) {
        console.error('Payment processing error:', error);
        setPaymentResult({
          success: false,
          error: 'An unexpected error occurred while processing your payment'
        });
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [searchParams]);

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
        {paymentResult?.success ? (
          <div className="text-center">
            {/* Success State */}
            <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-8 border border-border">
              <CheckCircle className="w-20 h-20 text-success mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-text mb-4 font-serif">
                Payment Successful!
              </h1>
              <p className="text-xl text-text/80 mb-6">
                {paymentResult.message}
              </p>
              
              {/* Plan Details */}
              <div className="bg-foreground/20 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-text mb-4">
                  Your New Plan: {paymentResult.plan}
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
        ) : (
          <div className="text-center">
            {/* Error State */}
            <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-8 border border-border">
              <XCircle className="w-20 h-20 text-danger mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-text mb-4 font-serif">
                Payment Failed
              </h1>
              <p className="text-xl text-text/80 mb-6">
                {paymentResult?.error || 'Something went wrong with your payment'}
              </p>
              
              <div className="space-y-4">
                <Button asChild size="lg" className="w-full">
                  <Link href="/protected/upgrade">
                    Try Again
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link href="/protected/dashboard">
                    Back to Dashboard
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
};

export default PaymentSuccessPage;
