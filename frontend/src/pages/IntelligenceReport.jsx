import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { useStore } from '../store/index.js';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_BACK = 7;

export default function IntelligenceReport() {
  const { subjects } = useStore();

  const now = new Date();
  const allSessions = useMemo(() => {
    return subjects.flatMap(s =>
      (s.studySessions || []).map(sess => ({ ...sess, subjectName: s.name, subjectColor: s.color }))
    );
  }, [subjects]);

  // Heatmap: 7 days × 24 hours
  const heatmap = useMemo(() => {
    const grid = {};
    allSessions.forEach(s => {
      const d = new Date(s.startTime);
      const dayKey = format(d, 'yyyy-MM-dd');
      const hour = d.getHours();
      const key = `${dayKey}_${hour}`;
      grid[key] = (grid[key] || 0) + (s.duration || 0);
    });
    return grid;
  }, [allSessions]);

  const last7Days = Array.from({ length: DAYS_BACK }, (_, i) =>
    format(subDays(now, DAYS_BACK - 1 - i), 'yyyy-MM-dd')
  );

  const maxHeat = Math.max(1, ...Object.values(heatmap));

  // Subject distribution
  const distribution = useMemo(() => {
    const totals = {};
    subjects.forEach(s => {
      const mins = (s.studySessions || []).reduce((a, sess) => a + (sess.duration || 0), 0);
      if (mins > 0) totals[s.name] = { mins, color: s.color };
    });
    return Object.entries(totals).map(([name, { mins, color }]) => ({ name, value: mins, color }));
  }, [subjects]);

  // Focus trend: average focus per day
  const focusTrend = useMemo(() => {
    return last7Days.map(day => {
      const daySessions = allSessions.filter(s =>
        format(new Date(s.startTime), 'yyyy-MM-dd') === day
      );
      const avg = daySessions.length
        ? daySessions.reduce((a, s) => a + (s.focusRating || 3), 0) / daySessions.length
        : null;
      return { day: format(new Date(day), 'EEE'), avg };
    });
  }, [allSessions, last7Days]);

  const totalMinutes = allSessions.reduce((a, s) => a + (s.duration || 0), 0);
  const totalSessions = allSessions.length;
  const avgFocus = totalSessions
    ? (allSessions.reduce((a, s) => a + (s.focusRating || 3), 0) / totalSessions).toFixed(1)
    : '–';

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="display-text text-2xl font-black text-nexus-cyan tracking-wider mb-1">
          INTELLIGENCE REPORT
        </div>
        <div className="terminal-text text-nexus-text-dim text-xs">
          {format(now, 'EEEE dd MMMM yyyy')} — ACADEMIC PERFORMANCE ANALYSIS
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'TOTAL HOURS LOGGED', value: `${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}m` },
          { label: 'SESSIONS COMPLETED', value: totalSessions },
          { label: 'AVERAGE FOCUS', value: `${avgFocus}/5` },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="zone-card border border-[rgba(74,101,128,0.25)] p-4 text-center"
          >
            <div className="display-text text-3xl font-black text-nexus-cyan mb-1">{stat.value}</div>
            <div className="zone-label">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Heatmap */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="zone-card border border-[rgba(74,101,128,0.25)] p-4"
      >
        <div className="zone-label mb-3">STUDY HEATMAP — LAST 7 DAYS</div>
        <div className="overflow-auto">
          <div className="flex gap-1" style={{ minWidth: 600 }}>
            {/* Hour labels */}
            <div className="flex flex-col gap-0.5 mr-2">
              <div className="h-6" /> {/* header spacer */}
              {HOURS.filter(h => h % 3 === 0).map(h => (
                <div key={h} className="terminal-text text-[8px] text-nexus-text-dim h-3 flex items-center">
                  {String(h).padStart(2, '0')}h
                </div>
              ))}
            </div>

            {last7Days.map(day => (
              <div key={day} className="flex-1 flex flex-col gap-0.5">
                <div className="terminal-text text-[9px] text-nexus-text-dim text-center h-6 flex items-center justify-center">
                  {format(new Date(day), 'EEE dd')}
                </div>
                {HOURS.filter(h => h % 3 === 0).map(h => {
                  const mins = heatmap[`${day}_${h}`] || 0;
                  const intensity = mins / maxHeat;
                  return (
                    <div
                      key={h}
                      className="h-3 rounded-sm"
                      title={`${mins}m`}
                      style={{
                        backgroundColor: intensity > 0
                          ? `rgba(0,245,255,${0.1 + intensity * 0.8})`
                          : 'rgba(74,101,128,0.1)',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Subject distribution */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="zone-card border border-[rgba(74,101,128,0.25)] p-4"
        >
          <div className="zone-label mb-3">STUDY TIME DISTRIBUTION</div>
          {distribution.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie
                    data={distribution}
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {distribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {distribution.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="terminal-text text-[10px] text-nexus-text-mid">{d.name}</span>
                    <span className="terminal-text text-[10px] text-nexus-text-dim">{d.value}m</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <span className="terminal-text text-nexus-text-dim text-xs">NO DATA</span>
            </div>
          )}
        </motion.div>

        {/* Focus trend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.38 }}
          className="zone-card border border-[rgba(74,101,128,0.25)] p-4"
        >
          <div className="zone-label mb-3">FOCUS QUALITY TREND</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={focusTrend} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,101,128,0.15)" />
              <XAxis
                dataKey="day"
                tick={{ fill: '#4a6580', fontSize: 9, fontFamily: 'Share Tech Mono' }}
                axisLine={{ stroke: '#4a6580' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 5]}
                tick={{ fill: '#4a6580', fontSize: 9, fontFamily: 'Share Tech Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ background: '#0d1420', border: '1px solid #4a6580', fontSize: 10 }}
                labelStyle={{ color: '#4a6580' }}
                itemStyle={{ color: '#00f5ff' }}
              />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#00f5ff"
                strokeWidth={2}
                dot={{ fill: '#00f5ff', r: 3, strokeWidth: 0 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
