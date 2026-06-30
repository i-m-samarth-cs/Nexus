import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const deadlineSchema = z.object({
  subjectId: z.string().cuid(),
  title: z.string().min(1).max(200),
  type: z.enum(['assignment', 'exam', 'practical', 'project', 'quiz']),
  dueDate: z.string().datetime(),
  weight: z.number().min(0).max(100).default(10),
});

async function ownsSubject(userId, subjectId) {
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId } });
  return !!subject;
}

router.get('/', async (req, res) => {
  const subjects = await prisma.subject.findMany({
    where: { userId: req.userId },
    select: { id: true },
  });
  const subjectIds = subjects.map(s => s.id);

  const deadlines = await prisma.deadline.findMany({
    where: { subjectId: { in: subjectIds } },
    include: { subject: { select: { name: true, color: true } } },
    orderBy: { dueDate: 'asc' },
  });
  res.json(deadlines);
});

router.post('/', async (req, res) => {
  const parse = deadlineSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });

  const allowed = await ownsSubject(req.userId, parse.data.subjectId);
  if (!allowed) return res.status(403).json({ error: 'Access denied' });

  const deadline = await prisma.deadline.create({
    data: { ...parse.data, dueDate: new Date(parse.data.dueDate) },
    include: { subject: { select: { name: true, color: true } } },
  });
  res.status(201).json(deadline);
});

router.put('/:id', async (req, res) => {
  const deadline = await prisma.deadline.findUnique({
    where: { id: req.params.id },
    include: { subject: true },
  });
  if (!deadline || deadline.subject.userId !== req.userId) {
    return res.status(404).json({ error: 'Deadline not found' });
  }

  const parse = deadlineSchema.partial().omit({ subjectId: true }).safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid input' });

  const data = { ...parse.data };
  if (data.dueDate) data.dueDate = new Date(data.dueDate);

  const updated = await prisma.deadline.update({
    where: { id: req.params.id },
    data,
    include: { subject: { select: { name: true, color: true } } },
  });
  res.json(updated);
});

router.patch('/:id/complete', async (req, res) => {
  const deadline = await prisma.deadline.findUnique({
    where: { id: req.params.id },
    include: { subject: true },
  });
  if (!deadline || deadline.subject.userId !== req.userId) {
    return res.status(404).json({ error: 'Deadline not found' });
  }

  const updated = await prisma.deadline.update({
    where: { id: req.params.id },
    data: { isComplete: !deadline.isComplete },
  });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const deadline = await prisma.deadline.findUnique({
    where: { id: req.params.id },
    include: { subject: true },
  });
  if (!deadline || deadline.subject.userId !== req.userId) {
    return res.status(404).json({ error: 'Deadline not found' });
  }

  await prisma.deadline.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
