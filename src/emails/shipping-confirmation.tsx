import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ShippingConfirmationEmailProps {
  orderReference: string;
  trackingUrl: string;
}

export default function ShippingConfirmationEmail({
  orderReference,
  trackingUrl,
}: ShippingConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order #{orderReference} has shipped!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your Order Has Shipped!</Heading>
          
          <Section style={section}>
            <Text style={text}>
              Great news! Your order #{orderReference} is on its way. You can track its progress using the button below.
            </Text>
            
            <Button style={button} href={trackingUrl}>
              Track Your Order
            </Button>
            
            <Text style={notice}>
              If you're having trouble with the button above, you can copy and paste this link into your browser:
              <br />
              <a href={trackingUrl} style={{ color: '#7c3aed', textDecoration: 'underline' }}>
                {trackingUrl}
              </a>
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={footer}>
              Thank you for shopping with us!
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const section = {
  padding: '24px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.25',
  margin: '16px 0',
  textAlign: 'center' as const,
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
};

const button = {
  backgroundColor: '#7c3aed',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
  margin: '32px 0',
};

const notice = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '24px',
  textAlign: 'center' as const,
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '40px 0',
};

const footer = {
  color: '#64748b',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
};
