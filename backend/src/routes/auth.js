import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function issueTokens(res, userId) {
  const access = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refresh = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('access_token', access, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refresh_token', refresh, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh',
  });

  return access;
}

router.post('/register', async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input' });

  const { email, password } = parse.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  const token = issueTokens(res, user.id);
  res.status(201).json({ userId: user.id, email: user.email, token });
});

router.post('/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input' });

  const { email, password } = parse.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = issueTokens(res, user.id);
  res.json({ userId: user.id, email: user.email, token });
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies.refresh_token;
  if (!token) return res.status(401).json({ error: 'No refresh token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const newToken = issueTokens(res, payload.userId);
    res.json({ token: newToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('access_token', {
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd
  });
  res.clearCookie('refresh_token', { 
    path: '/api/auth/refresh',
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd
  });
  res.json({ message: 'Logged out' });
});

router.get('/me', async (req, res) => {
  const token = req.cookies.access_token ||
    (req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.slice(7));
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, color: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.put('/me', async (req, res) => {
  const token = req.cookies.access_token ||
    (req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.slice(7));
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { name, color } = req.body;
    
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: { name, color },
      select: { id: true, email: true, name: true, color: true, createdAt: true },
    });
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
