import { createTransport } from 'nodemailer';
import { generateDigitalDeliveryEmailHTML,generateOrderConfirmationHTML } from './email-templates';

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
  const emailHtml = generateDigitalDeliveryEmailHTML({
    bookTitle,
    downloadUrl,
    expiresAt: expiresAt.toLocaleString(),
    orderReference,
  });

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
  const emailHtml = generateOrderConfirmationHTML(orderDetails);

  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to,
    subject: `Order Confirmation - #${orderDetails.orderReference}`,
    html: emailHtml,
  });
}
