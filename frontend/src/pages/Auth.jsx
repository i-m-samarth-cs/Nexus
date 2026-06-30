import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/index.js';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nexus-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,245,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="display-text text-5xl font-black text-nexus-cyan tracking-widest mb-2"
            style={{ textShadow: '0 0 30px rgba(0,245,255,0.5)' }}>
            NEXUS
          </div>
          <div className="terminal-text text-nexus-text-dim text-xs tracking-widest">
            ACADEMIC OPERATIONS COMMAND CENTER
          </div>
          <div className="mt-3 h-px bg-gradient-to-r from-transparent via-nexus-cyan to-transparent opacity-30" />
        </div>

        {/* Auth card */}
        <div className="zone-card border border-[rgba(0,245,255,0.15)] p-6">
          {/* Mode toggle */}
          <div className="flex mb-6 border border-[rgba(74,101,128,0.3)]">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-2 terminal-text text-xs tracking-widest transition-all"
                style={{
                  background: mode === m ? 'rgba(0,245,255,0.08)' : 'transparent',
                  color: mode === m ? '#00f5ff' : '#4a6580',
                  borderBottom: mode === m ? '2px solid #00f5ff' : '2px solid transparent',
                }}
              >
                {m === 'login' ? 'AUTHENTICATE' : 'ENLIST'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="zone-label block mb-1.5">OPERATIVE EMAIL</label>
              <input
                className="nexus-input w-full"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="zone-label block mb-1.5">ACCESS CODE</label>
              <input
                className="nexus-input w-full"
                type="password"
                placeholder={mode === 'register' ? 'Min 8 characters' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={mode === 'register' ? 8 : 1}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="terminal-text text-nexus-red text-xs p-2 border border-[rgba(255,45,85,0.3)] bg-[rgba(255,45,85,0.06)]"
                >
                  ▲ {error.toUpperCase()}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="nexus-btn-green nexus-btn w-full py-2.5 text-sm disabled:opacity-50"
            >
              {loading
                ? 'VERIFYING...'
                : mode === 'login'
                  ? '→ ENTER WAR ROOM'
                  : '→ CREATE OPERATIVE'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 terminal-text text-[10px] text-nexus-text-dim">
          NEXUS v1.0 — FIGHT YOUR SEMESTER LIKE A GENERAL
        </div>
      </motion.div>
    </div>
  );
}
