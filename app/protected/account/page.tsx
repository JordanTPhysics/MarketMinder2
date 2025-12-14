"use client";

import { useUser } from "@/utils/use-user";
import { useSubscription } from "@/utils/use-subscription";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";7
import emailjs from '@emailjs/browser'; 
import { PaidOnly, SubscriptionGuard } from "@/components/SubscriptionGuard";

export default function AccountPage() {
  const { user, loading: userLoading } = useUser();
  const { subscription, loading: subscriptionLoading, isFree, isBusiness, isProfessional, isEnterprise, hasPaidPlan } = useSubscription();
  
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    type: 'general',
    name: '',
    userEmail: user?.email,
    toEmail: process.env.NEXT_PUBLIC_EMAILJS_TO_EMAIL || 'contact@www.markitminder.com'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!userLoading && !user) {
      redirect("/sign-in");
    }
  }, [user, userLoading]);

  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

  try {
    // Initialize EmailJS with public key
    emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '');

    // Send email using EmailJS
    emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '',
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '',
      contactForm
    ).then((result) => {
      console.log(result.text);
    }).catch((error) => {
      console.error('EmailJS error:', error);
    });

      setSubmitStatus('success');
      setContactForm({
        subject: '',
        message: '',
        type: 'general',
        name: '',
        userEmail: user?.email,
        toEmail: process.env.NEXT_PUBLIC_EMAILJS_TO_EMAIL || 'contact@www.markitminder.com'
      });
    } catch (error) {
      console.error('Contact form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4">
        <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-8 border border-border max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-text mx-auto mb-4"></div>
          <p className="text-text">Loading account information...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  const getSubscriptionDisplay = () => {
    if (isFree) {
      return {
        name: "Free Plan",
        badge: "bg-gray-500",
        description: "Basic features with limited access"
      };
    } else if (isBusiness) {
      return {
        name: "Business Plan",
        badge: "bg-blue-500",
        description: "Enhanced features for small businesses"
      };
    } else if (isProfessional) {
      return {
        name: "Professional Plan",
        badge: "bg-blue-500",
        description: "Full access to all features"
      };
    } else if (isEnterprise) {
      return {
        name: "Enterprise Plan",
        badge: "bg-purple-500",
        description: "Advanced features and priority support"
      };
    } else {
      return {
        name: "Unknown Plan",
        badge: "bg-gray-500",
        description: "Subscription status unclear"
      };
    }
  };

  const subscriptionInfo = getSubscriptionDisplay();

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4">
      <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-8 border border-border max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-text mb-2">My Account</h1>
        <p className="text-text/80 mb-4">Signed in as <span className="font-semibold">{user.email}</span></p>
        
        {/* Subscription Status */}
        <div className="mb-6 p-4 bg-foreground/30 rounded-lg border border-border">
          <h2 className="text-lg font-semibold text-text mb-2">Current Plan</h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${subscriptionInfo.badge}`}>
              {subscriptionInfo.name}
            </span>
          </div>
          <p className="text-text/70 text-sm">{subscriptionInfo.description}</p>
          {hasPaidPlan && (
            <>
              <p className="text-green-500 text-sm mt-2 font-medium">✓ Active Subscription</p>
              <Button asChild variant="outline" className="mt-3 w-full">
                <Link href="/protected/cancel-subscription">Cancel Subscription</Link>
              </Button>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button asChild variant="outline">
            <Link href="/protected/dashboard">Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/protected/upgrade">Pricing</Link>
          </Button>
          <Button asChild variant="outline" className="md:col-span-2">
            <Link href="/protected">Back to Protected Home</Link>
          </Button>
        </div>
      </div>

      {/* Contact Form Section */}
      <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-8 border border-border max-w-2xl w-full mt-8">
        <h2 className="text-2xl font-bold text-text mb-6 text-center">Contact Support</h2>
        
        {/* Support Email for Paid Users */}
        {hasPaidPlan && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <h3 className="text-lg font-semibold text-text mb-2">Priority Support</h3>
            <p className="text-text/80 text-sm mb-2">
              As a paid subscriber, you have access to priority support. We'll get back to you as soon as we can.
            </p>
            <p className="text-text">
              <strong>Support Email:</strong> 
              <a 
                href="mailto:contact@www.markitminder.com" 
                className="text-blue-400 hover:text-blue-300 ml-2 underline"
              >
                contact@www.markitminder.com
              </a>
            </p>
          </div>
        )}

        {/* Contact Form */}    
        <form onSubmit={handleContactFormSubmit} className="space-y-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-text mb-2">
              Inquiry Type
            </label>
            <select
              id="type"
              name="type"
              value={contactForm.type}
              onChange={handleContactFormChange}
              className="w-full px-3 py-2 bg-foreground border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-slate-500 text-text"
              required
            >
              <option value="general">General Question</option>
              <option value="technical">Technical Issue</option>
              <option value="billing">Billing Question</option>
              <option value="feature">Feature Request</option>
              <option value="bug">Bug Report</option>
            </select>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-text mb-2">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={contactForm.subject}
              onChange={handleContactFormChange}
              className="w-full px-3 py-2 bg-foreground border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-slate-500 text-text"
              placeholder="Brief description of your inquiry"
              required
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text mb-2">
              Name (Optional)
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={contactForm.name}
              onChange={handleContactFormChange}
              className="w-full px-3 py-2 bg-foreground border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-slate-500 text-text"
              placeholder="Your name"
              
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-text mb-2">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={contactForm.message}
              onChange={handleContactFormChange}
              rows={5}
              className="w-full px-3 py-2 bg-foreground border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-slate-500 text-text resize-vertical"
              placeholder="Please provide details about your inquiry..."
              required
            />
          </div>

          {/* Submit Status Messages */}
          {submitStatus === 'success' && (
            <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm">
                ✓ Your message has been sent successfully! We'll get back to you soon.
              </p>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">
                ✗ There was an error sending your message. Please try again or contact us directly.
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-1/2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </div>
            ) : (
              'Send Message'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}


