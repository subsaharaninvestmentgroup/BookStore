import {
  Body,
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

interface OrderConfirmationEmailProps {
  orderReference: string;
  items: Array<{
    title: string;
    format: 'digital' | 'physical';
    price: number;
  }>;
  total: number;
  shippingAddress?: string;
  estimatedDelivery?: string;
}

export default function OrderConfirmationEmail({
  orderReference,
  items,
  total,
  shippingAddress,
  estimatedDelivery,
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Order Confirmation - #{orderReference}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Order Confirmation</Heading>
          
          <Section style={section}>
            <Text style={text}>
              Thank you for your order! Your order reference number is #{orderReference}.
            </Text>
            
            <Section style={orderDetails}>
              <Heading style={h2}>Order Details</Heading>
              {items.map((item, index) => (
                <div key={index} style={itemStyle}>
                  <Text style={itemTitle}>
                    {item.title} ({item.format})
                  </Text>
                  <Text style={itemPrice}>
                    ${item.price.toFixed(2)}
                  </Text>
                </div>
              ))}
              <Hr style={hr} />
              <div style={totalStyle}>
                <Text style={totalText}>Total</Text>
                <Text style={totalAmount}>${total.toFixed(2)}</Text>
              </div>
            </Section>

            {shippingAddress && (
              <Section style={shippingSection}>
                <Heading style={h2}>Shipping Information</Heading>
                <Text style={text}>{shippingAddress}</Text>
                {estimatedDelivery && (
                  <Text style={text}>
                    Estimated delivery: {estimatedDelivery}
                  </Text>
                )}
              </Section>
            )}
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={footer}>
              If you have any questions about your order, please contact our support team.
              <br />
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

const h2 = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '1.25',
  margin: '16px 0',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
};

const orderDetails = {
  backgroundColor: '#f9fafb',
  padding: '24px',
  borderRadius: '8px',
  margin: '24px 0',
};

const itemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  margin: '8px 0',
};

const itemTitle = {
  color: '#374151',
  fontSize: '16px',
  margin: '0',
};

const itemPrice = {
  color: '#374151',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
};

const totalStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '16px',
};

const totalText = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0',
};

const totalAmount = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0',
};

const shippingSection = {
  marginTop: '32px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const footer = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '24px',
  textAlign: 'center' as const,
};
