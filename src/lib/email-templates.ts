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
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Your Digital Download is Ready</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.5;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 32px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #7c3aed;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 24px 0;
          }
          .footer {
            color: #666;
            font-size: 14px;
            margin-top: 32px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Your Digital Download is Ready</h1>
          <p>Thank you for purchasing ${bookTitle}! Your digital download is now ready.</p>
          <p>Click the button below to download your book. For security reasons, this link will expire on ${expiresAt}.</p>
          <a href="${downloadUrl}" class="button">Download Now</a>
          <p style="font-size: 14px; color: #666;">
            If you're having trouble with the button above, you can copy and paste this link into your browser:<br>
            <a href="${downloadUrl}">${downloadUrl}</a>
          </p>
          <div class="footer">
            Order Reference: ${orderReference}<br>
            If you need help, please contact our support team.
          </div>
        </div>
      </body>
    </html>
  `;
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
  const itemsList = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 0;">${item.title} (${item.format})</td>
          <td style="text-align: right; padding: 12px 0;">$${item.price.toFixed(2)}</td>
        </tr>
      `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation - #${orderReference}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.5;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 32px;
          }
          .order-details {
            background-color: #f9fafb;
            border-radius: 6px;
            padding: 24px;
            margin: 24px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          .total-row {
            border-top: 1px solid #e5e7eb;
            font-weight: 600;
          }
          .footer {
            color: #666;
            font-size: 14px;
            margin-top: 32px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Order Confirmation</h1>
          <p>Thank you for your order! Your order reference number is #${orderReference}.</p>
          
          <div class="order-details">
            <h2>Order Details</h2>
            <table>
              ${itemsList}
              <tr class="total-row">
                <td style="padding: 12px 0;">Total</td>
                <td style="text-align: right; padding: 12px 0;">$${total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          ${
            shippingAddress
              ? `
            <div style="margin-top: 24px;">
              <h2>Shipping Information</h2>
              <p>${shippingAddress}</p>
              ${
                estimatedDelivery
                  ? `<p>Estimated delivery: ${estimatedDelivery}</p>`
                  : ''
              }
            </div>
          `
              : ''
          }

          <div class="footer">
            If you have any questions about your order, please contact our support team.<br>
            Thank you for shopping with us!
          </div>
        </div>
      </body>
    </html>
  `;
}
