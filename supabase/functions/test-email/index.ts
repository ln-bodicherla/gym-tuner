
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Embedded email template for testing
const TrialWelcomeEmail = ({
  userName,
  trialEndDate,
  dashboardUrl,
}: {
  userName: string;
  trialEndDate: string;
  dashboardUrl: string;
}) => (
  React.createElement(Html, {},
    React.createElement(Head),
    React.createElement(Preview, {}, 'Welcome to your 30-day free trial of Gym Tuner Pro!'),
    React.createElement(Body, { style: main },
      React.createElement(Container, { style: container },
        React.createElement(Heading, { style: h1 }, 'Welcome to Gym Tuner Pro! 🎉'),
        React.createElement(Text, { style: text }, `Hi ${userName},`),
        React.createElement(Text, { style: text },
          `Congratulations! Your 30-day free trial of Gym Tuner Pro has started. You now have access to all premium features until ${trialEndDate}.`
        ),
        React.createElement(Section, { style: featuresSection },
          React.createElement(Heading, { style: h2 }, "What's included in your Pro subscription:"),
          React.createElement(Text, { style: featureItem }, '✅ AI-powered personalized workout suggestions'),
          React.createElement(Text, { style: featureItem }, '✅ Advanced progress tracking and analytics'),
          React.createElement(Text, { style: featureItem }, '✅ Comprehensive injury tracking system'),
          React.createElement(Text, { style: featureItem }, '✅ Smart goal management with AI insights'),
          React.createElement(Text, { style: featureItem }, '✅ Unlimited workout plan storage'),
          React.createElement(Text, { style: featureItem }, '✅ Premium support and priority assistance')
        ),
        React.createElement(Link, {
          href: dashboardUrl,
          style: button
        }, 'Start Your Fitness Journey'),
        React.createElement(Hr, { style: hr }),
        React.createElement(Section, { style: footer },
          React.createElement(Text, { style: footerText },
            React.createElement('strong', {}, 'Need help?'), ' We\'re here for you!'
          ),
          React.createElement(Text, { style: footerText },
            '📧 Email: ',
            React.createElement(Link, { href: 'mailto:contact@gymtuner.app', style: link }, 'contact@gymtuner.app')
          ),
          React.createElement(Text, { style: footerText }, '💬 We typically respond within 24 hours'),
          React.createElement(Text, { style: footerText },
            '🌐 Visit: ',
            React.createElement(Link, { href: 'https://gymtuner.app', style: link }, 'gymtuner.app')
          )
        ),
        React.createElement(Text, { style: disclaimer },
          `Your trial will automatically convert to a paid subscription at $9.99/month on ${trialEndDate} unless cancelled. You can cancel anytime from your account settings.`
        )
      )
    )
  )
);

// Email styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '30px 0 20px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
};

const featuresSection = {
  padding: '0 40px',
  margin: '32px 0',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '24px 40px',
};

const featureItem = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '8px 0',
};

const button = {
  backgroundColor: '#f59e0b',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '16px 32px',
  margin: '32px 40px',
};

const link = {
  color: '#f59e0b',
  textDecoration: 'underline',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
};

const footer = {
  padding: '0 40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0',
};

const disclaimer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '32px 40px 0',
  textAlign: 'center' as const,
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
