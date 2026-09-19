import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, signToken } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { generateAndSendVerification } from './verification';
import { sendPasswordReset, sendNewEmailVerificationCode } from '../lib/email';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  userType: z.enum(['diaspora', 'foreign_resident']),
  country: z.string().min(2),
  language: z.enum(['en', 'am', 'om', 'ar']),
});

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  userType: string;
  country: string;
  language: string;
  isVerified: boolean;
  avatarUrl: string | null;
  savedAddress?: string | null;
  savedLatitude?: number | null;
  savedLongitude?: number | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || undefined,
    userType: user.userType,
    country: user.country,
    language: user.language,
    isVerified: user.isVerified,
    isActive: (user as any).isActive ?? true,
    avatarUrl: user.avatarUrl,
    savedAddress: user.savedAddress || undefined,
    savedLatitude: user.savedLatitude !== null ? user.savedLatitude : undefined,
    savedLongitude: user.savedLongitude !== null ? user.savedLongitude : undefined,
  };
}

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
  }
  const { name, email, password, userType, country, language } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email: normalizedEmail, passwordHash, userType, country, language, isVerified: false },
  });

  // Generate and send verification email before responding so it arrives immediately
  try {
    await generateAndSendVerification(user.id, user.email, user.name);
  } catch (err) {
    console.error('Failed to send verification email on register:', err);
  }

  const token = signToken({ userId: user.id });
  res.status(201).json({ user: toPublicUser(user), token });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Enter a valid email and password' });
  }
  const { email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }

  if (user.isActive === false) {
    return res.status(403).json({ error: 'Your account has been deactivated. Please contact support@daleel.et.' });
  }

  // If user is unverified, ensure a code was sent within the last 75 seconds
  if (!user.isVerified) {
    const recent = await prisma.emailVerification.findFirst({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - 75 * 1000) },
      },
    });
    if (!recent) {
      await generateAndSendVerification(user.id, user.email, user.name).catch(err => {
        console.error('Failed to send verification email on login:', err);
      });
    }
  }

  const token = signToken({ userId: user.id });
  res.json({ user: toPublicUser(user), token });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(toPublicUser(user));
});

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name is too short').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  userType: z.enum(['diaspora', 'foreign_resident']).optional(),
  country: z.string().min(2).optional(),
  language: z.enum(['en', 'am', 'om', 'ar']).optional(),
  savedAddress: z.string().nullable().optional(),
  savedLatitude: z.number().nullable().optional(),
  savedLongitude: z.number().nullable().optional(),
});

authRouter.patch('/profile', requireAuth, async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
  }

  try {
    const currentUser = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    // Enforce email change verification: direct unverified email mutations are rejected
    if (parsed.data.email && parsed.data.email.trim().toLowerCase() !== currentUser.email.toLowerCase()) {
      return res.status(400).json({
        error: 'Email changes require two-step verification. Please use the verification security flow.',
      });
    }

    // Omit email from general profile update so it cannot be mutated unverified
    const { email: _omittedEmail, ...profileUpdates } = parsed.data;

    const user = await prisma.user.update({
      where: { id: req.auth!.userId },
      data: profileUpdates,
    });
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    console.error('Failed to update profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

const requestEmailChangeSchema = z.object({
  newEmail: z.string().email('Please enter a valid email address'),
});

authRouter.post('/request-email-change', requireAuth, async (req, res) => {
  const parsed = requestEmailChangeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid email address' });
  }

  const normalizedEmail = parsed.data.newEmail.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.email.toLowerCase() === normalizedEmail) {
    return res.status(400).json({ error: 'New email address must be different from your current email' });
  }

  const existing = await prisma.user.findFirst({
    where: { email: normalizedEmail, NOT: { id: user.id } },
  });
  if (existing) {
    return res.status(409).json({ error: 'This email address is already in use by another account' });
  }

  // Rate limit: 75-second cooldown
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

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate previous unused codes for this user
  await prisma.emailVerification.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      email: normalizedEmail,
      code,
      expiresAt,
    },
  });

  await sendNewEmailVerificationCode(normalizedEmail, user.name, code).catch((err) => {
    console.error('Failed to send email change verification email:', err);
  });

  res.json({
    message: 'Verification code sent to your new email address',
    remainingSeconds: 75,
  });
});

const confirmEmailChangeSchema = z.object({
  newEmail: z.string().email(),
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

authRouter.post('/confirm-email-change', requireAuth, async (req, res) => {
  const parsed = confirmEmailChangeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid code or email' });
  }

  const { code } = parsed.data;
  const normalizedEmail = parsed.data.newEmail.trim().toLowerCase();
  const userId = req.auth!.userId;

  const verification = await prisma.emailVerification.findFirst({
    where: {
      userId,
      email: normalizedEmail,
      code,
      used: false,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!verification) {
    return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
  }

  if (verification.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
  }

  const existing = await prisma.user.findFirst({
    where: { email: normalizedEmail, NOT: { id: userId } },
  });
  if (existing) {
    return res.status(409).json({ error: 'This email address is now in use by another account' });
  }

  const [_, updatedUser] = await prisma.$transaction([
    prisma.emailVerification.update({
      where: { id: verification.id },
      data: { used: true },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { email: normalizedEmail, isVerified: true },
    }),
  ]);

  res.json({
    message: 'Email address verified and updated successfully',
    user: toPublicUser(updatedUser),
  });
});

const avatarUploadSchema = z.object({
  image: z.string().min(1, 'Image data is required'),
});

authRouter.post('/avatar-upload', requireAuth, async (req, res) => {
  const parsed = avatarUploadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid image data' });
  }

  const { image } = parsed.data;
  const userId = req.auth!.userId;
  console.log(`[Avatar Upload] Received upload request from user=${userId}, payloadSize=${image.length} chars`);
  let finalAvatarUrl: string | null = null;

  // 1. Attempt Cloudinary upload if configured / reachable
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'urbxorts';
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'sbjkanpm';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const payload = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
    const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        file: payload,
        upload_preset: uploadPreset,
        folder: 'daleel_avatars',
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (cloudRes.ok) {
      const data: any = await cloudRes.json();
      if (data?.secure_url) {
        finalAvatarUrl = data.secure_url;
      }
    }
  } catch (err: any) {
    console.log('[Avatar Upload] Cloudinary unreachable/timed out, saving locally on backend server:', err?.message);
  }

  // 2. Fallback to saving locally on backend server (uploads/avatars)
  if (!finalAvatarUrl) {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      let ext = 'jpg';
      let rawBase64 = image;
      if (image.startsWith('data:image/')) {
        const match = image.match(/^data:image\/(\w+);base64,(.+)$/);
        if (match) {
          ext = match[1] === 'jpeg' ? 'jpg' : match[1];
          rawBase64 = match[2];
        } else {
          rawBase64 = image.replace(/^data:image\/\w+;base64,/, '');
        }
      }

      const filename = `avatar-${userId}-${Date.now()}.${ext}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, Buffer.from(rawBase64, 'base64'));

      // Construct server URL from request host
      const host = req.get('host') || 'localhost:4000';
      const protocol = req.protocol || 'http';
      finalAvatarUrl = `${protocol}://${host}/uploads/avatars/${filename}`;
    } catch (saveErr) {
      console.error('[Avatar Upload] Failed to save file locally:', saveErr);
      return res.status(500).json({ error: 'Failed to save avatar image' });
    }
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: finalAvatarUrl },
    });

    res.json({
      user: toPublicUser(updatedUser),
      avatarUrl: finalAvatarUrl,
    });
  } catch (dbErr) {
    console.error('[Avatar Upload] Failed to update user database record:', dbErr);
    res.status(500).json({ error: 'Failed to update user avatar in database' });
  }
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

authRouter.post('/forgot-password', async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid email' });
  const normalizedEmail = parsed.data.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    // Return success even if user doesn't exist to prevent email enumeration
    return res.json({ message: 'If an account exists, a reset code was sent' });
  }

  // Rate limit: 75 seconds (1 min 15 sec) cooldown between reset codes
  const latest = await prisma.passwordReset.findFirst({
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
      });
    }
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  await prisma.passwordReset.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  await prisma.passwordReset.create({
    data: { userId: user.id, email: normalizedEmail, code, expiresAt },
  });

  await sendPasswordReset(normalizedEmail, user.name, code).catch(err => {
    console.error('Failed to send password reset email:', err);
  });

  res.json({ message: 'If an account exists, a reset code was sent' });
});

const verifyResetCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

authRouter.post('/verify-reset-code', async (req, res) => {
  const parsed = verifyResetCodeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter a valid 6-digit code' });
  const { code } = parsed.data;
  const normalizedEmail = parsed.data.email.trim().toLowerCase();

  const reset = await prisma.passwordReset.findFirst({
    where: { email: normalizedEmail, code, used: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!reset) {
    return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
  }

  if (reset.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Reset code has expired. Please request a new code.' });
  }

  res.json({ message: 'Code is valid' });
});

const resetPasswordSchema = z.object({

  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8),
});

authRouter.post('/reset-password', async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const { code, newPassword } = parsed.data;
  const normalizedEmail = parsed.data.email.trim().toLowerCase();

  const reset = await prisma.passwordReset.findFirst({
    where: { email: normalizedEmail, code, used: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!reset || reset.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired reset code' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.passwordReset.update({
      where: { id: reset.id },
      data: { used: true },
    }),
    prisma.user.update({
      where: { id: reset.userId },
      data: { passwordHash },
    }),
  ]);

  res.json({ message: 'Password has been successfully reset' });
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

authRouter.post('/change-password', requireAuth, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
  }

  const { currentPassword, newPassword } = parsed.data;
  const userId = req.auth!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  res.json({ message: 'Password updated successfully' });
});
