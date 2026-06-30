import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { runTriageEngine } from '../services/triageEngine.js';

const router = Router();
const prisma = new PrismaClient();

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

router.get('/', async (req, res) => {
  const cached = await prisma.triageCache.findUnique({ where: { userId: req.userId } });
  if (cached && isSameDay(cached.generatedAt, new Date())) {
    return res.json({ briefing: cached.briefing, priorities: cached.priorities, cached: true });
  }

  const subjects = await prisma.subject.findMany({
    where: { userId: req.userId },
    include: {
      deadlines: {
        where: { isComplete: false, dueDate: { gte: new Date() } },
        orderBy: { dueDate: 'asc' },
      },
      studySessions: {
        where: { startTime: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
        orderBy: { startTime: 'desc' },
      },
    },
  });

  if (subjects.length === 0) {
    return res.json({
      briefing: 'No subjects configured. Add your subjects and deadlines to activate tactical analysis.',
      priorities: [],
      cached: false,
    });
  }

  const payload = {
    timestamp: new Date().toISOString(),
    subjects: subjects.map(s => ({
      id: s.id,
      name: s.name,
      difficulty: s.difficulty,
      weeklyTarget: s.weeklyTarget,
      upcomingDeadlines: s.deadlines.map(d => ({
        title: d.title,
        type: d.type,
        dueDate: d.dueDate.toISOString(),
        daysRemaining: Math.ceil((d.dueDate - new Date()) / (1000 * 60 * 60 * 24)),
        weight: d.weight,
      })),
      recentSessions: s.studySessions.map(sess => ({
        date: sess.startTime.toISOString(),
        duration: sess.duration,
        focusRating: sess.focusRating,
        isComplete: sess.isComplete,
      })),
      sessionsThisWeek: s.studySessions.filter(
        sess => sess.startTime >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
    })),
  };

  try {
    const result = await runTriageEngine(payload);

    await prisma.triageCache.upsert({
      where: { userId: req.userId },
      update: { briefing: result.briefing, priorities: result.priorities, generatedAt: new Date() },
      create: { userId: req.userId, briefing: result.briefing, priorities: result.priorities },
    });

    res.json({ ...result, cached: false });
  } catch (err) {
    console.error('Triage engine error:', err);
    if (cached) {
      return res.json({ briefing: cached.briefing, priorities: cached.priorities, cached: true, stale: true });
    }
    res.json({
      briefing: 'NEXUS triage engine temporarily offline. Manual priority assessment required.',
      priorities: [],
      cached: false,
    });
  }
});

router.post('/refresh', async (req, res) => {
  await prisma.triageCache.deleteMany({ where: { userId: req.userId } });
  res.json({ message: 'Cache cleared. Next load will regenerate.' });
});

export default router;
