import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Init Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Init Supabase (Service Role key needed!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ NEVER expose this key client-side
);

// Subscription ID mapping (Free=1, Professional=2, Enterprise=3)
const SUBSCRIPTION_IDS: Record<string, number> = {
  'price_professional': 2, // Replace with your actual price ID
  'price_enterprise': 3,   // Replace with your actual price ID
};

// Disable Next.js body parser so we can verify raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: any) {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
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
    return res.status(500).send("Webhook handler error");
  }

  res.json({ received: true });
}

// Helper function to update user subscription in user_profiles table
async function updateUserSubscription(userId: string, subscriptionId: number): Promise<void> {
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

    if (existingRecord) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          subscription_id: subscriptionId
        })
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
          subscription_id: subscriptionId
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

    // Update user subscription
    await updateUserSubscription(user.id, subscriptionId);
    
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

    // Update user subscription
    await updateUserSubscription(user.id, subscriptionId);
    
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

    // Downgrade to free plan (subscription ID 1)
    await updateUserSubscription(user.id, 1);
    
    console.log(`Successfully downgraded user ${user.id} to free plan`);

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

      // Update user subscription
      await updateUserSubscription(user.id, subscriptionId);
      
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
