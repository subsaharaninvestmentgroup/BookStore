import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface DigitalDeliveryEmailProps {
  bookTitle: string;
  downloadUrl: string;
  expiresAt: string;
  orderReference: string;
}

export default function DigitalDeliveryEmail({
  bookTitle,
  downloadUrl,
  expiresAt,
  orderReference,
}: DigitalDeliveryEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your digital download for {bookTitle} is ready</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your Digital Download is Ready</Heading>
          
          <Section style={section}>
            <Text style={text}>
              Thank you for purchasing {bookTitle}! Your digital download is now ready.
            </Text>
            
            <Text style={text}>
              Click the button below to download your book. For security reasons, this link will expire on {expiresAt}.
            </Text>

            <Button style={button} href={downloadUrl}>
              Download Now
            </Button>

            <Text style={notice}>
              If you're having trouble with the button above, you can copy and paste this link into your browser:
              <br />
              <Link href={downloadUrl} style={link}>
                {downloadUrl}
              </Link>
            </Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={footer}>
              Order Reference: {orderReference}
              <br />
              If you need help, please contact our support team.
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

const link = {
  color: '#7c3aed',
  textDecoration: 'underline',
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
