import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWarRoomStore } from '../../store/warRoomStore.js';
import { riskColor } from '../../utils/riskScore.js';

export default function SubjectGrid({ subjects }) {
  const navigate = useNavigate();
  const { setWidgetSubject } = useWarRoomStore();

  if (!subjects?.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="terminal-text text-nexus-text-dim text-xs">NO SUBJECTS FOUND</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 h-full overflow-auto pr-1">
      {subjects.map((subject, i) => {
        const color = subject.riskColor || riskColor(subject.riskScore || 0);
        
        return (
          <motion.div
            key={subject.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setWidgetSubject(subject)}
            className="zone-card border border-[rgba(74,101,128,0.25)] flex flex-col justify-between group hover:border-[rgba(0,245,255,0.4)] transition-all cursor-pointer"
            style={{ 
              background: `linear-gradient(135deg, ${color}08, transparent)`
            }}
          >
            <div className="p-3 pb-2">
              <div className="flex justify-between items-start mb-1">
                <h3 className="display-text text-sm font-bold text-nexus-cyan group-hover:text-white transition-colors truncate">
                  {subject.name}
                </h3>
                <span className="display-text text-lg font-black leading-none tabular-nums" style={{ color }}>
                  {subject.riskScore || 0}
                </span>
              </div>
              <div className="terminal-text text-[9px] text-nexus-text-dim">
                {subject.weeklyTarget} SESSIONS / WK
              </div>
            </div>

            <div className="px-3 pb-3 mt-auto flex justify-between items-center">
              <span 
                className="terminal-text text-[10px]"
                style={{ color: color }}
              >
                ▶ START MISSION
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/subject/${subject.id}`);
                }}
                className="terminal-text text-[9px] text-nexus-text-dim hover:text-white transition-colors border-b border-transparent hover:border-white"
              >
                VIEW INTEL
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
