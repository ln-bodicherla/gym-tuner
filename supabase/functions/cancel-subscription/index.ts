
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
  console.log(`[CANCEL-SUBSCRIPTION] ${step}${detailsStr}`);
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
        error: "No subscription found. You may not have an active subscription or account with us." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get active subscriptions (including those in trial)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all", // Get all statuses to handle trials
      limit: 10,
    });

    // Filter for active or trialing subscriptions
    const activeSubscriptions = subscriptions.data.filter(sub => 
      sub.status === 'active' || sub.status === 'trialing'
    );

    if (activeSubscriptions.length === 0) {
      logStep("No active or trial subscription found");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "No active subscription found to cancel. You may not have an active subscription or it may have already been cancelled." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const activeSubscription = activeSubscriptions[0];
    logStep("Found subscription to cancel", { 
      subscriptionId: activeSubscription.id, 
      status: activeSubscription.status,
      trialEnd: activeSubscription.trial_end 
    });

    // Cancel the subscription at the end of the current period
    const updatedSubscription = await stripe.subscriptions.update(activeSubscription.id, {
      cancel_at_period_end: true,
    });

    logStep("Subscription cancelled", { 
      subscriptionId: updatedSubscription.id, 
      cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
      currentPeriodEnd: updatedSubscription.current_period_end
    });

    // Update the database to reflect the cancellation
    const isTrialing = activeSubscription.status === 'trialing';
    const subscriptionEndDate = isTrialing && activeSubscription.trial_end 
      ? new Date(activeSubscription.trial_end * 1000).toISOString()
      : new Date(updatedSubscription.current_period_end * 1000).toISOString();

    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: !isTrialing, // False if trialing (trial cancelled), true if active subscription
      subscription_tier: isTrialing ? null : "Premium",
      subscription_end: subscriptionEndDate,
      trial_end: isTrialing ? subscriptionEndDate : null,
      cancelled_but_active: !isTrialing, // Only true for active paid subscriptions
      trial_used: true, // Mark trial as used
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Database updated with cancellation info");

    return new Response(JSON.stringify({
      success: true,
      message: "Subscription cancelled successfully",
      cancel_at_period_end: updatedSubscription.cancel_at_period_end,
      current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in cancel-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
