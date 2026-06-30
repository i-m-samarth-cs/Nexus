import { useMemo } from 'react';
import { addDays, format, differenceInDays } from 'date-fns';

const TOTAL_DAYS = 30;

export default function SectorMap({ subjects }) {
  const now = new Date();

  const events = useMemo(() => {
    const all = [];
    subjects.forEach(s => {
      (s.deadlines || []).forEach(d => {
        if (d.isComplete) return;
        const due = new Date(d.dueDate);
        const dayOffset = differenceInDays(due, now);
        if (dayOffset < 0 || dayOffset > TOTAL_DAYS) return;
        all.push({
          id: d.id,
          title: d.title,
          type: d.type,
          dayOffset,
          color: s.color,
          subjectName: s.name,
          dueDate: due,
        });
      });
    });
    return all.sort((a, b) => a.dayOffset - b.dayOffset);
  }, [subjects]);

  // Find collision zones: multiple deadlines within 3 days of each other
  const collisions = useMemo(() => {
    const zones = [];
    for (let i = 0; i < events.length - 1; i++) {
      const group = [events[i]];
      for (let j = i + 1; j < events.length; j++) {
        if (events[j].dayOffset - events[i].dayOffset <= 3) {
          group.push(events[j]);
        } else break;
      }
      if (group.length > 1) {
        zones.push({
          start: group[0].dayOffset,
          end: group[group.length - 1].dayOffset,
          count: group.length,
        });
        i += group.length - 1;
      }
    }
    return zones;
  }, [events]);

  const pct = (day) => `${(day / TOTAL_DAYS) * 100}%`;

  return (
    <div className="relative w-full" style={{ height: 80 }}>
      {/* Timeline axis */}
      <div className="absolute bottom-6 left-0 right-0 h-px bg-[rgba(74,101,128,0.3)]" />

      {/* Day markers */}
      {[0, 7, 14, 21, 30].map(day => (
        <div
          key={day}
          className="absolute bottom-0"
          style={{ left: pct(day), transform: 'translateX(-50%)' }}
        >
          <div className="w-px h-2 bg-[rgba(74,101,128,0.4)] mx-auto mb-1" />
          <span className="terminal-text text-[8px] text-nexus-text-dim block text-center w-8 -ml-3.5">
            {day === 0 ? 'TODAY' : `+${day}d`}
          </span>
        </div>
      ))}

      {/* Collision zones */}
      {collisions.map((zone, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `calc(${pct(zone.start)} - 4px)`,
            width: `calc(${pct(zone.end - zone.start)} + 8px)`,
            top: 2,
            bottom: 24,
            background: 'rgba(255,45,85,0.08)',
            border: '1px solid rgba(255,45,85,0.3)',
          }}
        >
          <span
            className="display-text text-[7px] absolute -top-3 left-0 whitespace-nowrap"
            style={{ color: '#ff2d55' }}
          >
            ▲ COLLISION ZONE
          </span>
        </div>
      ))}

      {/* Deadline markers */}
      {events.map(ev => (
        <div
          key={ev.id}
          className="absolute group"
          style={{ left: pct(ev.dayOffset), bottom: 24, transform: 'translateX(-50%)' }}
        >
          <div
            className="w-2.5 h-2.5 rotate-45 border"
            style={{ backgroundColor: ev.color, borderColor: ev.color, boxShadow: `0 0 6px ${ev.color}` }}
          />
          {/* Tooltip */}
          <div className="hidden group-hover:block absolute bottom-5 left-1/2 -translate-x-1/2 w-36 p-2 bg-nexus-bg-2 border border-[rgba(74,101,128,0.5)] z-50 pointer-events-none">
            <div className="terminal-text text-[9px]" style={{ color: ev.color }}>{ev.subjectName}</div>
            <div className="terminal-text text-[9px] text-nexus-text-mid truncate">{ev.title}</div>
            <div className="terminal-text text-[9px] text-nexus-text-dim">
              {format(ev.dueDate, 'dd MMM')} · {ev.type}
            </div>
          </div>
        </div>
      ))}

      {events.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pb-6">
          <span className="terminal-text text-nexus-text-dim text-xs">NO DEADLINES IN NEXT 30 DAYS</span>
        </div>
      )}
    </div>
  );
}
