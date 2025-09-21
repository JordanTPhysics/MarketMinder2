import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface PaymentVerificationRequest {
  sessionId: string;
  plan: string;
}

interface PlanInfo {
  subscriptionId: number;
  planName: string;
}

const PLAN_INFO: Record<string, PlanInfo> = {
  'Professional': {
    subscriptionId: 2,
    planName: 'Professional'
  },
  'Enterprise': {
    subscriptionId: 3,
    planName: 'Enterprise'
  }
};

export async function POST(request: NextRequest) {
  try {
    const body: PaymentVerificationRequest = await request.json();
    const { sessionId, plan } = body;

    console.log('🔍 Verify Payment API Debug Info:');
    console.log('Request body:', body);
    console.log('Session ID:', sessionId);
    console.log('Plan:', plan);

    if (!sessionId || !plan) {
      console.log('❌ Missing required parameters');
      return NextResponse.json(
        { success: false, error: 'Missing session ID or plan' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // In a real implementation, you would verify the payment with Stripe here
    // For now, we'll simulate a successful verification
    console.log('🔍 Verifying Stripe payment...');
    const paymentVerified = await verifyStripePayment(sessionId);
    console.log('🔍 Payment verification result:', paymentVerified);
    
    if (!paymentVerified) {
      console.log('❌ Payment verification failed');
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Get plan info
    const planInfo = PLAN_INFO[plan];
    if (!planInfo) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan specified' },
        { status: 400 }
      );
    }

    // Update user's subscription in the database
    const updateResult = await updateUserSubscription(
      supabase, 
      user.id, 
      planInfo.subscriptionId
    );

    if (!updateResult.success) {
      return NextResponse.json(
        { success: false, error: updateResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: planInfo.planName,
      message: 'Subscription updated successfully'
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function verifyStripePayment(sessionId: string): Promise<boolean> {

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return session.payment_status === 'paid';

}

async function updateUserSubscription(
  supabase: any, 
  userId: string, 
  subscriptionId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // First, check if user_profiles record exists
    const { data: existingRecord, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user profile:', fetchError);
      return { success: false, error: 'Failed to fetch user data' };
    }

    if (existingRecord) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          subscription_id: subscriptionId,
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating user subscription:', updateError);
        return { success: false, error: 'Failed to update subscription' };
      }
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          subscription_id: subscriptionId
        });

      if (insertError) {
        console.error('Error creating user profile:', insertError);
        return { success: false, error: 'Failed to create user profile' };
      }
    }

    return { success: true };

  } catch (error) {
    console.error('Error updating user subscription:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
