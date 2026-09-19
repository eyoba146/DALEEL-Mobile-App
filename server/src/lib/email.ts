import { prisma } from './prisma';
import { AdminRole } from '@prisma/client';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

function parseSender(fromStr?: string): { name: string; email: string } {
  if (!fromStr) {
    return { name: 'DALEEL App', email: 'eyobadamu146@gmail.com' };
  }
  const match = fromStr.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    return {
      name: match[1].replace(/["']/g, '').trim() || 'DALEEL App',
      email: match[2].trim(),
    };
  }
  return {
    name: 'DALEEL App',
    email: fromStr.replace(/["']/g, '').trim(),
  };
}

async function sendEmail(to: { email: string; name: string }, subject: string, htmlContent: string) {
  const apiKey = process.env.BREVO_API_KEY;
  const { name: senderName, email: senderEmail } = parseSender(process.env.EMAIL_FROM);

  if (!apiKey) {
    console.warn('[WARNING] BREVO_API_KEY is not set. Email will NOT be sent. (Check your .env file)');
    console.log(`[Email to ${to.email}]:\nSubject: ${subject}\nBody: ${htmlContent}`);
    return;
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [to],
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Failed to send email via Brevo API:', errorData);
    throw new Error('Failed to send email');
  }

  console.log(`[SUCCESS] Email successfully sent to ${to.email} via Brevo API (From: ${senderName} <${senderEmail}>)`);
}

/* ─── Verification email ─── */
export async function sendVerificationCode(email: string, name: string, code: string) {
  console.log(`\n======================================================`);
  console.log(`[AUTH] [DALEEL VERIFICATION CODE FOR ${email}]: ${code}`);
  console.log(`======================================================\n`);

  const subject = 'Verify your DALEEL account';
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 40px auto; padding: 0 20px; color: #0D0F1A;">
      <h1 style="font-size: 22px; font-weight: 700; color: #0E1C40; margin-bottom: 8px;">Verify your email</h1>
      <p style="font-size: 15px; color: #525F7F; margin-bottom: 32px;">Hi ${name}, enter the code below in the DALEEL app to verify your email address.</p>

      <div style="background: #F2F3F7; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px;">
        <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #0E1C40; font-family: monospace;">${code}</span>
      </div>

      <p style="font-size: 13px; color: #9BA6C0;">This code expires in <strong>10 minutes</strong>. If you didn't create an account on DALEEL, you can safely ignore this email.</p>
    </div>
  `;
  await sendEmail({ email, name }, subject, htmlContent);
}

/* ─── Password reset email ─── */
export async function sendPasswordReset(email: string, name: string, code: string) {
  console.log(`\n======================================================`);
  console.log(`[AUTH] [DALEEL PASSWORD RESET CODE FOR ${email}]: ${code}`);
  console.log(`======================================================\n`);

  const subject = 'Reset your DALEEL password';
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 40px auto; padding: 0 20px; color: #0D0F1A;">
      <h1 style="font-size: 22px; font-weight: 700; color: #0E1C40; margin-bottom: 8px;">Reset your password</h1>
      <p style="font-size: 15px; color: #525F7F; margin-bottom: 32px;">Hi ${name}, use the code below to set a new password for your DALEEL account.</p>

      <div style="background: #F2F3F7; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px;">
        <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #0E1C40; font-family: monospace;">${code}</span>
      </div>

      <p style="font-size: 13px; color: #9BA6C0;">This code expires in <strong>15 minutes</strong>. If you didn't request this, ignore this email — your password won't change.</p>
    </div>
  `;
  await sendEmail({ email, name }, subject, htmlContent);
}

/* ─── New Email Change Verification email ─── */
export async function sendNewEmailVerificationCode(newEmail: string, name: string, code: string) {
  console.log(`\n======================================================`);
  console.log(`[AUTH] [DALEEL EMAIL CHANGE CODE FOR ${newEmail}]: ${code}`);
  console.log(`======================================================\n`);

  const subject = 'Verify your new DALEEL email address';
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 40px auto; padding: 0 20px; color: #0D0F1A;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #D4AF37; background: #0E1C40; padding: 4px 10px; border-radius: 6px;">DALEEL SECURITY</span>
      </div>
      <h1 style="font-size: 22px; font-weight: 700; color: #0E1C40; margin-bottom: 8px;">Confirm your new email address</h1>
      <p style="font-size: 15px; color: #525F7F; margin-bottom: 24px;">Hi ${name}, you recently requested to update your registered email address on DALEEL to <strong>${newEmail}</strong>.</p>

      <div style="background: #F4F6F9; border: 1px solid #E2E8F0; border-radius: 16px; padding: 28px; text-align: center; margin-bottom: 24px;">
        <p style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748B; margin-top: 0; margin-bottom: 8px;">Verification Code</p>
        <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #0E1C40; font-family: monospace;">${code}</span>
      </div>

      <p style="font-size: 13px; color: #64748B; line-height: 1.6;">Enter this 6-digit code in the DALEEL mobile app to verify and activate this email. This code expires in <strong>10 minutes</strong>. If you did not initiate this change, please ignore this email and your account email will remain unchanged.</p>
    </div>
  `;
  await sendEmail({ email: newEmail, name }, subject, htmlContent);
}

/* ─── Status Badge Color Helper ─── */
function getStatusBadgeStyle(status: string) {
  const s = status.toLowerCase();
  if (['confirmed', 'resolved', 'completed', 'dispatched', 'delivered', 'attended', 'approved'].includes(s)) {
    return 'background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0;';
  }
  if (['cancelled', 'declined', 'rejected'].includes(s)) {
    return 'background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA;';
  }
  if (['in_progress', 'processing', 'shipped', 'contacted', 'reviewing'].includes(s)) {
    return 'background: #EFF6FF; color: #1E40AF; border: 1px solid #BFDBFE;';
  }
  return 'background: #FFFBEB; color: #92400E; border: 1px solid #FDE68A;';
}

/* ─── Marketplace Order Status Email ─── */
export async function sendOrderStatusEmail(
  to: { email: string; name: string },
  productTitle: string,
  newStatus: string,
  quantity: number,
  notes?: string
) {
  const subject = `Order Update: ${productTitle} is now ${newStatus.toUpperCase()}`;
  const badgeStyle = getStatusBadgeStyle(newStatus);
  const formattedStatus = newStatus.replace(/_/g, ' ').toUpperCase();

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 30px auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 16px; background: #FFFFFF; color: #0F172A;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="font-size: 18px; font-weight: 800; color: #0E1C40; letter-spacing: 1px;">DALEEL <span style="color: #D4AF37;">•</span> MARKETPLACE</span>
        <span style="font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; ${badgeStyle}">
          ${formattedStatus}
        </span>
      </div>

      <h2 style="font-size: 20px; font-weight: 700; color: #0E1C40; margin-top: 0; margin-bottom: 8px;">Order Status Update</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 20px;">
        Dear ${to.name}, an update is available regarding your artisan marketplace order.
      </p>

      <div style="background: #F8FAFC; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="color: #64748B; padding: 6px 0;">Product:</td>
            <td style="font-weight: 600; color: #0F172A; text-align: right; padding: 6px 0;">${productTitle}</td>
          </tr>
          <tr>
            <td style="color: #64748B; padding: 6px 0;">Quantity:</td>
            <td style="font-weight: 600; color: #0F172A; text-align: right; padding: 6px 0;">${quantity} unit(s)</td>
          </tr>
          <tr>
            <td style="color: #64748B; padding: 6px 0;">Current Status:</td>
            <td style="font-weight: 700; text-align: right; padding: 6px 0;">
              <span style="display: inline-block; font-size: 11px; padding: 2px 10px; border-radius: 12px; ${badgeStyle}">${formattedStatus}</span>
            </td>
          </tr>
          ${notes ? `<tr><td style="color: #64748B; padding: 6px 0;">Notes:</td><td style="font-weight: 500; color: #0F172A; text-align: right; padding: 6px 0;">${notes}</td></tr>` : ''}
        </table>
      </div>

      <p style="font-size: 13px; color: #64748B; line-height: 1.5; margin-bottom: 0;">
        You can also track your inquiries and notifications anytime in the DALEEL mobile application.
      </p>
    </div>
  `;

  await sendEmail(to, subject, htmlContent).catch((err) => {
    console.error(`[EMAIL] Failed to send order status email to ${to.email}:`, err);
  });
}

/* ─── Service Inquiry Status Email ─── */
export async function sendServiceInquiryStatusEmail(
  to: { email: string; name: string },
  serviceName: string,
  newStatus: string,
  timeframe?: string
) {
  const subject = `Service Inquiry Update: ${serviceName} is now ${newStatus.toUpperCase()}`;
  const badgeStyle = getStatusBadgeStyle(newStatus);
  const formattedStatus = newStatus.replace(/_/g, ' ').toUpperCase();

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 30px auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 16px; background: #FFFFFF; color: #0F172A;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="font-size: 18px; font-weight: 800; color: #0E1C40; letter-spacing: 1px;">DALEEL <span style="color: #D4AF37;">•</span> SERVICES</span>
        <span style="font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; ${badgeStyle}">
          ${formattedStatus}
        </span>
      </div>

      <h2 style="font-size: 20px; font-weight: 700; color: #0E1C40; margin-top: 0; margin-bottom: 8px;">Service Inquiry Status Update</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 20px;">
        Dear ${to.name}, your concierge inquiry for <strong>${serviceName}</strong> has been updated.
      </p>

      <div style="background: #F8FAFC; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="color: #64748B; padding: 6px 0;">Service Partner:</td>
            <td style="font-weight: 600; color: #0F172A; text-align: right; padding: 6px 0;">${serviceName}</td>
          </tr>
          ${timeframe ? `<tr><td style="color: #64748B; padding: 6px 0;">Requested Timeframe:</td><td style="font-weight: 600; color: #0F172A; text-align: right; padding: 6px 0;">${timeframe}</td></tr>` : ''}
          <tr>
            <td style="color: #64748B; padding: 6px 0;">Current Status:</td>
            <td style="font-weight: 700; text-align: right; padding: 6px 0;">
              <span style="display: inline-block; font-size: 11px; padding: 2px 10px; border-radius: 12px; ${badgeStyle}">${formattedStatus}</span>
            </td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #64748B; line-height: 1.5; margin-bottom: 0;">
        Our team or verified partner may contact you shortly with further details. View complete status updates in the DALEEL app.
      </p>
    </div>
  `;

  await sendEmail(to, subject, htmlContent).catch((err) => {
    console.error(`[EMAIL] Failed to send service inquiry status email to ${to.email}:`, err);
  });
}

/* ─── Event RSVP Status Email ─── */
export async function sendEventRsvpStatusEmail(
  to: { email: string; name: string },
  eventTitle: string,
  newStatus: string,
  ticketsCount: number,
  eventDate?: string
) {
  const subject = `Event RSVP Update: ${eventTitle} is ${newStatus.toUpperCase()}`;
  const badgeStyle = getStatusBadgeStyle(newStatus);
  const formattedStatus = newStatus.replace(/_/g, ' ').toUpperCase();

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 30px auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 16px; background: #FFFFFF; color: #0F172A;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="font-size: 18px; font-weight: 800; color: #0E1C40; letter-spacing: 1px;">DALEEL <span style="color: #D4AF37;">•</span> EVENTS</span>
        <span style="font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; ${badgeStyle}">
          ${formattedStatus}
        </span>
      </div>

      <h2 style="font-size: 20px; font-weight: 700; color: #0E1C40; margin-top: 0; margin-bottom: 8px;">Event Reservation Update</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 20px;">
        Dear ${to.name}, your RSVP status for <strong>${eventTitle}</strong> has been updated.
      </p>

      <div style="background: #F8FAFC; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="color: #64748B; padding: 6px 0;">Event:</td>
            <td style="font-weight: 600; color: #0F172A; text-align: right; padding: 6px 0;">${eventTitle}</td>
          </tr>
          ${eventDate ? `<tr><td style="color: #64748B; padding: 6px 0;">Date:</td><td style="font-weight: 600; color: #0F172A; text-align: right; padding: 6px 0;">${eventDate}</td></tr>` : ''}
          <tr>
            <td style="color: #64748B; padding: 6px 0;">Reserved Pass(es):</td>
            <td style="font-weight: 600; color: #0F172A; text-align: right; padding: 6px 0;">${ticketsCount} ticket(s)</td>
          </tr>
          <tr>
            <td style="color: #64748B; padding: 6px 0;">Status:</td>
            <td style="font-weight: 700; text-align: right; padding: 6px 0;">
              <span style="display: inline-block; font-size: 11px; padding: 2px 10px; border-radius: 12px; ${badgeStyle}">${formattedStatus}</span>
            </td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #64748B; line-height: 1.5; margin-bottom: 0;">
        Present your confirmation or view details on the DALEEL mobile application.
      </p>
    </div>
  `;

  await sendEmail(to, subject, htmlContent).catch((err) => {
    console.error(`[EMAIL] Failed to send event RSVP status email to ${to.email}:`, err);
  });
}

/* ─── Investment Inquiry Status Email ─── */
export async function sendInvestmentInquiryStatusEmail(
  to: { email: string; name: string },
  opportunityTitle: string,
  newStatus: string,
  budget?: string
) {
  const subject = `Investment Prospectus Update: ${opportunityTitle} is ${newStatus.toUpperCase()}`;
  const badgeStyle = getStatusBadgeStyle(newStatus);
  const formattedStatus = newStatus.replace(/_/g, ' ').toUpperCase();

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 30px auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 16px; background: #FFFFFF; color: #0F172A;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="font-size: 18px; font-weight: 800; color: #0E1C40; letter-spacing: 1px;">DALEEL <span style="color: #D4AF37;">•</span> INVESTMENTS</span>
        <span style="font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; ${badgeStyle}">
          ${formattedStatus}
        </span>
      </div>

      <h2 style="font-size: 20px; font-weight: 700; color: #0E1C40; margin-top: 0; margin-bottom: 8px;">Prospectus Inquiry Update</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 20px;">
        Dear ${to.name}, your diaspora investment inquiry regarding <strong>${opportunityTitle}</strong> has been updated.
      </p>

      <div style="background: #F8FAFC; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="color: #64748B; padding: 6px 0;">Opportunity:</td>
            <td style="font-weight: 600; color: #0F172A; text-align: right; padding: 6px 0;">${opportunityTitle}</td>
          </tr>
          ${budget ? `<tr><td style="color: #64748B; padding: 6px 0;">Investment Range:</td><td style="font-weight: 600; color: #0F172A; text-align: right; padding: 6px 0;">${budget}</td></tr>` : ''}
          <tr>
            <td style="color: #64748B; padding: 6px 0;">Current Status:</td>
            <td style="font-weight: 700; text-align: right; padding: 6px 0;">
              <span style="display: inline-block; font-size: 11px; padding: 2px 10px; border-radius: 12px; ${badgeStyle}">${formattedStatus}</span>
            </td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #64748B; line-height: 1.5; margin-bottom: 0;">
        Our investment officers will follow up with additional prospectus details and syndicate briefings.
      </p>
    </div>
  `;

  await sendEmail(to, subject, htmlContent).catch((err) => {
    console.error(`[EMAIL] Failed to send investment inquiry status email to ${to.email}:`, err);
  });
}

/* ─── Coordinator New Inquiry Alert Email ─── */
export async function sendCoordinatorInquiryAlertEmail(params: {
  category: string;
  title: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  messageOrDetails: string;
  inquiryId: string;
  role: AdminRole;
}) {
  try {
    const coordinators = await prisma.user.findMany({
      where: {
        isAdmin: true,
        OR: [{ adminRole: params.role }, { adminRole: AdminRole.SUPER_ADMIN }],
      },
      select: { email: true, name: true, adminRole: true },
    });

    if (!coordinators.length) {
      console.log(`[EMAIL ALERT] No coordinator found for role ${params.role}.`);
      return;
    }

    const subject = `[Triage Alert] New ${params.category} submission: ${params.title}`;

    for (const coord of coordinators) {
      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 24px auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 16px; background: #FFFFFF; color: #0F172A;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 16px; margin-bottom: 20px;">
            <span style="font-size: 18px; font-weight: 800; color: #0E1C40; letter-spacing: 1px;">DALEEL <span style="color: #D4AF37;">•</span> TRIAGE DESK</span>
            <span style="font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; background: #FEF3C7; color: #92400E; text-transform: uppercase;">
              NEW SUBMISSION
            </span>
          </div>

          <h2 style="font-size: 18px; font-weight: 700; color: #0E1C40; margin-top: 0; margin-bottom: 8px;">Incoming Customer Request</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 20px;">
            Hello ${coord.name}, a customer has submitted a request requiring review by the ${params.category} department.
          </p>

          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="color: #64748B; padding: 6px 0; width: 140px;">Category:</td>
                <td style="font-weight: 600; color: #0F172A; padding: 6px 0;">${params.category}</td>
              </tr>
              <tr>
                <td style="color: #64748B; padding: 6px 0;">Listing / Item:</td>
                <td style="font-weight: 600; color: #0F172A; padding: 6px 0;">${params.title}</td>
              </tr>
              <tr>
                <td style="color: #64748B; padding: 6px 0;">Customer Name:</td>
                <td style="font-weight: 600; color: #0F172A; padding: 6px 0;">${params.customerName}</td>
              </tr>
              <tr>
                <td style="color: #64748B; padding: 6px 0;">Customer Email:</td>
                <td style="font-weight: 600; color: #0F172A; padding: 6px 0;"><a href="mailto:${params.customerEmail}" style="color: #0E1C40;">${params.customerEmail}</a></td>
              </tr>
              ${params.customerPhone ? `<tr><td style="color: #64748B; padding: 6px 0;">Customer Phone:</td><td style="font-weight: 600; color: #0F172A; padding: 6px 0;">${params.customerPhone}</td></tr>` : ''}
              <tr>
                <td style="color: #64748B; padding: 6px 0; vertical-align: top;">Notes / Message:</td>
                <td style="font-weight: 500; color: #334155; padding: 6px 0; line-height: 1.5;">${params.messageOrDetails}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #64748B; line-height: 1.5;">
            Log into the <strong>DALEEL Operations Portal</strong> to review this request and update its status.
          </p>
        </div>
      `;

      await sendEmail({ email: coord.email, name: coord.name }, subject, htmlContent).catch((err) => {
        console.error(`[EMAIL ALERT] Failed to alert coordinator ${coord.email}:`, err);
      });
    }
  } catch (error) {
    console.error('[EMAIL ALERT] Error dispatching coordinator alert email:', error);
  }
}
