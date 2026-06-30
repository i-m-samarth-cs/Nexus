import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import subjectRoutes from './routes/subjects.js';
import deadlineRoutes from './routes/deadlines.js';
import sessionRoutes from './routes/sessions.js';
import triageRoutes from './routes/triage.js';
import warRoomRoutes from './routes/warroom.js';
import { authenticate } from './middleware/auth.js';
import { setupWarRoomSockets } from './sockets/warroom.js';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }
});

app.set('io', io);
setupWarRoomSockets(io);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/subjects', authenticate, subjectRoutes);
app.use('/api/deadlines', authenticate, deadlineRoutes);
app.use('/api/sessions', authenticate, sessionRoutes);
app.use('/api/triage', authenticate, triageRoutes);
app.use('/api/warroom', authenticate, warRoomRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'NEXUS ONLINE' }));

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

server.listen(PORT, () => {
  console.log(`NEXUS backend operational on port ${PORT}`);
});
