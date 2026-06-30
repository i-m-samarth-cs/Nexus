import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const subjectSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#00f5ff'),
  difficulty: z.number().int().min(1).max(5).default(3),
  weeklyTarget: z.number().int().min(1).max(20).default(3),
});

router.get('/', async (req, res) => {
  const subjects = await prisma.subject.findMany({
    where: { userId: req.userId },
    include: {
      deadlines: { orderBy: { dueDate: 'asc' } },
      studySessions: {
        where: { startTime: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
        orderBy: { startTime: 'desc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(subjects);
});

router.post('/', async (req, res) => {
  const parse = subjectSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });

  const subject = await prisma.subject.create({
    data: { ...parse.data, userId: req.userId },
    include: { deadlines: true, studySessions: true },
  });
  res.status(201).json(subject);
});

router.put('/:id', async (req, res) => {
  const parse = subjectSchema.partial().safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input' });

  const subject = await prisma.subject.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  const updated = await prisma.subject.update({
    where: { id: req.params.id },
    data: parse.data,
    include: { deadlines: true, studySessions: true },
  });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const subject = await prisma.subject.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  await prisma.subject.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
