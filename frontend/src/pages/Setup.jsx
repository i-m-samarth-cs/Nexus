import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/index.js';
import { useNavigate } from 'react-router-dom';

const PRESET_COLORS = [
  '#00f5ff', '#ff2d55', '#ff9f0a', '#30d158',
  '#bf5af2', '#0a84ff', '#ff6961', '#ffd60a',
];

function SubjectCard({ subject, onDelete }) {
  const { updateSubject } = useStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: subject.name,
    color: subject.color,
    difficulty: subject.difficulty,
    weeklyTarget: subject.weeklyTarget,
  });

  const handleSave = async () => {
    await updateSubject(subject.id, form);
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="zone-card border border-[rgba(74,101,128,0.25)] p-4"
    >
      {!editing ? (
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: subject.color, boxShadow: `0 0 6px ${subject.color}` }} />
          <div className="flex-1">
            <div className="display-text text-sm font-bold text-nexus-cyan">{subject.name}</div>
            <div className="terminal-text text-[10px] text-nexus-text-dim mt-0.5">
              DIFFICULTY: {subject.difficulty}/5 · TARGET: {subject.weeklyTarget} sessions/wk
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="nexus-btn text-[9px] py-0.5 px-2">EDIT</button>
            <button onClick={() => onDelete(subject.id)} className="nexus-btn-red nexus-btn text-[9px] py-0.5 px-2">DELETE</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            className="nexus-input w-full"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Subject name"
          />
          <div>
            <div className="zone-label mb-1.5">COLOR</div>
            <div className="flex gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setForm(p => ({ ...p, color: c }))}
                  className="w-6 h-6 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: form.color === c ? '#fff' : 'transparent',
                    boxShadow: form.color === c ? `0 0 8px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="zone-label mb-1">DIFFICULTY (1-5)</div>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(d => (
                  <button
                    key={d}
                    onClick={() => setForm(p => ({ ...p, difficulty: d }))}
                    className="flex-1 py-1 border terminal-text text-xs transition-all"
                    style={{
                      borderColor: d <= form.difficulty ? `${form.color}66` : 'rgba(74,101,128,0.3)',
                      backgroundColor: d <= form.difficulty ? `${form.color}15` : 'transparent',
                      color: d <= form.difficulty ? form.color : '#4a6580',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="zone-label mb-1">WEEKLY TARGET</div>
              <input
                className="nexus-input w-full"
                type="number" min="1" max="20"
                value={form.weeklyTarget}
                onChange={e => setForm(p => ({ ...p, weeklyTarget: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="nexus-btn-green nexus-btn">SAVE</button>
            <button onClick={() => setEditing(false)} className="nexus-btn">CANCEL</button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function Setup() {
  const { subjects, addSubject, deleteSubject } = useStore();
  const navigate = useNavigate();

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    name: '', color: '#00f5ff', difficulty: 3, weeklyTarget: 3,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addSubject(form);
      setShowAddForm(false);
      setForm({ name: '', color: '#00f5ff', difficulty: 3, weeklyTarget: 3 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="display-text text-2xl font-black text-nexus-cyan tracking-wider mb-1">
          WAR ROOM SETUP
        </div>
        <div className="terminal-text text-nexus-text-dim text-xs">
          CONFIGURE SUBJECTS, DIFFICULTY RATINGS, AND WEEKLY TARGETS
        </div>
      </motion.div>

      {/* Subject list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="zone-label">ACTIVE SUBJECTS ({subjects.length})</div>
          <button onClick={() => setShowAddForm(!showAddForm)} className="nexus-btn text-[10px]">
            + ADD SUBJECT
          </button>
        </div>

        {/* Add form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="zone-card border border-[rgba(0,245,255,0.2)] p-4 overflow-hidden"
            >
              <div className="zone-label mb-3">NEW SUBJECT</div>
              <form onSubmit={handleAdd} className="space-y-3">
                <input
                  className="nexus-input w-full"
                  placeholder="Subject name (e.g. DBMS, Algorithms)"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                />
                <div>
                  <div className="zone-label mb-1.5">COLOR</div>
                  <div className="flex gap-2">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, color: c }))}
                        className="w-7 h-7 rounded-full border-2 transition-all"
                        style={{
                          backgroundColor: c,
                          borderColor: form.color === c ? '#fff' : 'transparent',
                          boxShadow: form.color === c ? `0 0 10px ${c}` : 'none',
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="zone-label mb-1.5">DIFFICULTY (1–5)</div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(d => (
                        <button
                          type="button"
                          key={d}
                          onClick={() => setForm(p => ({ ...p, difficulty: d }))}
                          className="flex-1 py-1.5 border terminal-text text-xs transition-all"
                          style={{
                            borderColor: d <= form.difficulty ? `${form.color}66` : 'rgba(74,101,128,0.3)',
                            backgroundColor: d <= form.difficulty ? `${form.color}15` : 'transparent',
                            color: d <= form.difficulty ? form.color : '#4a6580',
                          }}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="zone-label mb-1.5">WEEKLY TARGET (SESSIONS)</div>
                    <input
                      className="nexus-input w-full"
                      type="number" min="1" max="20"
                      value={form.weeklyTarget}
                      onChange={e => setForm(p => ({ ...p, weeklyTarget: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={submitting} className="nexus-btn-green nexus-btn">
                    {submitting ? 'ADDING...' : 'ADD SUBJECT'}
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="nexus-btn">
                    CANCEL
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {subjects.map(s => (
            <SubjectCard key={s.id} subject={s} onDelete={deleteSubject} />
          ))}
        </AnimatePresence>

        {subjects.length === 0 && !showAddForm && (
          <div className="zone-card border border-[rgba(74,101,128,0.15)] p-8 text-center">
            <div className="terminal-text text-nexus-text-dim text-sm mb-4">
              NO SUBJECTS CONFIGURED.<br />ADD YOUR FIRST SUBJECT TO ACTIVATE THE WAR ROOM.
            </div>
            <button onClick={() => setShowAddForm(true)} className="nexus-btn">
              + ADD FIRST SUBJECT
            </button>
          </div>
        )}
      </div>

      {subjects.length > 0 && (
        <div className="flex justify-center pt-4">
          <button onClick={() => navigate('/')} className="nexus-btn-green nexus-btn">
            → ENTER WAR ROOM
          </button>
        </div>
      )}
    </div>
  );
}
