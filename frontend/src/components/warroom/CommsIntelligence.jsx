import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/index.js';

export default function CommsIntelligence({ briefing, loading }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const refreshTriage = useStore(s => s.refreshTriage);

  useEffect(() => {
    if (!briefing) return;
    setDisplayed('');
    setDone(false);
    indexRef.current = 0;

    const interval = setInterval(() => {
      if (indexRef.current < briefing.length) {
        setDisplayed(briefing.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, 18);

    return () => clearInterval(interval);
  }, [briefing]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-nexus-cyan animate-pulse" />
          <span className="terminal-text text-nexus-text-dim text-[9px]">NEXUS AI — DAILY BRIEF</span>
        </div>
        <button
          onClick={refreshTriage}
          className="nexus-btn text-[8px] py-0.5 px-2"
          disabled={loading}
        >
          REFRESH
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center gap-2 mt-4">
            <div className="w-1.5 h-1.5 rounded-full bg-nexus-cyan animate-pulse" />
            <span className="terminal-text text-nexus-text-dim text-xs animate-pulse">
              RUNNING TRIAGE ANALYSIS...
            </span>
          </div>
        ) : (
          <div className="terminal-text text-[11px] leading-relaxed text-nexus-text-mid">
            {displayed}
            {!done && (
              <span className="inline-block w-1.5 h-3 bg-nexus-cyan ml-0.5 animate-[typeCursor_1s_step-end_infinite]" />
            )}
          </div>
        )}
      </div>

      {done && (
        <div className="mt-2 terminal-text text-[9px] text-nexus-text-dim border-t border-[rgba(74,101,128,0.2)] pt-2">
          TRANSMISSION COMPLETE — {new Date().toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
