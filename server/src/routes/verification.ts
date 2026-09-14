import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { sendVerificationCode } from '../lib/email';
import { requireAuth } from '../middleware/auth';

export const verificationRouter = Router();

// Helper to generate a 6-digit numeric code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function generateAndSendVerification(userId: string, email: string, name: string) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate any existing unused codes for this user
  await prisma.emailVerification.updateMany({
    where: { userId, used: false },
    data: { used: true },
  });

  await prisma.emailVerification.create({
    data: { userId, email, code, expiresAt },
  });

  await sendVerificationCode(email, name, code);
}

const sendVerificationSchema = z.object({
  email: z.string().email(),
});

// Optionally called explicitly if they need to send without auth context yet,
// but usually handled automatically on register. We'll secure it by requiring auth.
verificationRouter.post('/send-verification', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.isVerified) return res.status(400).json({ error: 'User is already verified' });

  // Rate limit: 75 seconds (1 min 15 sec) cooldown
  const latest = await prisma.emailVerification.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  if (latest) {
    const elapsedMs = Date.now() - latest.createdAt.getTime();
    const cooldownMs = 75 * 1000;
    if (elapsedMs < cooldownMs) {
      const remainingSec = Math.ceil((cooldownMs - elapsedMs) / 1000);
      return res.status(429).json({
        error: `Please wait ${remainingSec}s before requesting a new code.`,
        remainingSeconds: remainingSec,
      });
    }
  }

  await generateAndSendVerification(user.id, user.email, user.name);
  res.json({ message: 'Verification code sent' });
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

verificationRouter.post('/verify-email', async (req, res) => {
  const parsed = verifyEmailSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const { code } = parsed.data;
  const normalizedEmail = parsed.data.email.trim().toLowerCase();

  const verification = await prisma.emailVerification.findFirst({
    where: { email: normalizedEmail, code, used: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!verification) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }

  if (verification.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Verification code has expired' });
  }

  await prisma.$transaction([
    prisma.emailVerification.update({
      where: { id: verification.id },
      data: { used: true },
    }),
    prisma.user.update({
      where: { id: verification.userId },
      data: { isVerified: true },
    }),
  ]);

  res.json({ message: 'Email verified successfully' });
});

verificationRouter.post('/resend-verification', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.isVerified) return res.status(400).json({ error: 'User is already verified' });

  // Rate limit: 75 seconds (1 min 15 sec) cooldown
  const latest = await prisma.emailVerification.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  if (latest) {
    const elapsedMs = Date.now() - latest.createdAt.getTime();
    const cooldownMs = 75 * 1000;
    if (elapsedMs < cooldownMs) {
      const remainingSec = Math.ceil((cooldownMs - elapsedMs) / 1000);
      return res.status(429).json({
        error: `Please wait ${remainingSec}s before requesting another code.`,
        remainingSeconds: remainingSec,
      });
    }
  }

  await generateAndSendVerification(user.id, user.email, user.name);
  res.json({ message: 'Verification code resent' });
});

const changeEmailSchema = z.object({
  newEmail: z.string().email(),
});

verificationRouter.patch('/change-pending-email', requireAuth, async (req, res) => {
  const parsed = changeEmailSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid email' });
  const normalizedEmail = parsed.data.newEmail.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.isVerified) return res.status(400).json({ error: 'User is already verified' });

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing && existing.id !== user.id) return res.status(409).json({ error: 'Email already in use' });

  await prisma.user.update({
    where: { id: user.id },
    data: { email: normalizedEmail },
  });

  await generateAndSendVerification(user.id, normalizedEmail, user.name);
  res.json({ message: 'Email updated and verification code sent', email: normalizedEmail });
});

