
import { createTransport } from 'nodemailer';
import { render } from '@react-email/render';
import DigitalDeliveryEmail from '@/emails/digital-delivery';
import OrderConfirmationEmail from '@/emails/order-confirmation';
import ShippingConfirmationEmail from '@/emails/shipping-confirmation';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function getCompanyEmail(): Promise<string | null> {
    try {
        const settingsRef = doc(db, 'storeSettings', 'main');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists() && settingsSnap.data().companyEmail) {
            return settingsSnap.data().companyEmail;
        }
        return null;
    } catch (error) {
        console.error("Could not fetch company email setting:", error);
        return null;
    }
}

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
  const emailHtml = await render(DigitalDeliveryEmail({
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
  const emailHtml = await render(OrderConfirmationEmail(orderDetails));
  const companyEmail = await getCompanyEmail();

  const recipients = [to];
  if (companyEmail) {
      recipients.push(companyEmail);
  }

  const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: recipients.join(', '),
      subject: `Order Confirmation - #${orderDetails.orderReference}`,
      html: emailHtml,
  };

  await transporter.sendMail(mailOptions);
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
    const emailHtml = await render(ShippingConfirmationEmail({
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
