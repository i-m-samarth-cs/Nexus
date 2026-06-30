import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const sessionSchema = z.object({
  subjectId: z.string().cuid(),
  duration: z.number().int().min(1).max(480),
  focusRating: z.number().int().min(1).max(5).default(3),
  missionLog: z.string().max(1000).default(''),
  isComplete: z.boolean().default(false),
});

async function ownsSubject(userId, subjectId) {
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId } });
  return !!subject;
}

router.get('/', async (req, res) => {
  const { subjectId, since } = req.query;
  const subjects = await prisma.subject.findMany({
    where: { userId: req.userId },
    select: { id: true },
  });
  const subjectIds = subjects.map(s => s.id);

  const where = { subjectId: { in: subjectIds } };
  if (subjectId && subjectIds.includes(subjectId)) where.subjectId = subjectId;
  if (since) where.startTime = { gte: new Date(since) };

  const sessions = await prisma.studySession.findMany({
    where,
    include: { subject: { select: { name: true, color: true } } },
    orderBy: { startTime: 'desc' },
  });
  res.json(sessions);
});

router.post('/', async (req, res) => {
  const parse = sessionSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });

  const allowed = await ownsSubject(req.userId, parse.data.subjectId);
  if (!allowed) return res.status(403).json({ error: 'Access denied' });

  const session = await prisma.studySession.create({
    data: parse.data,
    include: { subject: { select: { name: true, color: true } } },
  });
  res.status(201).json(session);
});

router.patch('/:id/complete', async (req, res) => {
  const parse = z.object({
    focusRating: z.number().int().min(1).max(5),
    isComplete: z.boolean(),
    missionLog: z.string().max(1000).optional(),
  }).safeParse(req.body);

  if (!parse.success) return res.status(400).json({ error: 'Invalid input' });

  const session = await prisma.studySession.findUnique({
    where: { id: req.params.id },
    include: { subject: true },
  });
  if (!session || session.subject.userId !== req.userId) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const updated = await prisma.studySession.update({
    where: { id: req.params.id },
    data: parse.data,
  });
  res.json(updated);
});

export default router;
