
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        trial_end: null,
        trial_used: false,
        cancelled_but_active: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      return new Response(JSON.stringify({ subscribed: false, trial_used: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });
    
    logStep("Retrieved subscriptions", { 
      count: subscriptions.data.length, 
      statuses: subscriptions.data.map(s => ({ id: s.id, status: s.status, cancelAtPeriodEnd: s.cancel_at_period_end }))
    });

    let hasAccess = false;
    let subscriptionTier = null;
    let subscriptionEnd = null;
    let trialEnd = null;
    let cancelledButActive = false;
    let trialUsed = false;

    // Check if user has ever had a trial or subscription
    const hasAnySubscriptionHistory = subscriptions.data.length > 0;
    if (hasAnySubscriptionHistory) {
      trialUsed = true; // If they have any subscription history, they've used their trial
    }

    // Check for active subscriptions or trials
    for (const subscription of subscriptions.data) {
      if (subscription.status === "active" || subscription.status === "trialing") {
        hasAccess = true;
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        
        // Check if subscription is cancelled but still active
        if (subscription.cancel_at_period_end) {
          cancelledButActive = true;
          logStep("Subscription is cancelled but still active until period end", {
            subscriptionId: subscription.id,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodEnd: subscriptionEnd
          });
        }
        
        // Check if currently in trial
        if (subscription.trial_end && subscription.trial_end > Math.floor(Date.now() / 1000)) {
          trialEnd = new Date(subscription.trial_end * 1000).toISOString();
          trialUsed = true;
          logStep("Active trial found", { 
            subscriptionId: subscription.id, 
            status: subscription.status,
            trialEnd: trialEnd,
            subscriptionEnd: subscriptionEnd
          });
        } else {
          logStep("Active subscription found", { 
            subscriptionId: subscription.id, 
            status: subscription.status,
            endDate: subscriptionEnd,
            cancelledButActive: cancelledButActive
          });
        }

        // Determine subscription tier from price
        const priceId = subscription.items.data[0].price.id;
        const price = await stripe.prices.retrieve(priceId);
        const amount = price.unit_amount || 0;
        if (amount <= 999) {
          subscriptionTier = "Basic";
        } else if (amount <= 1999) {
          subscriptionTier = "Premium";
        } else {
          subscriptionTier = "Enterprise";
        }
        logStep("Determined subscription tier", { priceId, amount, subscriptionTier });
        break; // Use the first active/trialing subscription
      }
    }

    if (!hasAccess) {
      logStep("No active subscription or trial found");
    }

    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: hasAccess,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      trial_end: trialEnd,
      trial_used: trialUsed,
      cancelled_but_active: cancelledButActive,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Updated database with subscription info", { 
      subscribed: hasAccess, 
      subscriptionTier,
      trialEnd: trialEnd ? "Yes" : "No",
      cancelledButActive: cancelledButActive,
      trialUsed: trialUsed
    });
    
    return new Response(JSON.stringify({
      subscribed: hasAccess,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      trial_end: trialEnd,
      cancelled_but_active: cancelledButActive,
      trial_used: trialUsed
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
