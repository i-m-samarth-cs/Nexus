import { create } from 'zustand';
import { io } from 'socket.io-client';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({ baseURL: API_URL, withCredentials: true });
let socket = null;

// Helper to keep local timers ticking
let globalTickInterval = null;

export const useWarRoomStore = create((set, get) => ({
  warRoom: null,
  roomLoading: true,
  activeSessions: {}, // { userId: { sessionData, elapsed } }
  widgetSubject: null,
  setWidgetSubject: (subject) => set({ widgetSubject: subject }),
  error: null,
  socketConnected: false,

  initSocket: () => {
    if (!socket) {
      const SOCKET_URL = import.meta.env.VITE_API_URL || '/';
      socket = io(SOCKET_URL, { path: '/socket.io' });

      socket.on('connect', () => set({ socketConnected: true }));
      socket.on('disconnect', () => set({ socketConnected: false }));

      socket.on('session_started', (data) => {
        set(state => ({
          activeSessions: { ...state.activeSessions, [data.userId]: { ...data, elapsed: 0 } }
        }));
        get().ensureTicker();
      });

      socket.on('session_ticked', (data) => {
        set(state => ({
          activeSessions: { ...state.activeSessions, [data.userId]: data }
        }));
      });

      socket.on('session_ended', ({ userId }) => {
        set(state => {
          const newSessions = { ...state.activeSessions };
          delete newSessions[userId];
          return { activeSessions: newSessions };
        });
      });
    }
  },

  ensureTicker: () => {
    if (!globalTickInterval) {
      globalTickInterval = setInterval(() => {
        const { activeSessions, warRoom } = get();
        if (Object.keys(activeSessions).length === 0) {
          clearInterval(globalTickInterval);
          globalTickInterval = null;
          return;
        }
        
        const newSessions = {};
        for (const [uid, session] of Object.entries(activeSessions)) {
          // Increment elapsed natively on client so it ticks continuously
          const newElapsed = session.elapsed + 1;
          newSessions[uid] = { ...session, elapsed: newElapsed };
        }
        set({ activeSessions: newSessions });
      }, 1000);
    }
  },

  joinRoom: async (passcode) => {
    try {
      const { data } = await api.post('/warroom/join', { passcode });
      set({ warRoom: data, error: null });
      get().initSocket();
      socket.emit('join_war_room', data.id);
      return data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to join' });
      throw err;
    }
  },

  createRoom: async (name) => {
    try {
      const { data } = await api.post('/warroom', { name });
      set({ warRoom: data, error: null });
      get().initSocket();
      socket.emit('join_war_room', data.id);
      return data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to create' });
      throw err;
    }
  },

  loadRoom: async () => {
    set({ roomLoading: true });
    try {
      const { data } = await api.get('/warroom');
      set({ warRoom: data, roomLoading: false });
      get().initSocket();
      socket.emit('join_war_room', data.id);
    } catch (err) {
      set({ warRoom: null, roomLoading: false });
    }
  },

  leaveRoom: async () => {
    const { warRoom } = get();
    if (warRoom && socket) socket.emit('leave_war_room', warRoom.id);
    await api.post('/warroom/leave');
    set({ warRoom: null, activeSessions: {} });
    if (globalTickInterval) {
      clearInterval(globalTickInterval);
      globalTickInterval = null;
    }
  },

  startGlobalSession: (userId, sessionData) => {
    const { warRoom } = get();
    const data = { ...sessionData, userId, startTime: new Date().toISOString(), elapsed: 0 };
    set(state => ({
      activeSessions: { ...state.activeSessions, [userId]: data }
    }));
    get().ensureTicker();
    
    if (warRoom && socket) {
      socket.emit('start_session', { warRoomId: warRoom.id, sessionData: data });
    }
  },

  endGlobalSession: (userId) => {
    const { warRoom } = get();
    set(state => {
      const newSessions = { ...state.activeSessions };
      delete newSessions[userId];
      return { activeSessions: newSessions };
    });
    if (warRoom && socket) {
      socket.emit('end_session', { warRoomId: warRoom.id, userId });
    }
  }
}));
