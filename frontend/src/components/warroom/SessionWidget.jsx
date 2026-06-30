import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/index.js';
import { useWarRoomStore } from '../../store/warRoomStore.js';

function CircularTimer({ elapsed, total, color }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, 1 - elapsed / total);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <svg width="150" height="150" className="transform -rotate-90">
      <circle cx="75" cy="75" r={radius} fill="none" stroke="#1a2840" strokeWidth="6" />
      <circle
        cx="75" cy="75" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}

export default function SessionWidget({ subject, onClose }) {
  const { user, logSession } = useStore();
  const { activeSessions, startGlobalSession, endGlobalSession } = useWarRoomStore();

  const globalSession = user ? activeSessions[user.id] : null;
  const isGlobalActive = !!globalSession && globalSession.subjectId === subject.id;

  const [phase, setPhase] = useState(isGlobalActive ? 'active' : 'planning'); // planning | active | complete
  const [missionLog, setMissionLog] = useState(globalSession?.missionLog || '');
  const [duration, setDuration] = useState(globalSession?.duration || 45);
  const [focusRating, setFocusRating] = useState(4);
  const [completed, setCompleted] = useState(true);
  const [saving, setSaving] = useState(false);

  const color = subject?.riskColor || '#00f5ff';

  // Sync phase based on global session ending
  const elapsed = globalSession?.elapsed || 0;

  useEffect(() => {
    if (phase === 'active' && elapsed >= duration * 60) {
      endGlobalSession(user.id);
      setPhase('complete');
    }
  }, [phase, elapsed, duration, user?.id, endGlobalSession]);

  const handleStart = () => {
    if (!missionLog.trim()) return;
    startGlobalSession(user.id, {
      subjectId: subject.id,
      subjectName: subject.name,
      duration,
      missionLog
    });
    setPhase('active');
  };

  const handleAbort = () => {
    endGlobalSession(user.id);
    setPhase('complete');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await logSession({
        subjectId: subject.id,
        duration: Math.round(elapsed / 60) || 1,
        focusRating,
        missionLog,
        isComplete: completed,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (globalSession) endGlobalSession(user.id);
    onClose();
  };

  const timeRemaining = Math.max(0, duration * 60 - elapsed);
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="absolute bottom-6 right-6 w-80 bg-nexus-bg-2 border shadow-2xl z-50 flex flex-col"
        style={{ borderColor: color, boxShadow: `0 8px 32px rgba(0,0,0,0.8), 0 0 16px ${color}33` }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-2 border-b" style={{ borderColor: `${color}44`, backgroundColor: `${color}11` }}>
          <span className="display-text text-[10px] font-bold tracking-widest truncate mr-2" style={{ color }}>
            {phase === 'active' ? 'MISSION IN PROGRESS' : phase === 'planning' ? 'INITIATE MISSION' : 'MISSION COMPLETE'}
          </span>
          <button onClick={onClose} className="text-nexus-text-dim hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {/* PLANNING PHASE */}
          {phase === 'planning' && (
            <div className="space-y-4">
              <div>
                <h3 className="display-text text-sm font-black truncate" style={{ color }}>{subject.name}</h3>
                <p className="terminal-text text-nexus-text-dim text-[9px] mt-1">Define objective before starting</p>
              </div>

              <div>
                <textarea
                  className="nexus-input w-full h-16 resize-none text-xs"
                  placeholder="Mission log..."
                  value={missionLog}
                  onChange={e => setMissionLog(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="zone-label block mb-1">DURATION (MIN)</label>
                <div className="flex gap-1">
                  {[25, 45, 60, 90].map(d => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`nexus-btn flex-1 text-[10px] py-1 ${duration === d ? 'bg-[rgba(0,245,255,0.15)] border-nexus-cyan' : ''}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleStart}
                  disabled={!missionLog.trim()}
                  className="nexus-btn-green nexus-btn w-full disabled:opacity-30 text-xs py-2"
                >
                  ▶ COMMENCE
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE PHASE */}
          {phase === 'active' && (
            <div className="flex flex-col items-center space-y-3">
              <h3 className="display-text text-xs font-black truncate w-full text-center" style={{ color }}>{subject.name}</h3>
              
              <div className="relative inline-block">
                <CircularTimer elapsed={elapsed} total={duration * 60} color={color} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="terminal-text font-bold text-2xl tabular-nums">
                    {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                  </span>
                </div>
              </div>

              <div className="w-full bg-[rgba(0,0,0,0.3)] border p-2 text-center" style={{ borderColor: `${color}22` }}>
                <p className="terminal-text text-[10px] text-nexus-text-mid truncate">{missionLog}</p>
              </div>

              <button onClick={handleAbort} className="nexus-btn-red nexus-btn w-full text-[10px] py-1 mt-2">
                ■ END EARLY
              </button>
            </div>
          )}

          {/* COMPLETE PHASE */}
          {phase === 'complete' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="display-text text-sm font-black text-nexus-green mb-1">SUCCESS</div>
                <div className="terminal-text text-nexus-text-dim text-[10px]">
                  {Math.round(elapsed / 60)} minutes logged
                </div>
              </div>

              <div>
                <label className="zone-label block mb-1">FOCUS</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(r => (
                    <button
                      key={r}
                      onClick={() => setFocusRating(r)}
                      className="flex-1 py-1 border transition-all text-xs"
                      style={{
                        borderColor: r <= focusRating ? '#00f5ff55' : 'rgba(74,101,128,0.3)',
                        background: r <= focusRating ? 'rgba(0,245,255,0.08)' : 'transparent',
                        color: r <= focusRating ? '#00f5ff' : '#4a6580',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="zone-label block mb-1">COMPLETED?</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCompleted(true)}
                    className={`nexus-btn flex-1 text-[10px] py-1 ${completed ? 'nexus-btn-green' : ''}`}
                  >
                    YES
                  </button>
                  <button
                    onClick={() => setCompleted(false)}
                    className={`nexus-btn flex-1 text-[10px] py-1 ${!completed ? 'nexus-btn-red' : ''}`}
                  >
                    PARTIAL/NO
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} disabled={saving} className="nexus-btn-green nexus-btn flex-1 text-[10px] py-2">
                  {saving ? 'LOGGING...' : 'LOG INTEL'}
                </button>
                <button onClick={handleDiscard} className="nexus-btn text-[10px] py-2">DISCARD</button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
