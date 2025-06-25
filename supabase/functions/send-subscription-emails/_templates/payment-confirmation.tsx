
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

interface PaymentConfirmationEmailProps {
  userName: string;
  amount: string;
  currency: string;
  invoiceId: string;
  transactionId: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  nextBillingDate: string;
  dashboardUrl: string;
}

export const PaymentConfirmationEmail = ({
  userName,
  amount,
  currency,
  invoiceId,
  transactionId,
  billingPeriodStart,
  billingPeriodEnd,
  nextBillingDate,
  dashboardUrl,
}: PaymentConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Payment confirmation for your Gym Tuner Pro subscription</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Payment Confirmed ✅</Heading>
        
        <Text style={text}>
          Hi {userName},
        </Text>
        
        <Text style={text}>
          Thank you for your payment! Your Gym Tuner Pro subscription has been successfully renewed.
        </Text>

        <Section style={invoiceSection}>
          <Heading style={h2}>Payment Details</Heading>
          <Text style={detailItem}><strong>Amount Paid:</strong> {currency.toUpperCase()} {amount}</Text>
          <Text style={detailItem}><strong>Invoice ID:</strong> {invoiceId}</Text>
          <Text style={detailItem}><strong>Transaction ID:</strong> {transactionId}</Text>
          <Text style={detailItem}><strong>Billing Period:</strong> {billingPeriodStart} - {billingPeriodEnd}</Text>
          <Text style={detailItem}><strong>Next Billing Date:</strong> {nextBillingDate}</Text>
        </Section>

        <Text style={text}>
          Your subscription is now active and you have continued access to all Gym Tuner Pro features.
        </Text>

        <Link
          href={dashboardUrl}
          style={button}
        >
          Access Your Dashboard
        </Link>

        <Hr style={hr} />

        <Section style={footer}>
          <Text style={footerText}>
            <strong>Questions about your subscription?</strong>
          </Text>
          <Text style={footerText}>
            📧 Email: <Link href="mailto:contact@gymtuner.app" style={link}>contact@gymtuner.app</Link>
          </Text>
          <Text style={footerText}>
            💬 Reference your Invoice ID: <strong>{invoiceId}</strong>
          </Text>
          <Text style={footerText}>
            🌐 Manage subscription: <Link href={dashboardUrl} style={link}>Account Settings</Link>
          </Text>
        </Section>

        <Text style={disclaimer}>
          Keep this email for your records. You can download your invoice anytime from your account dashboard.
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

const invoiceSection = {
  padding: '24px 40px',
  margin: '32px 0',
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  border: '1px solid #bbf7d0',
};

const detailItem = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '12px 0',
};

const button = {
  backgroundColor: '#10b981',
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
  color: '#10b981',
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

export default PaymentConfirmationEmail;
