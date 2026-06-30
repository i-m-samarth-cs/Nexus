import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

function generatePasscode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
}

router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  let passcode;
  let unique = false;
  while (!unique) {
    passcode = generatePasscode();
    const existing = await prisma.warRoom.findUnique({ where: { passcode } });
    if (!existing) unique = true;
  }

  const room = await prisma.warRoom.create({
    data: { name, passcode }
  });

  // Assign user to this room
  await prisma.user.update({
    where: { id: req.userId },
    data: { warRoomId: room.id }
  });

  res.json(room);
});

router.post('/join', async (req, res) => {
  const { passcode } = req.body;
  if (!passcode) return res.status(400).json({ error: 'Passcode required' });

  const room = await prisma.warRoom.findUnique({ where: { passcode } });
  if (!room) return res.status(404).json({ error: 'War Room not found' });

  await prisma.user.update({
    where: { id: req.userId },
    data: { warRoomId: room.id }
  });

  res.json(room);
});

router.post('/leave', async (req, res) => {
  await prisma.user.update({
    where: { id: req.userId },
    data: { warRoomId: null }
  });
  res.json({ success: true });
});

router.get('/', async (req, res) => {
  const user = await prisma.user.findUnique({ 
    where: { id: req.userId },
    include: {
      warRoom: {
        include: {
          members: {
            select: { id: true, email: true, name: true, color: true }
          }
        }
      }
    }
  });

  if (!user || !user.warRoom) {
    return res.status(404).json({ error: 'Not in a war room' });
  }

  res.json(user.warRoom);
});

export default router;
