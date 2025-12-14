// app/api/cancel-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../utils/supabase/server'
import Stripe from 'stripe'

// Init Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = await createClient()

    // Try to get user from session cookies first
    let { data: { user }, error: authError } = await supabase.auth.getUser()

    // If no user from cookies, try Authorization header (for client-side calls)
    if (!user && req.headers.get('authorization')) {
      const token = req.headers.get('authorization')?.replace('Bearer ', '')
      if (token) {
        const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token)
        if (!tokenError && tokenUser) {
          user = tokenUser
          authError = null
        }
      }
    }

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get feedback from request body (optional)
    const body = await req.json().catch(() => ({}))
    const feedback = body.feedback

    // Log feedback for analysis (you can save this to a database if needed)
    if (feedback) {
      console.log('Cancellation feedback from user:', user.email, {
        unsatisfiedFeatures: feedback.unsatisfiedFeatures,
        comments: feedback.comments,
        timestamp: new Date().toISOString()
      })
      // TODO: Optionally save feedback to a database table for analysis
    }

    // Find Stripe customer by email
    const customers = await stripe.customers.list({
      email: user.email!,
      limit: 1,
    })

    if (customers.data.length === 0) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    const customer = customers.data[0]

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    const subscription = subscriptions.data[0]
    const canceledSubscription = await stripe.subscriptions.cancel(subscription.id)
    const cancellationReason = feedback.comments || 'User canceled subscription'
    const cancellationReasonCode = feedback.reasonCodes || 'USER_CANCELED'

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        subscription_cancelled: true,
        subscription_cancelled_at: new Date().toISOString(),
        cancellation_reason: cancellationReason,
        cancellation_reason_code: cancellationReasonCode.toString()
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating cancellation status:', updateError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription canceled successfully',
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        canceled_at: canceledSubscription.canceled_at,
      },
    })
  } catch (error: any) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription', message: error.message },
      { status: 500 }
    )
  }
}

