import { createTransport } from 'nodemailer';
import { render } from '@react-email/render';
import DigitalDeliveryEmail from '@/emails/digital-delivery';
import OrderConfirmationEmail from '@/emails/order-confirmation';
import ShippingConfirmationEmail from '@/emails/shipping-confirmation';

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendDigitalDeliveryEmail({
  to,
  bookTitle,
  downloadUrl,
  expiresAt,
  orderReference,
}: {
  to: string;
  bookTitle: string;
  downloadUrl: string;
  expiresAt: Date;
  orderReference: string;
}) {
  const emailHtml = render(DigitalDeliveryEmail({
    bookTitle,
    downloadUrl,
    expiresAt: expiresAt.toLocaleString(),
    orderReference,
  }));

  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to,
    subject: `Your Digital Download for ${bookTitle}`,
    html: emailHtml,
  });
}

export async function sendOrderConfirmationEmail({
  to,
  orderDetails,
}: {
  to: string;
  orderDetails: {
    orderReference: string;
    items: Array<{
      title: string;
      format: 'digital' | 'physical';
      price: number;
    }>;
    total: number;
    shippingAddress?: string;
    estimatedDelivery?: string;
  };
}) {
  const emailHtml = render(OrderConfirmationEmail(orderDetails));

  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to,
    subject: `Order Confirmation - #${orderDetails.orderReference}`,
    html: emailHtml,
  });
}

export async function sendShippingConfirmationEmail({
    to,
    orderReference,
    trackingUrl,
}: {
    to: string;
    orderReference: string;
    trackingUrl: string;
}) {
    const emailHtml = render(ShippingConfirmationEmail({
        orderReference,
        trackingUrl,
    }));

    await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
        to,
        subject: `Your order #${orderReference} has shipped!`,
        html: emailHtml,
    });
}
