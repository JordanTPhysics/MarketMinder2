"use client";

import React from 'react';
import { Check, Star, Zap, Crown } from 'lucide-react';

const PricingPage = () => {
  const handlePlanClick = async (planName: string, priceId: string) => {
    // Don't allow clicking on Enterprise plan
    if (planName === "Enterprise") {
      return;
    }
  
      try {
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: planName, priceId }),
        });
  
        const data = await res.json();
  
        if (data.url) {
          // Stripe Checkout URL
          window.location.href = data.url;
        } else {
          console.error("❌ Checkout error:", data.error);
        }
      } catch (err) {
        console.error("❌ Network or server error:", err);
      }
    };


  const plans = [
    {
      name: "Free",
      price: "$0",
      priceId: "none",
      period: "",
      description: "Perfect for getting started with MarkitMinder",
      icon: <Star className="w-8 h-8 text-yellow-400" />,
      features: [
        "30 requests per day",
        "2 weeks free trial",
        "Email support",
        "Basic analytics",
        "csv export"
      ],
      popular: false,
      color: "border-slate-600"
    },
    {
      name: "Professional",
      price: "$99",
      priceId: "price_1S73djLCNjnWAwZSVFfs1Yhk",
      period: "per month",
      description: "For serious traders and investors",
      icon: <Zap className="w-8 h-8 text-blue-400" />,
      features: [
        "150 requests per day",
        "Advanced market analysis",
        "Priority email support",

      ],
      popular: true,
      color: "border-blue-500"
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "per month",
      priceId: "none",
      description: "For teams and institutions",
      icon: <Crown className="w-8 h-8 text-purple-400" />,
      features: [
        "Unlimited requests",
        "Premium market analysis",
        "24/7 phone support",
        "Instant response times",
        "All advanced features",
        "Custom integrations",
        "White-label options",
        "Dedicated account manager",
        "Custom data exports",
        "Team collaboration tools"
      ],
      popular: false,
      color: "border-purple-500"
    },
    {
      name: "Test_Product",
      price: "$0",
      priceId: "price_1S9oNvLCNjnWAwZSZ9v3ScuO",
      period: "",
      description: "For testing purposes",
      icon: <Star className="w-8 h-8 text-yellow-400" />,
      features: [
        "100 requests per day",
        "2 weeks free trial",
        "Email support",
        "Basic analytics",
        "csv export"
      ],
      popular: false,
      color: "border-slate-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-violet-800 py-12 px-4">
      <div className="w-full">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-text mb-6 font-serif">
            Choose Your Plan
          </h1>
          <p className="text-xl text-text/80 max-w-3xl mx-auto leading-relaxed">
            Unlock the full potential of MarkitMinder with our flexible pricing plans. 
            From individual traders to enterprise teams, we have the perfect solution for you.
          </p>

        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {plans.map((plan, index) => (
            <button
              key={plan.name}
              onClick={() => handlePlanClick(plan.name, plan.priceId!)}
              className={`relative bg-background/50 backdrop-blur-sm rounded-2xl p-8 border-2 ${plan.color} ${
                plan.name === "Enterprise" 
                  ? 'opacity-50 cursor-not-allowed grayscale' 
                  : plan.popular 
                    ? 'ring-2 ring-blue-500/50 shadow-2xl shadow-blue-500/20 scale-105' 
                    : 'hover:scale-105 hover:shadow-xl hover:shadow-violet-500/20'
              } transition-all duration-300 ease-in-out cursor-pointer w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Coming Soon Badge for Enterprise */}
              {plan.name === "Enterprise" && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gray-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
                    Coming Soon
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  {plan.icon}
                </div>
                <h3 className="text-2xl font-bold text-text mb-2 font-serif">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-text">
                    {plan.price}
                  </span>
                  <span className="text-text/60 ml-2">
                    {plan.period}
                  </span>
                </div>
                <p className="text-text/70 text-sm">
                  {plan.description}
                </p>
              </div>

              {/* Features List */}
              <div className="mb-8">
                <ul className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-success mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-text/80 text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Click to select indicator */}
              <div className="text-center mt-6">
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                  plan.name === 'Enterprise'
                    ? 'bg-gray-500 text-white cursor-not-allowed'
                    : plan.popular 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-foreground/20 text-text'
                }`}>
                  {plan.name === 'Enterprise' 
                    ? 'Coming Soon' 
                    : `Click to ${plan.name === 'Free' ? 'Get Started' : 'Subscribe'}`
                  }
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Additional Info Section */}
        <div className="mt-16 text-center">
          <div className="bg-background/30 backdrop-blur-sm rounded-2xl p-8 w-full border border-border">
            <h2 className="text-2xl font-bold text-text mb-4 font-serif">
              All Plans Include
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-text/80">
              <div className="flex items-center justify-center">
                <Check className="w-5 h-5 text-success mr-2" />
                <span>Secure data encryption</span>
              </div>
              <div className="flex items-center justify-center">
                <Check className="w-5 h-5 text-success mr-2" />
                <span>Regular updates</span>
              </div>
              <div className="flex items-center justify-center">
                <Check className="w-5 h-5 text-success mr-2" />
                <span>99.9% uptime guarantee</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-text mb-8 font-serif">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            <div className="bg-background/30 backdrop-blur-sm rounded-xl p-6 border border-border">
              <h3 className="text-lg font-semibold text-text mb-3">
                Can I change plans anytime?
              </h3>
              <p className="text-text/70 text-sm">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="bg-background/30 backdrop-blur-sm rounded-xl p-6 border border-border">
              <h3 className="text-lg font-semibold text-text mb-3">
                Is there a free trial?
              </h3>
              <p className="text-text/70 text-sm">
                Our Free plan is available for 2 weeks.
              </p>
            </div>
            <div className="bg-background/30 backdrop-blur-sm rounded-xl p-6 border border-border">
              <h3 className="text-lg font-semibold text-text mb-3">
                What payment methods do you accept?
              </h3>
              <p className="text-text/70 text-sm">
                Payments are processed through Stripe.
              </p>
            </div>
            <div className="bg-background/30 backdrop-blur-sm rounded-xl p-6 border border-border">
              <h3 className="text-lg font-semibold text-text mb-3">
                Do you offer refunds?
              </h3>
              <p className="text-text/70 text-sm">
                Yes, we offer a 30-day money-back guarantee for all paid plans.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default PricingPage;
