
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1';
import { TrialWelcomeEmail } from './_templates/trial-welcome.tsx';
import { PaymentConfirmationEmail } from './_templates/payment-confirmation.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  type: 'trial_welcome' | 'payment_confirmation';
  userId: string;
  email: string;
  userName?: string;
  trialEndDate?: string;
  amount?: string;
  currency?: string;
  invoiceId?: string;
  transactionId?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  nextBillingDate?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailRequest: EmailRequest = await req.json();
    console.log('[SEND-SUBSCRIPTION-EMAILS] Processing request:', emailRequest.type, 'for user:', emailRequest.userId);

    const dashboardUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.lovableproject.com/dashboard` || 'https://gymtuner.app/dashboard';

    let emailHtml: string;
    let subject: string;

    if (emailRequest.type === 'trial_welcome') {
      console.log('[SEND-SUBSCRIPTION-EMAILS] Sending trial welcome email');
      console.log('[SEND-SUBSCRIPTION-EMAILS] Trial end date received:', emailRequest.trialEndDate);
      
      subject = 'Welcome to your Gym Tuner Pro free trial! 🎉';
      emailHtml = await renderAsync(
        React.createElement(TrialWelcomeEmail, {
          userName: emailRequest.userName || 'there',
          trialEndDate: emailRequest.trialEndDate || 'your trial end date',
          dashboardUrl,
        })
      );

    } else if (emailRequest.type === 'payment_confirmation') {
      console.log('[SEND-SUBSCRIPTION-EMAILS] Sending payment confirmation email');
      console.log('[SEND-SUBSCRIPTION-EMAILS] Billing dates:', {
        start: emailRequest.billingPeriodStart,
        end: emailRequest.billingPeriodEnd,
        next: emailRequest.nextBillingDate
      });
      
      subject = 'Payment confirmed - Gym Tuner Pro subscription renewed ✅';
      emailHtml = await renderAsync(
        React.createElement(PaymentConfirmationEmail, {
          userName: emailRequest.userName || 'there',
          amount: emailRequest.amount || '2.99',
          currency: emailRequest.currency || 'USD',
          invoiceId: emailRequest.invoiceId || 'N/A',
          transactionId: emailRequest.transactionId || 'N/A',
          billingPeriodStart: emailRequest.billingPeriodStart || 'N/A',
          billingPeriodEnd: emailRequest.billingPeriodEnd || 'N/A',
          nextBillingDate: emailRequest.nextBillingDate || 'N/A',
          dashboardUrl,
        })
      );
    } else {
      throw new Error(`Unknown email type: ${emailRequest.type}`);
    }

    // Send the email
    const emailResponse = await resend.emails.send({
      from: 'Gym Tuner <noreply@gymtuner.app>',
      to: [emailRequest.email],
      subject,
      html: emailHtml,
    });

    console.log('[SEND-SUBSCRIPTION-EMAILS] Email sent successfully:', emailResponse);

    // Log the email in the database for tracking with proper timestamp
    const currentTimestamp = new Date().toISOString();
    console.log('[SEND-SUBSCRIPTION-EMAILS] Logging email with timestamp:', currentTimestamp);
    
    await supabase
      .from('email_logs')
      .insert({
        user_id: emailRequest.userId,
        email_type: emailRequest.type,
        recipient: emailRequest.email,
        subject,
        status: 'sent',
        sent_at: currentTimestamp,
      });

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('[SEND-SUBSCRIPTION-EMAILS] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to send subscription email'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
