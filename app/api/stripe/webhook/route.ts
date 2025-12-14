import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Init Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

// Init Supabase (Service Role key needed!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ NEVER expose this key client-side
);

// Subscription ID mapping (Free=1, Professional=2, Enterprise=3)
const SUBSCRIPTION_IDS: Record<string, number> = {
  'price_1SeDqGLCNjnWAwZSUUuSnCGk': 7, // Business plan
  'price_1SeDoLLCNjnWAwZSEWhh9mRN': 2, // Professional plan
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        }

        case "customer.subscription.created": {
          await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
        }

        case "customer.subscription.updated": {
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        }

        case "customer.subscription.deleted": {
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        }

        case "invoice.payment_succeeded": {
          await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        }

        case "invoice.payment_failed": {
          await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        }

        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    } catch (err) {
      console.error("Webhook handling failed:", err);
      return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to update user subscription in user_profiles table
async function updateUserSubscription(
  userId: string, 
  subscriptionId: number, 
  options?: {
    setSubscriptionStarted?: boolean;
    updateLastPayment?: boolean;
  }
): Promise<void> {
  try {
    // Check if user_profiles record exists
    const { data: existingRecord, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', fetchError);
      throw new Error('Failed to fetch user data');
    }

    const updateData: any = {
      subscription_id: subscriptionId
    };

    // Set subscription_started_at if this is a new subscription (and not already set)
    if (options?.setSubscriptionStarted) {
      // Only set if not already set (to preserve original subscription start date)
      if (!existingRecord?.subscription_started_at) {
        updateData.subscription_started_at = new Date().toISOString();
      }
      // Reset cancellation fields if resubscribing
      if (subscriptionId > 1) {
        updateData.subscription_cancelled = false;
        updateData.subscription_cancelled_at = null;
        updateData.cancellation_reason = null;
        updateData.cancellation_reason_code = null;
      }
    }

    // Update last_stripe_payment_at for recurring payments
    if (options?.updateLastPayment) {
      updateData.last_stripe_payment_at = new Date().toISOString();
    }

    if (existingRecord) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating user subscription:', updateError);
        throw new Error('Failed to update subscription');
      }
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          subscription_id: subscriptionId,
          ...updateData
        });

      if (insertError) {
        console.error('Error creating user profile:', insertError);
        throw new Error('Failed to create user profile');
      }
    }

    console.log(`Successfully updated user ${userId} to subscription ID ${subscriptionId}`);

  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}

// Helper function to update cancellation fields in user_profiles table
async function updateSubscriptionCancellation(
  userId: string,
  cancellationReason?: string,
  cancellationReasonCode?: string
): Promise<void> {
  try {
    const updateData: any = {
      subscription_cancelled: true,
      subscription_cancelled_at: new Date().toISOString()
    };

    if (cancellationReason) {
      updateData.cancellation_reason = cancellationReason;
    }

    if (cancellationReasonCode) {
      updateData.cancellation_reason_code = cancellationReasonCode;
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating subscription cancellation:', updateError);
      throw new Error('Failed to update cancellation status');
    }

    console.log(`Successfully updated cancellation status for user ${userId}`);

  } catch (error) {
    console.error('Error updating subscription cancellation:', error);
    throw error;
  }
}

// Helper function to find user by email
async function findUserByEmail(email: string) {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error fetching users:', error);
    return null;
  }
  return users?.users.find(u => u.email === email) || null;
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout session completed:', session.id);
  
  try {
    const customerEmail = session.customer_details?.email;
    const customerId = session.customer as string;
    
    if (!customerEmail) {
      console.error('No customer email found in session');
      return;
    }

    // Find user by email
    const user = await findUserByEmail(customerEmail);
    if (!user) {
      console.error('User not found for email:', customerEmail);
      return;
    }

    // Get subscription ID from price ID
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const priceId = lineItems.data[0]?.price?.id;
    
    if (!priceId) {
      console.error('No price ID found in session');
      return;
    }

    const subscriptionId = SUBSCRIPTION_IDS[priceId];
    if (!subscriptionId) {
      console.error('Unknown price ID:', priceId);
      return;
    }

    // Update user subscription and set subscription_started_at for new subscriptions
    await updateUserSubscription(user.id, subscriptionId, {
      setSubscriptionStarted: true
    });
    
    console.log(`Successfully updated subscription for user ${user.id} to subscription ID ${subscriptionId}`);

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Processing subscription created:', subscription.id);
  
  try {
    const customerId = subscription.customer as string;
    const customer = await stripe.customers.retrieve(customerId);
    
    if (!customer || customer.deleted) {
      console.error('Customer not found or deleted');
      return;
    }

    const customerEmail = (customer as Stripe.Customer).email;
    if (!customerEmail) {
      console.error('No customer email found');
      return;
    }

    // Find user by email
    const user = await findUserByEmail(customerEmail);
    if (!user) {
      console.error('User not found for email:', customerEmail);
      return;
    }

    // Get subscription ID from price ID
    const priceId = subscription.items.data[0]?.price?.id;
    if (!priceId) {
      console.error('No price ID found in subscription');
      return;
    }

    const subscriptionId = SUBSCRIPTION_IDS[priceId];
    if (!subscriptionId) {
      console.error('Unknown price ID:', priceId);
      return;
    }

    // Update user subscription and set subscription_started_at for new subscriptions
    await updateUserSubscription(user.id, subscriptionId, {
      setSubscriptionStarted: true
    });
    
    console.log(`Successfully created subscription for user ${user.id} with subscription ID ${subscriptionId}`);

  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing subscription updated:', subscription.id);
  
  try {
    const customerId = subscription.customer as string;
    const customer = await stripe.customers.retrieve(customerId);
    
    if (!customer || customer.deleted) {
      console.error('Customer not found or deleted');
      return;
    }

    const customerEmail = (customer as Stripe.Customer).email;
    if (!customerEmail) {
      console.error('No customer email found');
      return;
    }

    // Find user by email
    const user = await findUserByEmail(customerEmail);
    if (!user) {
      console.error('User not found for email:', customerEmail);
      return;
    }

    // Get subscription ID from price ID
    const priceId = subscription.items.data[0]?.price?.id;
    if (!priceId) {
      console.error('No price ID found in subscription');
      return;
    }

    const subscriptionId = SUBSCRIPTION_IDS[priceId];
    if (!subscriptionId) {
      console.error('Unknown price ID:', priceId);
      return;
    }

    // Update user subscription
    await updateUserSubscription(user.id, subscriptionId);
    
    console.log(`Successfully updated subscription for user ${user.id} to subscription ID ${subscriptionId}`);

  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription deleted:', subscription.id);
  
  try {
    const customerId = subscription.customer as string;
    const customer = await stripe.customers.retrieve(customerId);
    
    if (!customer || customer.deleted) {
      console.error('Customer not found or deleted');
      return;
    }

    const customerEmail = (customer as Stripe.Customer).email;
    if (!customerEmail) {
      console.error('No customer email found');
      return;
    }

    // Find user by email
    const user = await findUserByEmail(customerEmail);
    if (!user) {
      console.error('User not found for email:', customerEmail);
      return;
    }

    // Update cancellation status (database job will handle subscription_id downgrade after 1 month)
    await updateSubscriptionCancellation(
      user.id,
      'Subscription deleted via Stripe webhook',
      'STRIPE_DELETED'
    );
    
    console.log(`Successfully marked subscription as cancelled for user ${user.id}. Database job will downgrade after 1 month.`);

  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing invoice payment succeeded:', invoice.id);
  
  try {
    const customerId = invoice.customer as string;
    const customer = await stripe.customers.retrieve(customerId);
    
    if (!customer || customer.deleted) {
      console.error('Customer not found or deleted');
      return;
    }

    const customerEmail = (customer as Stripe.Customer).email;
    if (!customerEmail) {
      console.error('No customer email found');
      return;
    }

    // Find user by email
    const user = await findUserByEmail(customerEmail);
    if (!user) {
      console.error('User not found for email:', customerEmail);
      return;
    }

    // Get subscription ID from price ID
    if ((invoice as any).subscription) {
      const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
      const priceId = subscription.items.data[0]?.price?.id;
      
      if (!priceId) {
        console.error('No price ID found in subscription');
        return;
      }

      const subscriptionId = SUBSCRIPTION_IDS[priceId];
      if (!subscriptionId) {
        console.error('Unknown price ID:', priceId);
        return;
      }

      // Update user subscription and last payment date for recurring payments
      await updateUserSubscription(user.id, subscriptionId, {
        updateLastPayment: true
      });
      
      console.log(`Successfully processed payment for user ${user.id} with subscription ID ${subscriptionId}`);
    }

  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing invoice payment failed:', invoice.id);
  
  try {
    const customerId = invoice.customer as string;
    const customer = await stripe.customers.retrieve(customerId);
    
    if (!customer || customer.deleted) {
      console.error('Customer not found or deleted');
      return;
    }

    const customerEmail = (customer as Stripe.Customer).email;
    if (!customerEmail) {
      console.error('No customer email found');
      return;
    }

    // Find user by email
    const user = await findUserByEmail(customerEmail);
    if (!user) {
      console.error('User not found for email:', customerEmail);
      return;
    }

    // You might want to handle failed payments differently
    // For now, we'll just log it
    console.log(`Payment failed for user ${user.id}. Consider sending notification email.`);

  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}
