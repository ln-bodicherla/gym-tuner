
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { TrialWelcomeEmail } from '../send-subscription-emails/_templates/trial-welcome.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[TEST-EMAIL] Starting sample email test');

    const { email } = await req.json();
    
    if (!email) {
      throw new Error('Email address is required');
    }

    console.log('[TEST-EMAIL] Sending sample email to:', email);

    // Sample data for testing
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);
    
    const dashboardUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.lovableproject.com/dashboard` || 'https://gymtuner.app/dashboard';

    const emailHtml = await renderAsync(
      React.createElement(TrialWelcomeEmail, {
        userName: 'John Doe',
        trialEndDate: trialEndDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        dashboardUrl,
      })
    );

    const emailResponse = await resend.emails.send({
      from: 'Gym Tuner <noreply@gymtuner.app>',
      to: [email],
      subject: 'Welcome to your Gym Tuner Pro free trial! 🎉 (Test Email)',
      html: emailHtml,
    });

    console.log('[TEST-EMAIL] Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      message: 'Sample trial welcome email sent successfully!' 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('[TEST-EMAIL] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to send test email'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
