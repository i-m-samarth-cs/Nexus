import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { riskColor } from '../../utils/riskScore.js';
import { useWarRoomStore } from '../../store/warRoomStore.js';

export default function ThreatMatrix({ subjects }) {
  const navigate = useNavigate();
  const { setWidgetSubject } = useWarRoomStore();
  const [hovered, setHovered] = useState(null);

  const dots = useMemo(() => subjects.map(s => {
    const now = new Date();
    const upcoming = (s.deadlines || [])
      .filter(d => !d.isComplete && new Date(d.dueDate) > now)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const daysRemaining = upcoming.length > 0
      ? Math.ceil((new Date(upcoming[0].dueDate) - now) / (1000 * 60 * 60 * 24))
      : 30;

    return {
      id: s.id,
      name: s.name,
      score: s.riskScore,
      daysRemaining: Math.min(daysRemaining, 30),
      color: riskColor(s.riskScore),
      level: s.riskLevel,
      nextDeadline: upcoming[0],
      sessions: (s.studySessions || []).length,
    };
  }), [subjects]);

  // Map daysRemaining (0–30) → x%, score (0–100) → y%
  const toX = (days) => `${8 + (days / 30) * 84}%`;
  const toY = (score) => `${8 + (1 - score / 100) * 84}%`;

  const breatheClass = (level) => {
    if (level === 'critical') return 'dot-breathe-critical';
    if (level === 'elevated') return 'dot-breathe-elevated';
    return 'dot-breathe-safe';
  };

  return (
    <div className="relative w-full h-full" style={{ minHeight: 220 }}>
      {/* Axis labels */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 zone-label" style={{ fontSize: 9 }}>
        DAYS REMAINING →
      </div>
      <div className="absolute left-1 top-1/2 -translate-y-1/2 zone-label" style={{ fontSize: 9, writingMode: 'vertical-rl', transform: 'rotate(180deg) translateY(50%)' }}>
        ↑ RISK
      </div>

      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.08 }}>
        {[25, 50, 75].map(p => (
          <g key={p}>
            <line x1={`${p}%`} y1="5%" x2={`${p}%`} y2="95%" stroke="#4a6580" strokeDasharray="3,3" />
            <line x1="5%" y1={`${p}%`} x2="95%" y2={`${p}%`} stroke="#4a6580" strokeDasharray="3,3" />
          </g>
        ))}
        {/* Danger zone background */}
        <rect x="5%" y="5%" width="30%" height="90%" fill="#ff2d55" opacity="0.04" />
      </svg>

      {/* Dots */}
      {dots.map(dot => (
        <div
          key={dot.id}
          className={`absolute cursor-pointer ${breatheClass(dot.level)}`}
          style={{
            left: toX(dot.daysRemaining),
            top: toY(dot.score),
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
          }}
          onClick={() => navigate(`/subject/${dot.id}`)}
          onMouseEnter={() => setHovered(dot.id)}
          onMouseLeave={() => setHovered(null)}
        >
          <div
            className="rounded-full border-2 transition-all"
            style={{
              width: 14,
              height: 14,
              backgroundColor: dot.color,
              borderColor: dot.color,
              boxShadow: `0 0 ${dot.level === 'critical' ? 12 : 8}px ${dot.color}`,
            }}
          />

          {/* Hover popover */}
          {hovered === dot.id && (
            <div
              className="absolute z-50 w-48 p-3 bg-nexus-bg-2 border border-[rgba(74,101,128,0.5)] text-left"
              style={{ left: 20, top: -10, pointerEvents: 'none' }}
            >
              <div className="display-text text-[10px] font-bold mb-1" style={{ color: dot.color }}>
                {dot.name}
              </div>
              <div className="terminal-text text-[10px] text-nexus-text-dim space-y-0.5">
                <div>RISK SCORE: <span style={{ color: dot.color }}>{dot.score}</span></div>
                <div>DAYS LEFT: {dot.daysRemaining}</div>
                <div>SESSIONS (14d): {dot.sessions}</div>
                {dot.nextDeadline && (
                  <div className="mt-1 text-nexus-text-mid">
                    NEXT: {dot.nextDeadline.title}
                  </div>
                )}
                <button 
                  className="nexus-btn-green mt-2 w-full text-[10px]" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    const fullSubject = subjects.find(s => s.id === dot.id);
                    if (fullSubject) setWidgetSubject(fullSubject);
                  }}
                >
                  COMMENCE MISSION
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {dots.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="terminal-text text-nexus-text-dim text-xs">NO TARGETS ACQUIRED</span>
        </div>
      )}
    </div>
  );
}
