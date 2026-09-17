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
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 40px auto; padding: 0 20px; color: #0D0F1A;">
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
