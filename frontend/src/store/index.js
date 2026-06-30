import { create } from 'zustand';
import axios from 'axios';
import { enrichSubjects } from '../utils/riskScore.js';

axios.defaults.withCredentials = true;

const API_URL = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({ baseURL: API_URL, withCredentials: true });

let refreshPromise = null;
let onAuthFailure = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = api.post('/auth/refresh').finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export const useStore = create((set, get) => ({
  // Auth
  user: null,
  authLoading: true,

  // Data
  subjects: [],
  triage: null,
  triageLoading: false,
  dataLoading: false,

  // Active session
  activeSession: null,

  // Boot sequence
  bootComplete: false,

  setBootComplete: () => set({ bootComplete: true }),

  clearAuth: () => set({ user: null, subjects: [], triage: null, authLoading: false }),

  checkAuth: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, authLoading: false });
      get().loadSubjects();
    } catch {
      try {
        await refreshAccessToken();
        const { data } = await api.get('/auth/me');
        set({ user: data, authLoading: false });
        get().loadSubjects();
      } catch {
        set({ user: null, authLoading: false });
      }
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    set({ user: { id: data.userId, email: data.email } });
    get().loadSubjects();
    return data;
  },

  register: async (email, password) => {
    const { data } = await api.post('/auth/register', { email, password });
    set({ user: { id: data.userId, email: data.email } });
    get().loadSubjects();
    return data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    set({ user: null, subjects: [], triage: null });
  },

  updateProfile: async (payload) => {
    const { data } = await api.put('/auth/me', payload);
    set({ user: data });
    return data;
  },

  loadSubjects: async () => {
    set({ dataLoading: true });
    try {
      const { data } = await api.get('/subjects');
      set({ subjects: enrichSubjects(data), dataLoading: false });
    } catch {
      set({ dataLoading: false });
    }
  },

  addSubject: async (payload) => {
    const { data } = await api.post('/subjects', payload);
    set(state => ({
      subjects: enrichSubjects([...state.subjects, data]),
    }));
    return data;
  },

  updateSubject: async (id, payload) => {
    const { data } = await api.put(`/subjects/${id}`, payload);
    set(state => ({
      subjects: enrichSubjects(state.subjects.map(s => s.id === id ? { ...s, ...data } : s)),
    }));
    return data;
  },

  deleteSubject: async (id) => {
    await api.delete(`/subjects/${id}`);
    set(state => ({ subjects: state.subjects.filter(s => s.id !== id) }));
  },

  addDeadline: async (payload) => {
    const { data } = await api.post('/deadlines', payload);
    set(state => ({
      subjects: enrichSubjects(state.subjects.map(s =>
        s.id === payload.subjectId
          ? { ...s, deadlines: [...(s.deadlines || []), data] }
          : s
      )),
    }));
    return data;
  },

  updateDeadline: async (id, subjectId, payload) => {
    const { data } = await api.put(`/deadlines/${id}`, payload);
    set(state => ({
      subjects: enrichSubjects(state.subjects.map(s =>
        s.id === subjectId
          ? { ...s, deadlines: s.deadlines.map(d => d.id === id ? { ...d, ...data } : d) }
          : s
      )),
    }));
    return data;
  },

  toggleDeadlineComplete: async (id, subjectId) => {
    const { data } = await api.patch(`/deadlines/${id}/complete`);
    set(state => ({
      subjects: enrichSubjects(state.subjects.map(s =>
        s.id === subjectId
          ? { ...s, deadlines: s.deadlines.map(d => d.id === id ? { ...d, ...data } : d) }
          : s
      )),
    }));
  },

  deleteDeadline: async (id, subjectId) => {
    await api.delete(`/deadlines/${id}`);
    set(state => ({
      subjects: enrichSubjects(state.subjects.map(s =>
        s.id === subjectId
          ? { ...s, deadlines: s.deadlines.filter(d => d.id !== id) }
          : s
      )),
    }));
  },

  loadTriage: async () => {
    set({ triageLoading: true });
    try {
      const { data } = await api.get('/triage');
      set({ triage: data, triageLoading: false });
    } catch {
      set({ triageLoading: false });
    }
  },

  refreshTriage: async () => {
    await api.post('/triage/refresh');
    get().loadTriage();
  },

  startSession: (subjectId, subjectName, duration = 45) => {
    set({
      activeSession: {
        id: null,
        subjectId,
        subjectName,
        duration,
        missionLog: '',
        startTime: new Date(),
      },
    });
  },

  logSession: async (payload) => {
    const { data } = await api.post('/sessions', payload);
    set(state => ({
      subjects: enrichSubjects(state.subjects.map(s =>
        s.id === payload.subjectId
          ? { ...s, studySessions: [data, ...(s.studySessions || [])] }
          : s
      )),
      activeSession: null,
    }));
    return data;
  },

  clearSession: () => set({ activeSession: null }),
}));

onAuthFailure = () => useStore.getState().clearAuth();

api.interceptors.response.use(
  res => res,
  async (err) => {
    const original = err.config;
    const isAuthRoute = original?.url?.startsWith('/auth/');
    if (err.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        await refreshAccessToken();
        return api(original);
      } catch {
        onAuthFailure?.();
      }
    }
    return Promise.reject(err);
  }
);
