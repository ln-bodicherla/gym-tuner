
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
import * as React from 'npm:react@18.3.1';

interface TrialWelcomeEmailProps {
  userName: string;
  trialEndDate: string;
  dashboardUrl: string;
}

export const TrialWelcomeEmail = ({
  userName,
  trialEndDate,
  dashboardUrl,
}: TrialWelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to your 14-day free trial of Gym Tuner Pro!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to Gym Tuner Pro! 🎉</Heading>
        
        <Text style={text}>
          Hi {userName},
        </Text>
        
        <Text style={text}>
          Congratulations! Your 14-day free trial of Gym Tuner Pro has started. 
          You now have access to all premium features until <strong>{trialEndDate}</strong>.
        </Text>

        <Section style={featuresSection}>
          <Heading style={h2}>What's included in your Pro subscription:</Heading>
          <Text style={featureItem}>✅ AI-powered personalized workout suggestions</Text>
          <Text style={featureItem}>✅ Advanced progress tracking and analytics</Text>
          <Text style={featureItem}>✅ Comprehensive injury tracking system</Text>
          <Text style={featureItem}>✅ Smart goal management with AI insights</Text>
          <Text style={featureItem}>✅ Unlimited workout plan storage</Text>
          <Text style={featureItem}>✅ Premium support and priority assistance</Text>
        </Section>

        <Link
          href={dashboardUrl}
          style={button}
        >
          Start Your Fitness Journey
        </Link>

        <Hr style={hr} />

        <Section style={footer}>
          <Text style={footerText}>
            <strong>Need help?</strong> We're here for you!
          </Text>
          <Text style={footerText}>
            📧 Email: <Link href="mailto:contact@gymtuner.app" style={link}>contact@gymtuner.app</Link>
          </Text>
          <Text style={footerText}>
            💬 We typically respond within 24 hours
          </Text>
          <Text style={footerText}>
            🌐 Visit: <Link href="https://gymtuner.app" style={link}>gymtuner.app</Link>
          </Text>
        </Section>

        <Text style={disclaimer}>
          Your trial will automatically convert to a paid subscription at $2.99/month on {trialEndDate} unless cancelled. 
          You can cancel anytime from your account settings.
        </Text>
      </Container>
    </Body>
  </Html>
);

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

export default TrialWelcomeEmail;
