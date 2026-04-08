import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/* ───────── Transport Setup ───────── */
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

/* Routing: SALES_EMAIL = orders, contact form, services waitlist, status changes, etc.
   ENQUIRY_EMAIL = partnership / vendor form only (sendPartnershipInquiryEmail). */
const SALES_EMAIL = process.env.SALES_EMAIL || 'sales@bananthimane.com';
const ENQUIRY_EMAIL = process.env.ENQUIRY_EMAIL || 'enquiry@bananthimane.com';

let transporter = null;

if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  transporter.verify()
    .then(() => console.log('✅ Email transporter ready'))
    .catch((err) => console.warn('⚠️  Email transporter verification failed:', err.message));
} else {
  console.warn('⚠️  SMTP credentials not configured — emails will be logged to console only.');
}

/* ───────── Shared Styles ───────── */
const BRAND = {
  green: '#A2B096',
  cream: '#FAF7F2',
  brown: '#8B5E3C',
  charcoal: '#2C2C2C',
  white: '#FFFFFF',
};

const baseTemplate = (title, bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.cream};font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};padding:24px 12px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:${BRAND.white};border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <!-- Header -->
  <tr><td style="background:${BRAND.green};padding:28px 32px;text-align:center;">
    <h1 style="color:${BRAND.white};margin:0;font-size:22px;font-weight:700;letter-spacing:0.5px;">🌿 Bananthi Mane</h1>
    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">${title}</p>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:32px;">
    ${bodyContent}
  </td></tr>
  <!-- Footer -->
  <tr><td style="background:#f5f2ed;padding:20px 32px;text-align:center;border-top:1px solid #e8e4de;">
    <p style="margin:0;font-size:12px;color:#999;">© ${new Date().getFullYear()} Bananthi Mane — Empowering wellness through nature's gifts</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

/* ───────── Send helper ───────── */
async function sendEmail({ to, subject, html }) {
  if (!transporter) {
    console.log(`📧 [EMAIL LOG] To: ${to} | Subject: ${subject}`);
    console.log(html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').slice(0, 500));
    return { logged: true };
  }
  try {
    const info = await transporter.sendMail({
      from: `"Bananthi Mane" <${SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent: ${info.messageId} → ${to}`);
    return info;
  } catch (err) {
    console.error(`❌ Email failed: ${err.message}`);
    return { error: err.message };
  }
}

/* ═══════════════════════════════════
   1. ORDER CONFIRMATION — sales@
   ═══════════════════════════════════ */
export async function sendOrderConfirmationEmail(order) {
  const items = order.items || order.orderItems || [];
  const addr = order.shippingAddress || {};

  const itemsHtml = items.map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${i.name}${i.unitLabel ? ` <small style="color:#999;">(${i.unitLabel})</small>` : ''}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">₹${(i.price * i.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const customerName = order.user?.name || order.guestName || 'Guest';
  const customerEmail = order.user?.email || order.guestEmail || '—';
  const customerPhone = order.user?.phone || order.guestPhone || '—';

  const body = `
    <h2 style="color:${BRAND.charcoal};margin:0 0 4px;font-size:20px;">🛒 New Order Received</h2>
    <p style="color:#777;margin:0 0 20px;font-size:14px;">Order ID: <code style="background:#f0f0f0;padding:2px 8px;border-radius:4px;">${order.id || order._id}</code></p>

    <table style="width:100%;font-size:14px;margin-bottom:20px;">
      <tr><td style="color:#777;padding:4px 0;">Customer</td><td style="font-weight:600;">${customerName}</td></tr>
      <tr><td style="color:#777;padding:4px 0;">Email</td><td>${customerEmail}</td></tr>
      <tr><td style="color:#777;padding:4px 0;">Phone</td><td>${customerPhone}</td></tr>
      <tr><td style="color:#777;padding:4px 0;">Payment</td><td>${order.paymentMethod || 'COD'} — ${order.paymentStatus || 'Pending'}</td></tr>
    </table>

    ${addr.address ? `
    <div style="background:${BRAND.cream};padding:14px 18px;border-radius:8px;margin-bottom:20px;font-size:14px;">
      <strong style="color:${BRAND.brown};">📦 Shipping Address</strong><br>
      ${addr.name || ''}<br>${addr.address}<br>${addr.city}, ${addr.state} — ${addr.pincode}<br>📞 ${addr.phone || ''}
    </div>` : ''}

    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead><tr style="background:${BRAND.cream};">
        <th style="padding:10px 12px;text-align:left;">Item</th>
        <th style="padding:10px 12px;text-align:center;">Qty</th>
        <th style="padding:10px 12px;text-align:right;">Amount</th>
      </tr></thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        ${order.subtotalPrice != null ? `<tr style="background:${BRAND.cream};">
          <td colspan="2" style="padding:8px 12px;font-size:13px;color:#777;">Subtotal</td>
          <td style="padding:8px 12px;text-align:right;font-size:13px;color:#777;">₹${Number(order.subtotalPrice).toFixed(2)}</td>
        </tr>
        <tr style="background:${BRAND.cream};">
          <td colspan="2" style="padding:8px 12px;font-size:13px;color:#777;">GST (5%)</td>
          <td style="padding:8px 12px;text-align:right;font-size:13px;color:#777;">₹${Number(order.gstAmount).toFixed(2)}</td>
        </tr>` : ''}
        <tr style="background:${BRAND.cream};font-weight:700;">
          <td colspan="2" style="padding:12px;">Total</td>
          <td style="padding:12px;text-align:right;font-size:16px;">₹${Number(order.totalPrice).toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>
  `;

  return sendEmail({
    to: SALES_EMAIL,
    subject: `🛒 New Order #${(order.id || order._id || '').slice(-8).toUpperCase()} — ₹${Number(order.totalPrice).toFixed(2)}`,
    html: baseTemplate('New Order Notification', body),
  });
}

/* ═══════════════════════════════════
   2. CONTACT FORM — sales@
   ═══════════════════════════════════ */
export async function sendContactFormEmail({ name, email, phone, message }) {
  const body = `
    <h2 style="color:${BRAND.charcoal};margin:0 0 16px;font-size:20px;">📩 New Contact Form Message</h2>
    <table style="width:100%;font-size:14px;margin-bottom:20px;">
      <tr><td style="color:#777;padding:6px 0;width:100px;">Name</td><td style="font-weight:600;">${name}</td></tr>
      <tr><td style="color:#777;padding:6px 0;">Email</td><td><a href="mailto:${email}" style="color:${BRAND.green};">${email}</a></td></tr>
      ${phone ? `<tr><td style="color:#777;padding:6px 0;">Phone</td><td>${phone}</td></tr>` : ''}
    </table>
    <div style="background:${BRAND.cream};padding:18px;border-radius:8px;border-left:4px solid ${BRAND.green};font-size:14px;line-height:1.7;color:#444;">
      ${message.replace(/\n/g, '<br>')}
    </div>
  `;

  return sendEmail({
    to: SALES_EMAIL,
    subject: `📩 Contact Form — ${name}`,
    html: baseTemplate('Contact Form Submission', body),
  });
}

/* ═══════════════════════════════════
   3. POSTPARTUM SERVICE REGISTRATION — sales@
   ═══════════════════════════════════ */
export async function sendPostpartumServiceEmail({ firstName, lastName, email, dueDate, interest }) {
  const body = `
    <h2 style="color:${BRAND.charcoal};margin:0 0 16px;font-size:20px;">🤰 New Postpartum Service Registration</h2>
    <table style="width:100%;font-size:14px;margin-bottom:20px;">
      <tr><td style="color:#777;padding:6px 0;width:120px;">Name</td><td style="font-weight:600;">${firstName} ${lastName}</td></tr>
      <tr><td style="color:#777;padding:6px 0;">Email</td><td><a href="mailto:${email}" style="color:${BRAND.green};">${email}</a></td></tr>
      ${dueDate ? `<tr><td style="color:#777;padding:6px 0;">Due Date</td><td>${dueDate}</td></tr>` : ''}
    </table>
    ${interest ? `
    <div style="background:${BRAND.cream};padding:18px;border-radius:8px;border-left:4px solid ${BRAND.brown};font-size:14px;line-height:1.7;color:#444;">
      <strong>Areas of Interest:</strong><br>${interest.replace(/\n/g, '<br>')}
    </div>` : ''}
  `;

  return sendEmail({
    to: SALES_EMAIL,
    subject: `🤰 Service Registration — ${firstName} ${lastName}`,
    html: baseTemplate('Postpartum Service Registration', body),
  });
}

/* ═══════════════════════════════════
   4. PARTNERSHIP INQUIRY — enquiry@
   ═══════════════════════════════════ */
export async function sendPartnershipInquiryEmail({ companyName, contactPerson, email, phone, productCategories, message, website }) {
  const body = `
    <h2 style="color:${BRAND.charcoal};margin:0 0 16px;font-size:20px;">🤝 New Partnership Inquiry</h2>
    <table style="width:100%;font-size:14px;margin-bottom:20px;">
      <tr><td style="color:#777;padding:6px 0;width:140px;">Company / Brand</td><td style="font-weight:600;">${companyName}</td></tr>
      <tr><td style="color:#777;padding:6px 0;">Contact Person</td><td>${contactPerson}</td></tr>
      <tr><td style="color:#777;padding:6px 0;">Email</td><td><a href="mailto:${email}" style="color:${BRAND.green};">${email}</a></td></tr>
      <tr><td style="color:#777;padding:6px 0;">Phone</td><td>${phone}</td></tr>
      ${productCategories ? `<tr><td style="color:#777;padding:6px 0;">Categories</td><td>${productCategories}</td></tr>` : ''}
      ${website ? `<tr><td style="color:#777;padding:6px 0;">Website</td><td><a href="${website}" style="color:${BRAND.green};" target="_blank">${website}</a></td></tr>` : ''}
    </table>
    <div style="background:${BRAND.cream};padding:18px;border-radius:8px;border-left:4px solid ${BRAND.green};font-size:14px;line-height:1.7;color:#444;">
      <strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}
    </div>
  `;

  return sendEmail({
    to: ENQUIRY_EMAIL,
    subject: `🤝 Partnership Inquiry — ${companyName}`,
    html: baseTemplate('Partnership Inquiry', body),
  });
}

/* ═══════════════════════════════════
   5. ORDER STATUS CHANGE — sales@
   ═══════════════════════════════════ */
export async function sendOrderStatusChangeEmail(order, newStatus) {
  const statusColors = {
    Processing: '#3498db',
    Packed: '#f39c12',
    Shipped: '#9b59b6',
    'Out for Delivery': '#e67e22',
    Delivered: '#27ae60',
    Cancelled: '#e74c3c',
    Failed: '#e74c3c',
    Stuck: '#e74c3c',
  };
  const color = statusColors[newStatus] || BRAND.green;
  const customerName = order.user?.name || order.guestName || 'Guest';

  const body = `
    <h2 style="color:${BRAND.charcoal};margin:0 0 16px;font-size:20px;">📋 Order Status Updated</h2>
    <div style="text-align:center;margin:20px 0;">
      <span style="display:inline-block;background:${color};color:#fff;padding:10px 28px;border-radius:24px;font-size:16px;font-weight:700;letter-spacing:0.5px;">${newStatus}</span>
    </div>
    <table style="width:100%;font-size:14px;">
      <tr><td style="color:#777;padding:6px 0;">Order ID</td><td><code style="background:#f0f0f0;padding:2px 8px;border-radius:4px;">${order.id || order._id}</code></td></tr>
      <tr><td style="color:#777;padding:6px 0;">Customer</td><td>${customerName}</td></tr>
      <tr><td style="color:#777;padding:6px 0;">Total</td><td style="font-weight:600;">₹${Number(order.totalPrice).toFixed(2)}</td></tr>
    </table>
  `;

  return sendEmail({
    to: SALES_EMAIL,
    subject: `📋 Order #${(order.id || order._id || '').slice(-8).toUpperCase()} → ${newStatus}`,
    html: baseTemplate('Order Status Update', body),
  });
}

/* ═══════════════════════════════════
   6. LOW STOCK ALERT — sales@
   ═══════════════════════════════════ */
export async function sendLowStockAlertEmail(productName, variantLabel, currentStock) {
  const body = `
    <h2 style="color:${BRAND.charcoal};margin:0 0 16px;font-size:20px;">⚠️ Low Stock Alert</h2>
    <div style="background:#fff3e0;border:1px solid #ffe0b2;border-radius:8px;padding:20px;text-align:center;margin:16px 0;">
      <p style="margin:0;font-size:18px;font-weight:700;color:#e65100;">${productName}${variantLabel ? ` — ${variantLabel}` : ''}</p>
      <p style="margin:8px 0 0;font-size:32px;font-weight:700;color:#bf360c;">${currentStock} left</p>
    </div>
    <p style="text-align:center;color:#777;font-size:14px;">Please restock this item soon to avoid missing orders.</p>
  `;

  return sendEmail({
    to: SALES_EMAIL,
    subject: `⚠️ Low Stock: ${productName}${variantLabel ? ` (${variantLabel})` : ''} — ${currentStock} remaining`,
    html: baseTemplate('Low Stock Alert', body),
  });
}

/* ═══════════════════════════════════
   7. NEW USER REGISTRATION — sales@
   ═══════════════════════════════════ */
export async function sendNewUserRegistrationEmail({ name, email, phone }) {
  const body = `
    <h2 style="color:${BRAND.charcoal};margin:0 0 16px;font-size:20px;">👤 New User Registered</h2>
    <div style="background:${BRAND.cream};padding:20px;border-radius:8px;border-left:4px solid ${BRAND.green};margin-bottom:16px;">
      <table style="width:100%;font-size:14px;">
        <tr><td style="color:#777;padding:6px 0;width:80px;">Name</td><td style="font-weight:600;">${name}</td></tr>
        <tr><td style="color:#777;padding:6px 0;">Email</td><td><a href="mailto:${email}" style="color:${BRAND.green};">${email}</a></td></tr>
        ${phone ? `<tr><td style="color:#777;padding:6px 0;">Phone</td><td>${phone}</td></tr>` : ''}
      </table>
    </div>
    <p style="color:#777;font-size:13px;margin:0;">Your customer community is growing! 🌱</p>
  `;

  return sendEmail({
    to: SALES_EMAIL,
    subject: `👤 New User — ${name}`,
    html: baseTemplate('New User Registration', body),
  });
}

/* ═══════════════════════════════════
   8. PASSWORD RESET LINK — customer
   ═══════════════════════════════════ */
export async function sendPasswordResetEmail({ email, name, resetUrl }) {
  const body = `
    <h2 style="color:${BRAND.charcoal};margin:0 0 8px;font-size:20px;">🔐 Password Reset Request</h2>
    <p style="color:#555;font-size:14px;line-height:1.6;margin-bottom:24px;">
      Hi ${name || 'there'},<br>
      We received a request to reset the password for your Bananthi Mane account. Click the button below to set a new password.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:${BRAND.green};color:#fff;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.5px;">
        Reset My Password
      </a>
    </div>
    <p style="color:#999;font-size:12px;line-height:1.6;">
      If you didn't request this, you can safely ignore this email. The link expires in 1 hour.<br>
      Or copy this URL: <a href="${resetUrl}" style="color:${BRAND.green};word-break:break-all;">${resetUrl}</a>
    </p>
  `;

  return sendEmail({
    to: email,
    subject: '🔐 Reset Your Bananthi Mane Password',
    html: baseTemplate('Password Reset', body),
  });
}

/* ═══════════════════════════════════
   9. ORDER CONFIRMATION — customer
   ═══════════════════════════════════ */
export async function sendCustomerOrderConfirmationEmail(order) {
  const items = order.items || order.orderItems || [];
  const addr = order.shippingAddress || {};
  const customerName = order.user?.name || order.guestName || 'Customer';
  const customerEmail = order.user?.email || order.guestEmail;
  if (!customerEmail) return; // no email to send to

  const itemsHtml = items.map(i => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;">${i.name}${i.unitLabel ? ` <small style="color:#999;">(${i.unitLabel})</small>` : ''}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;">₹${(i.price * i.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const body = `
    <h2 style="color:${BRAND.charcoal};margin:0 0 8px;font-size:20px;">Thank You for Your Order! 🌿</h2>
    <p style="color:#555;font-size:14px;line-height:1.6;margin-bottom:4px;">
      Hi ${customerName}, your order has been placed successfully.
    </p>
    <p style="color:#777;margin:0 0 24px;font-size:13px;">Order ID: <code style="background:#f0f0f0;padding:2px 8px;border-radius:4px;">${order.id || order._id}</code></p>

    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead><tr style="background:${BRAND.cream};">
        <th style="padding:10px 12px;text-align:left;">Item</th>
        <th style="padding:10px 12px;text-align:center;">Qty</th>
        <th style="padding:10px 12px;text-align:right;">Amount</th>
      </tr></thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        ${order.subtotalPrice != null ? `<tr style="background:${BRAND.cream};">
          <td colspan="2" style="padding:8px 12px;font-size:13px;color:#777;">Subtotal</td>
          <td style="padding:8px 12px;text-align:right;font-size:13px;color:#777;">₹${Number(order.subtotalPrice).toFixed(2)}</td>
        </tr>
        <tr style="background:${BRAND.cream};">
          <td colspan="2" style="padding:8px 12px;font-size:13px;color:#777;">GST (5%)</td>
          <td style="padding:8px 12px;text-align:right;font-size:13px;color:#777;">₹${Number(order.gstAmount).toFixed(2)}</td>
        </tr>` : ''}
        <tr style="background:${BRAND.cream};font-weight:700;">
          <td colspan="2" style="padding:12px;">Total</td>
          <td style="padding:12px;text-align:right;font-size:16px;">₹${Number(order.totalPrice).toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    ${addr.address ? `
    <div style="background:${BRAND.cream};padding:16px 18px;border-radius:8px;margin-top:20px;font-size:14px;">
      <strong style="color:${BRAND.brown};">📦 Delivering to</strong><br>
      ${addr.name || customerName}<br>${addr.address}<br>${addr.city}, ${addr.state} — ${addr.pincode}
    </div>` : ''}

    <p style="color:#555;font-size:14px;margin-top:24px;line-height:1.6;">
      Payment: <strong>${order.paymentMethod || 'COD'}</strong> — ${order.isPaid ? 'Paid ✅' : 'Pay on delivery'}<br>
      We'll keep you updated as your order progresses.
    </p>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `✅ Order Confirmed — #${(order.id || order._id || '').slice(-8).toUpperCase()}`,
    html: baseTemplate('Order Confirmation', body),
  });
}

/* ═══════════════════════════════════
   10. SHIPPING UPDATE — customer
   ═══════════════════════════════════ */
export async function sendCustomerShippingUpdateEmail(order, newStatus) {
  const customerEmail = order.user?.email || order.guestEmail;
  if (!customerEmail) return;
  const customerName = order.user?.name || order.guestName || 'Customer';

  const statusMessages = {
    Packed: 'Your order has been packed and is being prepared for shipment! 📦',
    Shipped: 'Great news — your order is on its way! 🚚',
    'Out for Delivery': 'Your order is out for delivery and will arrive soon! 🏠',
    Delivered: 'Your order has been delivered! We hope you love it. 💚',
    Cancelled: 'Your order has been cancelled. If this was unexpected, please contact us.',
  };

  const statusColors = {
    Packed: '#f39c12',
    Shipped: '#9b59b6',
    'Out for Delivery': '#e67e22',
    Delivered: '#27ae60',
    Cancelled: '#e74c3c',
  };

  const msg = statusMessages[newStatus] || `Your order status has been updated to: ${newStatus}`;
  const color = statusColors[newStatus] || BRAND.green;

  const body = `
    <h2 style="color:${BRAND.charcoal};margin:0 0 8px;font-size:20px;">Order Update</h2>
    <p style="color:#555;font-size:14px;margin-bottom:20px;">Hi ${customerName},</p>

    <div style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;background:${color};color:#fff;padding:12px 32px;border-radius:24px;font-size:16px;font-weight:700;">${newStatus}</span>
    </div>
    <p style="text-align:center;color:#555;font-size:14px;margin-bottom:20px;">${msg}</p>

    <div style="background:${BRAND.cream};padding:16px;border-radius:8px;font-size:14px;">
      <table style="width:100%;">
        <tr><td style="color:#777;padding:4px 0;">Order ID</td><td><code style="background:#f0f0f0;padding:2px 8px;border-radius:4px;">${order.id || order._id}</code></td></tr>
        <tr><td style="color:#777;padding:4px 0;">Total</td><td style="font-weight:600;">₹${Number(order.totalPrice).toFixed(2)}</td></tr>
        ${order.awbCode ? `<tr><td style="color:#777;padding:4px 0;">Tracking</td><td style="font-weight:600;">${order.awbCode}${order.courierName ? ` (${order.courierName})` : ''}</td></tr>` : ''}
      </table>
    </div>

    <p style="color:#999;font-size:13px;margin-top:20px;text-align:center;">
      Track your order anytime at <a href="${process.env.CLIENT_URL || 'https://www.bananthimane.com'}/track-order" style="color:${BRAND.green};">bananthimane.com/track-order</a>
    </p>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `📦 Order #${(order.id || order._id || '').slice(-8).toUpperCase()} — ${newStatus}`,
    html: baseTemplate('Shipping Update', body),
  });
}

/* ═══════════════════════════════════
   11. DAILY ORDER SUMMARY DIGEST — sales@
   ═══════════════════════════════════ */
export async function sendDailyOrderDigestEmail({ date, totalOrders, totalRevenue, orders }) {
  const ordersHtml = orders.slice(0, 20).map(o => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;"><code>${(o.id || '').slice(-8).toUpperCase()}</code></td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;">${o.user?.name || o.guestName || 'Guest'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:center;">${o.fulfillmentStatus}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right;">₹${Number(o.totalPrice).toFixed(2)}</td>
    </tr>
  `).join('');

  const body = `
    <h2 style="color:${BRAND.charcoal};margin:0 0 16px;font-size:20px;">📊 Daily Order Summary</h2>
    <p style="color:#777;font-size:14px;margin-bottom:24px;">${date}</p>

    <div style="display:flex;gap:16px;margin-bottom:24px;">
      <div style="flex:1;background:${BRAND.cream};padding:20px;border-radius:8px;text-align:center;">
        <p style="margin:0;font-size:28px;font-weight:700;color:${BRAND.charcoal};">${totalOrders}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Orders</p>
      </div>
      <div style="flex:1;background:${BRAND.cream};padding:20px;border-radius:8px;text-align:center;">
        <p style="margin:0;font-size:28px;font-weight:700;color:${BRAND.green};">₹${Number(totalRevenue).toFixed(2)}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">Revenue</p>
      </div>
    </div>

    ${totalOrders > 0 ? `
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead><tr style="background:${BRAND.cream};">
        <th style="padding:10px 12px;text-align:left;">Order</th>
        <th style="padding:10px 12px;text-align:left;">Customer</th>
        <th style="padding:10px 12px;text-align:center;">Status</th>
        <th style="padding:10px 12px;text-align:right;">Amount</th>
      </tr></thead>
      <tbody>${ordersHtml}</tbody>
    </table>
    ${orders.length > 20 ? `<p style="color:#999;font-size:12px;margin-top:8px;">…and ${orders.length - 20} more orders</p>` : ''}
    ` : '<p style="text-align:center;color:#999;font-size:14px;">No orders received today.</p>'}
  `;

  return sendEmail({
    to: SALES_EMAIL,
    subject: `📊 Daily Summary — ${date}: ${totalOrders} orders, ₹${Number(totalRevenue).toFixed(2)}`,
    html: baseTemplate('Daily Order Summary', body),
  });
}
