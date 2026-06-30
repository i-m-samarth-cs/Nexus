import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useStore } from '../store/index.js';
import { useWarRoomStore } from '../store/warRoomStore.js';
import { riskLabel } from '../utils/riskScore.js';

function RiskSparkline({ score }) {
  const color = score >= 61 ? '#ff2d55' : score >= 31 ? '#ff9f0a' : '#30d158';
  return (
    <div className="flex items-end gap-0.5 h-8">
      {Array.from({ length: 14 }, (_, i) => {
        const h = Math.max(4, Math.random() * 32);
        return (
          <div
            key={i}
            className="w-1.5 rounded-sm"
            style={{ height: h, backgroundColor: i === 13 ? color : `${color}55` }}
          />
        );
      })}
    </div>
  );
}

export default function SubjectCommand() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { subjects, addDeadline, toggleDeadlineComplete, deleteDeadline } = useStore();
  const { setWidgetSubject } = useWarRoomStore();

  const subject = subjects.find(s => s.id === id);

  const [showAddDeadline, setShowAddDeadline] = useState(false);
  const [deadlineForm, setDeadlineForm] = useState({
    title: '', type: 'assignment', dueDate: '', weight: 10,
  });
  const [submitting, setSubmitting] = useState(false);

  if (!subject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="terminal-text text-nexus-text-dim mb-4">SUBJECT NOT FOUND</div>
          <button onClick={() => navigate('/')} className="nexus-btn">RETURN TO WAR ROOM</button>
        </div>
      </div>
    );
  }

  const now = new Date();
  const upcoming = (subject.deadlines || [])
    .filter(d => !d.isComplete && new Date(d.dueDate) > now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const completed = (subject.deadlines || []).filter(d => d.isComplete);
  const sessions = subject.studySessions || [];

  const score = subject.riskScore || 0;
  const color = subject.riskColor || '#30d158';
  const label = riskLabel(score);

  const handleAddDeadline = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDeadline({
        subjectId: id,
        ...deadlineForm,
        weight: Number(deadlineForm.weight),
        dueDate: new Date(deadlineForm.dueDate).toISOString(),
      });
      setShowAddDeadline(false);
      setDeadlineForm({ title: '', type: 'assignment', dueDate: '', weight: 10 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartMission = () => {
    setWidgetSubject(subject);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="zone-card border p-5 glow-cyan"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <button
              onClick={() => navigate('/')}
              className="terminal-text text-nexus-text-dim text-xs mb-3 hover:text-nexus-cyan transition-colors"
            >
              ← WAR ROOM
            </button>
            <h1 className="display-text text-2xl font-black text-nexus-cyan tracking-wider mb-1">
              {subject.name}
            </h1>
            <div className="flex items-center gap-3">
              <span className="terminal-text text-nexus-text-dim text-xs">
                DIFFICULTY: {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} style={{ color: i < subject.difficulty ? color : '#4a6580' }}>■</span>
                ))}
              </span>
              <span className="terminal-text text-nexus-text-dim text-xs">
                TARGET: {subject.weeklyTarget} SESSIONS/WK
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="display-text font-black mb-1" style={{ fontSize: 52, color, lineHeight: 1 }}>
              {score}
            </div>
            <div className="display-text text-sm font-bold" style={{ color }}>{label}</div>
            <RiskSparkline score={score} />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={handleStartMission} className="nexus-btn-green nexus-btn">
            ▶ START MISSION
          </button>
          <button onClick={() => setShowAddDeadline(!showAddDeadline)} className="nexus-btn">
            + ADD DEADLINE
          </button>
        </div>
      </motion.div>

      {/* Add Deadline Form */}
      {showAddDeadline && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="zone-card border border-[rgba(0,245,255,0.2)] p-4"
        >
          <div className="zone-label mb-3">NEW DEADLINE</div>
          <form onSubmit={handleAddDeadline} className="grid grid-cols-2 gap-3">
            <input
              className="nexus-input col-span-2"
              placeholder="Deadline title"
              value={deadlineForm.title}
              onChange={e => setDeadlineForm(p => ({ ...p, title: e.target.value }))}
              required
            />
            <select
              className="nexus-input"
              value={deadlineForm.type}
              onChange={e => setDeadlineForm(p => ({ ...p, type: e.target.value }))}
            >
              <option value="assignment">Assignment</option>
              <option value="exam">Exam</option>
              <option value="practical">Practical</option>
              <option value="project">Project</option>
              <option value="quiz">Quiz</option>
            </select>
            <input
              className="nexus-input"
              type="datetime-local"
              value={deadlineForm.dueDate}
              onChange={e => setDeadlineForm(p => ({ ...p, dueDate: e.target.value }))}
              required
            />
            <div className="flex items-center gap-2">
              <label className="terminal-text text-nexus-text-dim text-xs whitespace-nowrap">WEIGHT %</label>
              <input
                className="nexus-input flex-1"
                type="number" min="0" max="100"
                value={deadlineForm.weight}
                onChange={e => setDeadlineForm(p => ({ ...p, weight: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="nexus-btn-green nexus-btn">
                {submitting ? 'SAVING...' : 'CONFIRM'}
              </button>
              <button type="button" onClick={() => setShowAddDeadline(false)} className="nexus-btn">
                CANCEL
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Deadlines */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="zone-card border border-[rgba(74,101,128,0.25)] p-4"
      >
        <div className="zone-label mb-3">ACTIVE DEADLINES ({upcoming.length})</div>
        {upcoming.length === 0 ? (
          <p className="terminal-text text-nexus-text-dim text-xs">NO ACTIVE DEADLINES</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map(d => {
              const daysLeft = Math.ceil((new Date(d.dueDate) - now) / (1000 * 60 * 60 * 24));
              const dColor = daysLeft <= 2 ? '#ff2d55' : daysLeft <= 7 ? '#ff9f0a' : '#30d158';
              return (
                <div key={d.id} className="flex items-center gap-4 p-2 border border-[rgba(74,101,128,0.2)] hover:border-[rgba(74,101,128,0.4)] transition-all">
                  <button
                    onClick={() => toggleDeadlineComplete(d.id, id)}
                    className="w-4 h-4 border border-[rgba(74,101,128,0.4)] shrink-0 hover:border-nexus-cyan transition-colors"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="terminal-text text-sm text-nexus-text-mid">{d.title}</div>
                    <div className="terminal-text text-[10px] text-nexus-text-dim">
                      {d.type?.toUpperCase()} · {format(new Date(d.dueDate), 'dd MMM yyyy HH:mm')} · {d.weight}% weight
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="display-text text-lg font-black" style={{ color: dColor }}>{daysLeft}d</div>
                    <div className="terminal-text text-[9px]" style={{ color: dColor }}>REMAINING</div>
                  </div>
                  <button
                    onClick={() => deleteDeadline(d.id, id)}
                    className="terminal-text text-nexus-text-dim text-xs hover:text-nexus-red transition-colors ml-2"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {completed.length > 0 && (
          <div className="mt-4">
            <div className="zone-label mb-2 text-nexus-green">COMPLETED ({completed.length})</div>
            {completed.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-2 opacity-40">
                <button
                  onClick={() => toggleDeadlineComplete(d.id, id)}
                  className="w-4 h-4 border border-nexus-green bg-nexus-green shrink-0"
                />
                <div className="terminal-text text-sm text-nexus-text-dim line-through">{d.title}</div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Study Log */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="zone-card border border-[rgba(74,101,128,0.25)] p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="zone-label">STUDY LOG ({sessions.length} SESSIONS)</div>
          <div className="terminal-text text-xs text-nexus-text-dim">
            THIS WEEK: {sessions.filter(s => new Date(s.startTime) >= new Date(now - 7*24*60*60*1000)).length}
            / {subject.weeklyTarget} TARGET
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-[rgba(74,101,128,0.2)] mb-3 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, (sessions.filter(s =>
                new Date(s.startTime) >= new Date(now - 7*24*60*60*1000)
              ).length / subject.weeklyTarget) * 100)}%`,
              backgroundColor: color,
            }}
          />
        </div>

        {sessions.length === 0 ? (
          <p className="terminal-text text-nexus-text-dim text-xs">NO SESSIONS LOGGED</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-auto">
            {sessions.slice(0, 20).map(s => (
              <div key={s.id} className="flex items-center gap-4 terminal-text text-xs p-1.5 border border-[rgba(74,101,128,0.15)]">
                <span className="text-nexus-text-dim w-28 shrink-0">
                  {format(new Date(s.startTime), 'dd MMM HH:mm')}
                </span>
                <span className="text-nexus-text-mid">{s.duration}m</span>
                <span className="text-nexus-text-dim">
                  FOCUS: {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} style={{ color: i < s.focusRating ? '#00f5ff' : '#4a6580' }}>●</span>
                  ))}
                </span>
                <span className="text-nexus-text-dim truncate">{s.missionLog}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
