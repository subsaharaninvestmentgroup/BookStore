
import { render } from '@react-email/render';
import DigitalDeliveryEmail from '@/emails/digital-delivery';
import OrderConfirmationEmail from '@/emails/order-confirmation';
import ShippingConfirmationEmail from '@/emails/shipping-confirmation';

export function generateDigitalDeliveryEmailHTML({
  bookTitle,
  downloadUrl,
  expiresAt,
  orderReference,
}: {
  bookTitle: string;
  downloadUrl: string;
  expiresAt: string;
  orderReference: string;
}) {
  return render(DigitalDeliveryEmail({ bookTitle, downloadUrl, expiresAt, orderReference }));
}

export function generateOrderConfirmationHTML({
  orderReference,
  items,
  total,
  shippingAddress,
  estimatedDelivery,
}: {
  orderReference: string;
  items: Array<{
    title: string;
    format: 'digital' | 'physical';
    price: number;
  }>;
  total: number;
  shippingAddress?: string;
  estimatedDelivery?: string;
}) {
  return render(OrderConfirmationEmail({ orderReference, items, total, shippingAddress, estimatedDelivery }));
}

export function generateShippingConfirmationEmailHTML({
  orderReference,
  trackingUrl,
}: {
  orderReference: string;
  trackingUrl: string;
}) {
    return render(ShippingConfirmationEmail({ orderReference, trackingUrl }));
}
