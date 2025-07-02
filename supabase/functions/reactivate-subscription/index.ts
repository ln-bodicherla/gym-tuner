import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REACTIVATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Initialize Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "No customer account found. Please contact support." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get all subscriptions to find cancelled ones
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });

    // Find the most recent cancelled subscription
    const cancelledSubscription = subscriptions.data.find(sub => 
      sub.cancel_at_period_end === true || sub.status === 'canceled'
    );

    if (!cancelledSubscription) {
      logStep("No cancelled subscription found");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "No cancelled subscription found to reactivate." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Found cancelled subscription", { 
      subscriptionId: cancelledSubscription.id,
      status: cancelledSubscription.status,
      cancelAtPeriodEnd: cancelledSubscription.cancel_at_period_end,
      trialEnd: cancelledSubscription.trial_end,
      currentPeriodEnd: cancelledSubscription.current_period_end
    });

    let reactivatedSubscription;
    const now = Math.floor(Date.now() / 1000);
    const isTrialActive = cancelledSubscription.trial_end && cancelledSubscription.trial_end > now;
    const isPeriodActive = cancelledSubscription.current_period_end > now;

    if (cancelledSubscription.status === 'canceled' || !isPeriodActive) {
      // Subscription has already ended - create new subscription
      logStep("Creating new subscription - period ended");
      
      reactivatedSubscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: 'price_1QVgTzJNcmPzuSeUcwkXJrVr' }], // Use the same price ID
        billing_cycle_anchor: 'now',
      });
    } else if (isTrialActive) {
      // Trial is still active - just remove the cancel_at_period_end flag
      logStep("Reactivating trial subscription");
      
      reactivatedSubscription = await stripe.subscriptions.update(cancelledSubscription.id, {
        cancel_at_period_end: false,
      });
    } else {
      // Paid subscription is still active - just remove the cancel_at_period_end flag
      logStep("Reactivating paid subscription");
      
      reactivatedSubscription = await stripe.subscriptions.update(cancelledSubscription.id, {
        cancel_at_period_end: false,
      });
    }

    logStep("Subscription reactivated", { 
      subscriptionId: reactivatedSubscription.id,
      status: reactivatedSubscription.status,
      trialEnd: reactivatedSubscription.trial_end,
      currentPeriodEnd: reactivatedSubscription.current_period_end
    });

    // Update the database
    const isInTrial = reactivatedSubscription.trial_end && reactivatedSubscription.trial_end > now;
    
    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: true,
      subscription_tier: "Premium",
      subscription_end: new Date(reactivatedSubscription.current_period_end * 1000).toISOString(),
      trial_end: reactivatedSubscription.trial_end ? new Date(reactivatedSubscription.trial_end * 1000).toISOString() : null,
      cancelled_but_active: false,
      trial_used: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Database updated with reactivation info");

    return new Response(JSON.stringify({
      success: true,
      message: "Subscription reactivated successfully",
      subscription_id: reactivatedSubscription.id,
      status: reactivatedSubscription.status,
      trial_end: reactivatedSubscription.trial_end ? new Date(reactivatedSubscription.trial_end * 1000).toISOString() : null,
      current_period_end: new Date(reactivatedSubscription.current_period_end * 1000).toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in reactivate-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});