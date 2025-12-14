"use client";

import { useUser } from "@/utils/use-user";
import { useSubscription } from "@/utils/use-subscription";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle, XCircle, Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/utils/supabase/client";

interface FeedbackForm {
  unsatisfiedFeatures: string[];
  comments: string;
}

enum APP_FEATURES {
  BUSINESS_SEARCH = 1,
  BUSINESS_INTELLIGENCE = 2,
  AREA_DEMOGRAPHICS = 3,
  GOOGLE_SEARCH_RANKINGS = 4,
  CONTACT_SCRAPING = 5,
  MARKET_ANALYSIS = 6,
  COMPETITOR_ANALYSIS = 7,
  DATA_EXPORT = 8,
  DAILY_SEARCH_LIMITS = 9,
  USER_INTERFACE_DESIGN = 10,
  PERFORMANCE_SPEED = 11,
  CUSTOMER_SUPPORT = 12,
  PRICING_VALUE = 13,
  OTHER = 14
}

// Get only the enum keys (not the numeric values)
const APP_FEATURE_KEYS = Object.keys(APP_FEATURES).filter(
  key => isNaN(Number(key))
) as Array<keyof typeof APP_FEATURES>;

export default function CancelSubscriptionPage() {

  const { user, loading: userLoading } = useUser();
  const { subscription, loading: subscriptionLoading, hasPaidPlan, isFree } = useSubscription();
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelStatus, setCancelStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastPaymentDate, setLastPaymentDate] = useState<string | null>(null);
  const [loadingPaymentDate, setLoadingPaymentDate] = useState(true);
  const [feedbackForm, setFeedbackForm] = useState<FeedbackForm>({
    unsatisfiedFeatures: [],
    comments: ''
  });

  useEffect(() => {
    if (!userLoading && !user) {
      redirect("/sign-in");
    }
  }, [user, userLoading]);

  // Fetch last payment date from user_profiles
  useEffect(() => {
    const fetchLastPaymentDate = async () => {
      if (!user) return;
      
      try {
        const supabase = createClient();
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('last_stripe_payment_at')
          .eq('user_id', user.id)
          .single();

        if (!error && profile?.last_stripe_payment_at) {
          setLastPaymentDate(profile.last_stripe_payment_at);
        }
      } catch (error) {
        console.error('Error fetching last payment date:', error);
      } finally {
        setLoadingPaymentDate(false);
      }
    };

    if (user && !isFree) {
      fetchLastPaymentDate();
    } else {
      setLoadingPaymentDate(false);
    }
  }, [user, isFree]);

  // Calculate access end date (1 month after last payment)
  const getAccessEndDate = (): Date | null => {
    if (!lastPaymentDate) return null;
    const lastPayment = new Date(lastPaymentDate);
    const accessEnd = new Date(lastPayment);
    accessEnd.setDate(accessEnd.getDate() + 30);
    return accessEnd;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleFeatureToggle = (feature: string) => {
    setFeedbackForm(prev => {
      const isSelected = prev.unsatisfiedFeatures.includes(feature);
      return {
        ...prev,
        unsatisfiedFeatures: isSelected
          ? prev.unsatisfiedFeatures.filter(f => f !== feature)
          : [...prev.unsatisfiedFeatures, feature]
      };
    });
  };

  const handleCommentsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedbackForm(prev => ({
      ...prev,
      comments: e.target.value
    }));
  };

  const isFormValid = () => {
    return feedbackForm.unsatisfiedFeatures.length > 0 && feedbackForm.comments.trim().length > 0;
  };

  const handleCancelSubscription = async () => {
    if (!isFormValid()) {
      return;
    }

    const accessEndDate = getAccessEndDate();
    const confirmMessage = accessEndDate 
      ? `Are you sure you want to cancel your subscription? You will retain access to paid features until ${formatDate(accessEndDate)}.`
      : 'Are you sure you want to cancel your subscription? You will retain access to paid features for 1 month after your last payment.';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsCanceling(true);
    setCancelStatus('idle');
    setErrorMessage('');

    try {
      // Convert selected feature keys to their numeric values and join as space-separated string
      const reasonCodes = feedbackForm.unsatisfiedFeatures
        .map(key => APP_FEATURES[key as keyof typeof APP_FEATURES])
        .filter(code => code !== undefined)
        .join(' ');

      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: {
            ...feedbackForm,
            reasonCodes: reasonCodes
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      setCancelStatus('success');
      
      // Refresh subscription status after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      setCancelStatus('error');
      setErrorMessage(error.message || 'An unexpected error occurred');
    } finally {
      setIsCanceling(false);
    }
  };

  if (userLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4">
        <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-8 border border-border max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-text mx-auto mb-4"></div>
          <p className="text-text">Loading subscription information...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  // If user is on free plan, show message
  if (isFree) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4">
        <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-8 border border-border max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text mb-4">No Active Subscription</h1>
          <p className="text-text/80 mb-6">
            You don't have an active paid subscription to cancel.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild variant="outline">
              <Link href="/protected/account">Back to Account</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/protected/upgrade">View Plans</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4">
      <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-8 border border-border max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-text mb-2 text-center">Cancel Subscription</h1>
        <p className="text-text/80 mb-6 text-center">
          We're sorry to see you go. Please confirm if you'd like to cancel your subscription.
        </p>

        {/* Feedback Form Section */}
        <div className="mb-6 p-6 bg-foreground/30 rounded-lg border border-border">
          <h2 className="text-xl font-semibold text-text mb-4">Help Us Improve</h2>
          <p className="text-text/80 text-sm mb-4">
            Please let us know which features or aspects of the service you were unsatisfied with. This helps us improve.
          </p>

          {/* Feature Checkboxes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-text mb-3">
              What were you unsatisfied with? (Select all that apply)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {APP_FEATURE_KEYS.map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <Checkbox
                    id={feature}
                    checked={feedbackForm.unsatisfiedFeatures.includes(feature)}
                    onCheckedChange={() => handleFeatureToggle(feature)}
                  />
                  <label
                    htmlFor={feature}
                    className="text-sm text-text/80 cursor-pointer hover:text-text transition-colors"
                  >
                    {feature.split('_').map(word => 
                      word.charAt(0) + word.slice(1).toLowerCase()
                    ).join(' ')}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Comments Textarea */}
          <div className="mb-4">
            <label htmlFor="comments" className="block text-sm font-medium text-text mb-2">
              Additional comments <span className="text-red-400">*</span>
            </label>
            <textarea
              id="comments"
              value={feedbackForm.comments}
              onChange={handleCommentsChange}
              rows={4}
              className="w-full px-3 py-2 bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-violet-500 text-text resize-vertical"
              placeholder="Please provide more details about why you're canceling..."
              required
            />
            {feedbackForm.comments.trim().length === 0 && (
              <p className="text-red-400 text-xs mt-1">Comments are required</p>
            )}
          </div>

          {!isFormValid() && (
            <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm">
                Please select at least one feature and provide comments before canceling.
              </p>
            </div>
          )}
        </div>

        {/* Last Payment Date Display */}
        {!loadingPaymentDate && lastPaymentDate && (
          <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-text mb-2">Your Subscription Details</h3>
                <p className="text-text/80 text-sm mb-1">
                  <strong>Last Payment:</strong> {formatDate(new Date(lastPaymentDate))}
                </p>
                {getAccessEndDate() && (
                  <p className="text-text/80 text-sm">
                    <strong>Access Until:</strong> {formatDate(getAccessEndDate()!)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Warning Section */}
        <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-text mb-2">What happens when you cancel?</h3>
              <ul className="text-text/80 text-sm space-y-1 list-disc list-inside">
                <li>Your subscription cancellation will be processed immediately</li>
                <li>You will retain access to all paid features for 1 month after your last payment</li>
                {getAccessEndDate() && (
                  <li>Your access will end on <strong>{formatDate(getAccessEndDate()!)}</strong></li>
                )}
                <li>After the access period ends, you will be automatically downgraded to the Free plan</li>
                <li>You can resubscribe at any time</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {cancelStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-1">Subscription Canceled</h3>
                <p className="text-text/80 text-sm">
                  Your subscription cancellation has been processed successfully.
                  {getAccessEndDate() && (
                    <> You will retain access until <strong>{formatDate(getAccessEndDate()!)}</strong>.</>
                  )}
                  {' '}You will be redirected shortly...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {cancelStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-1">Error</h3>
                <p className="text-text/80 text-sm">
                  {errorMessage || 'Failed to cancel subscription. Please try again or contact support.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleCancelSubscription}
            disabled={isCanceling || cancelStatus === 'success' || !isFormValid()}
            variant="destructive"
            className="w-full"
          >
            {isCanceling ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Canceling...
              </div>
            ) : (
              'Yes, Cancel My Subscription'
            )}
          </Button>

          <Button
            asChild
            variant="outline"
            disabled={isCanceling || cancelStatus === 'success'}
            className="w-full"
          >
            <Link href="/protected/account">No, Keep My Subscription</Link>
          </Button>
        </div>

        {/* Support Information */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-text/70 text-sm text-center">
            Need help? <Link href="/protected/account" className="text-blue-400 hover:text-blue-300 underline">Contact support</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

