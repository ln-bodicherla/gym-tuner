
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1';
import Stripe from 'https://esm.sh/stripe@14.15.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  console.log('[STRIPE-WEBHOOK] Webhook secret exists:', !!webhookSecret);
  console.log('[STRIPE-WEBHOOK] Signature exists:', !!signature);

  if (!signature || !webhookSecret) {
    console.error('[STRIPE-WEBHOOK] Missing signature or webhook secret');
    return new Response('Missing signature or webhook secret', { 
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    console.log('[STRIPE-WEBHOOK] Processing event:', event.type);

    switch (event.type) {
      case 'customer.subscription.created': {
        // Handle new subscription (trial start)
        const subscription = event.data.object as Stripe.Subscription;
        console.log('[STRIPE-WEBHOOK] New subscription created:', subscription.id);
        
        await handleTrialStart(subscription);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        // Handle successful payment
        const invoice = event.data.object as Stripe.Invoice;
        console.log('[STRIPE-WEBHOOK] Payment succeeded for invoice:', invoice.id);
        
        await handlePaymentSuccess(invoice);
        break;
      }
      
      case 'customer.subscription.updated': {
        // Handle subscription changes
        const subscription = event.data.object as Stripe.Subscription;
        console.log('[STRIPE-WEBHOOK] Subscription updated:', subscription.id);
        
        await handleSubscriptionUpdate(subscription);
        break;
      }
      
      default:
        console.log('[STRIPE-WEBHOOK] Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[STRIPE-WEBHOOK] Error processing webhook:', error);
    return new Response(`Webhook error: ${error.message}`, { status: 400 });
  }
};

async function handleTrialStart(subscription: Stripe.Subscription) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    if ('email' in customer && customer.email) {
      console.log('[STRIPE-WEBHOOK] Sending trial welcome email to:', customer.email);
      
      // Get user info from database
      const { data: user } = await supabase
        .from('subscribers')
        .select('user_id')
        .eq('stripe_customer_id', customer.id)
        .single();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.user_id)
          .single();

        // Fix: Ensure proper date handling for trial end
        let trialEndDate: Date;
        if (subscription.trial_end && subscription.trial_end > 0) {
          // Convert Unix timestamp to milliseconds and create Date
          trialEndDate = new Date(subscription.trial_end * 1000);
        } else {
          // Fallback: 30 days from now
          trialEndDate = new Date();
          trialEndDate.setDate(trialEndDate.getDate() + 30);
        }
        
        console.log('[STRIPE-WEBHOOK] Trial end date:', trialEndDate.toISOString());
        
        // Send trial welcome email
        await supabase.functions.invoke('send-subscription-emails', {
          body: {
            type: 'trial_welcome',
            userId: user.user_id,
            email: customer.email,
            userName: profile?.full_name || customer.email.split('@')[0],
            trialEndDate: trialEndDate.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
          },
        });
      }
    }
  } catch (error) {
    console.error('[STRIPE-WEBHOOK] Error handling trial start:', error);
  }
}

async function handlePaymentSuccess(invoice: Stripe.Invoice) {
  try {
    if (invoice.billing_reason === 'subscription_cycle') {
      // This is a recurring payment, not the initial trial
      const customer = await stripe.customers.retrieve(invoice.customer as string);
      
      if ('email' in customer && customer.email) {
        console.log('[STRIPE-WEBHOOK] Sending payment confirmation to:', customer.email);
        
        // Get user info from database
        const { data: user } = await supabase
          .from('subscribers')
          .select('user_id')
          .eq('stripe_customer_id', customer.id)
          .single();

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.user_id)
            .single();

          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          
          // Fix: Ensure proper date handling for all dates
          const billingPeriodStart = new Date(invoice.period_start && invoice.period_start > 0 ? invoice.period_start * 1000 : Date.now());
          const billingPeriodEnd = new Date(invoice.period_end && invoice.period_end > 0 ? invoice.period_end * 1000 : Date.now());
          const nextBillingDate = new Date(subscription.current_period_end && subscription.current_period_end > 0 ? subscription.current_period_end * 1000 : Date.now());

          console.log('[STRIPE-WEBHOOK] Billing period start:', billingPeriodStart.toISOString());
          console.log('[STRIPE-WEBHOOK] Billing period end:', billingPeriodEnd.toISOString());
          console.log('[STRIPE-WEBHOOK] Next billing date:', nextBillingDate.toISOString());

          // Send payment confirmation email
          await supabase.functions.invoke('send-subscription-emails', {
            body: {
              type: 'payment_confirmation',
              userId: user.user_id,
              email: customer.email,
              userName: profile?.full_name || customer.email.split('@')[0],
              amount: (invoice.amount_paid / 100).toFixed(2),
              currency: invoice.currency,
              invoiceId: invoice.id,
              transactionId: invoice.payment_intent as string,
              billingPeriodStart: billingPeriodStart.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              billingPeriodEnd: billingPeriodEnd.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              nextBillingDate: nextBillingDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('[STRIPE-WEBHOOK] Error handling payment success:', error);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    // Fix: Ensure proper date handling for subscription end
    let subscriptionEndDate: Date;
    if (subscription.current_period_end && subscription.current_period_end > 0) {
      subscriptionEndDate = new Date(subscription.current_period_end * 1000);
    } else {
      subscriptionEndDate = new Date();
    }

    console.log('[STRIPE-WEBHOOK] Subscription end date:', subscriptionEndDate.toISOString());

    // Update subscription status in database
    const { error } = await supabase
      .from('subscribers')
      .update({
        subscribed: subscription.status === 'active',
        subscription_end: subscriptionEndDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', subscription.customer);

    if (error) {
      console.error('[STRIPE-WEBHOOK] Error updating subscription:', error);
    }
  } catch (error) {
    console.error('[STRIPE-WEBHOOK] Error handling subscription update:', error);
  }
}

serve(handler);
