import { motion } from 'framer-motion';
import { useStore } from '../../store/index.js';
import { useWarRoomStore } from '../../store/warRoomStore.js';

const LEVEL_COLORS = {
  critical: '#ff2d55',
  elevated: '#ff9f0a',
  nominal: '#30d158',
};

export default function MissionQueue({ priorities = [], loading }) {
  const { subjects } = useStore();
  const { setWidgetSubject } = useWarRoomStore();

  const handleStart = (p) => {
    const fullSubject = subjects.find(s => s.id === p.subjectId);
    if (fullSubject) setWidgetSubject(fullSubject);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="terminal-text text-nexus-text-dim text-xs animate-pulse">AWAITING TRIAGE DATA...</span>
      </div>
    );
  }

  if (!priorities.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="terminal-text text-nexus-text-dim text-xs">NO ACTIVE MISSIONS</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-auto h-full pr-1">
      {priorities.slice(0, 5).map((p, i) => (
        <motion.div
          key={p.subjectId + i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className="zone-card border p-2.5 flex gap-3 items-start"
          style={{ borderColor: `${LEVEL_COLORS[p.riskLevel]}44` }}
        >
          <div className="shrink-0 flex flex-col items-center gap-0.5">
            <span
              className="display-text text-[10px] font-black tabular-nums"
              style={{ color: LEVEL_COLORS[p.riskLevel] }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: LEVEL_COLORS[p.riskLevel] }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="display-text text-[10px] font-bold text-nexus-cyan truncate">
                {p.subjectName}
              </span>
              <span
                className="display-text text-[9px] font-bold shrink-0"
                style={{ color: LEVEL_COLORS[p.riskLevel] }}
              >
                {(p.riskLevel || '').toUpperCase()}
              </span>
            </div>
            <p className="terminal-text text-[10px] text-nexus-text-mid leading-tight mb-1.5">
              {p.sessionFocus}
            </p>
            <p className="terminal-text text-[9px] text-nexus-text-dim leading-tight mb-2">
              {p.reasoning}
            </p>
            <button
              onClick={() => handleStart(p)}
              className="nexus-btn text-[9px] py-0.5 px-2"
            >
              START MISSION
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
