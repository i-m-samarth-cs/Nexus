import { AnimatePresence, motion } from 'framer-motion';
import { useCountdown } from '../../hooks/useCountdown.js';
import { riskColor, riskLevel } from '../../utils/riskScore.js';
import { useWarRoomStore } from '../../store/warRoomStore.js';

function CountdownUnit({ value, label }) {
  const display = String(value).padStart(2, '0');
  return (
    <div className="flex flex-col items-center">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={display}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.08 }}
          className="terminal-text tabular-nums font-bold leading-none"
          style={{ fontSize: 'clamp(18px, 2.5vw, 28px)' }}
        >
          {display}
        </motion.span>
      </AnimatePresence>
      <span className="terminal-text text-nexus-text-dim" style={{ fontSize: 9 }}>{label}</span>
    </div>
  );
}

function CountdownCard({ deadline, subjectName, subjectColor }) {
  const time = useCountdown(deadline.dueDate);
  const score = deadline.score || 0;
  const color = riskColor(score);
  const level = riskLevel(score);

  return (
    <div
      className="zone-card border p-3 flex-1"
      style={{
        borderColor: `${color}44`,
        boxShadow: `0 0 8px ${color}22`,
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="display-text text-[9px] font-bold truncate" style={{ color: subjectColor }}>
          {subjectName}
        </span>
        <span className="display-text text-[8px]" style={{ color }}>
          {level.toUpperCase()}
        </span>
      </div>
      <div className="terminal-text text-nexus-text-mid text-[10px] mb-2 leading-tight truncate">
        {deadline.title} · {deadline.type?.toUpperCase()}
      </div>

      <div className="flex items-end gap-2 justify-center">
        <CountdownUnit value={time.days} label="D" />
        <span className="terminal-text text-nexus-text-dim mb-3">:</span>
        <CountdownUnit value={time.hours} label="H" />
        <span className="terminal-text text-nexus-text-dim mb-3">:</span>
        <CountdownUnit value={time.minutes} label="M" />
        <span className="terminal-text text-nexus-text-dim mb-3">:</span>
        <CountdownUnit value={time.seconds} label="S" />
      </div>

      {level === 'critical' && (
        <div
          className="mt-2 text-center display-text text-[8px] badge-critical"
          style={{ color }}
        >
          ▲ CRITICAL THREAT
        </div>
      )}
    </div>
  );
}

function ActiveSessionCard({ session, userColor, userName }) {
  const timeRemaining = Math.max(0, session.duration * 60 - session.elapsed);
  const hrs = Math.floor(timeRemaining / 3600);
  const mins = Math.floor((timeRemaining % 3600) / 60);
  const secs = timeRemaining % 60;
  const color = userColor || '#00f5ff';

  return (
    <div
      className="zone-card border p-3 flex-1 bg-[rgba(0,245,255,0.02)]"
      style={{
        borderColor: `${color}44`,
        boxShadow: `0 0 8px ${color}22`,
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="display-text text-[9px] font-bold truncate" style={{ color }}>
          {session.subjectName}
        </span>
        <span className="display-text text-[8px] text-nexus-green animate-pulse">
          LIVE
        </span>
      </div>
      <div className="terminal-text text-nexus-text-mid text-[10px] mb-2 leading-tight truncate">
        {userName || 'Operative'} · {session.missionLog}
      </div>

      <div className="flex items-end gap-2 justify-center">
        {hrs > 0 && (
          <>
            <CountdownUnit value={hrs} label="H" />
            <span className="terminal-text text-nexus-text-dim mb-3">:</span>
          </>
        )}
        <CountdownUnit value={mins} label="M" />
        <span className="terminal-text text-nexus-text-dim mb-3">:</span>
        <CountdownUnit value={secs} label="S" />
      </div>

      <div
        className="mt-2 text-center display-text text-[8px] tracking-widest text-nexus-cyan"
      >
        ACTIVE MISSION
      </div>
    </div>
  );
}

export default function ActiveCountdowns({ subjects }) {
  const { activeSessions, warRoom } = useWarRoomStore();
  const now = new Date();

  const urgentDeadlines = subjects
    .flatMap(s => (s.deadlines || [])
      .filter(d => !d.isComplete && new Date(d.dueDate) > now)
      .map(d => ({ ...d, subjectName: s.name, subjectColor: s.color, score: s.riskScore }))
    )
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 3);

  const activeSessionsArray = Object.values(activeSessions || {});
  
  if (!urgentDeadlines.length && !activeSessionsArray.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="terminal-text text-nexus-text-dim text-xs">NO ACTIVE MISSIONS OR COUNTDOWNS</span>
      </div>
    );
  }

  return (
    <div className="flex gap-2 h-full overflow-x-auto">
      {activeSessionsArray.map(session => {
        // find member details if they are in the warroom
        const member = warRoom?.members?.find(m => m.id === session.userId);
        return (
          <ActiveSessionCard 
            key={session.userId} 
            session={session} 
            userName={member?.name} 
            userColor={member?.color}
          />
        );
      })}
      
      {urgentDeadlines.map(d => (
        <CountdownCard
          key={d.id}
          deadline={d}
          subjectName={d.subjectName}
          subjectColor={d.subjectColor}
        />
      ))}
    </div>
  );
}
