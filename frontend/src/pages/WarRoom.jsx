import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/index.js';
import ThreatMatrix from '../components/warroom/ThreatMatrix.jsx';
import SubjectGrid from '../components/warroom/SubjectGrid.jsx';
import MissionQueue from '../components/warroom/MissionQueue.jsx';
import ActiveCountdowns from '../components/warroom/ActiveCountdowns.jsx';
import CommsIntelligence from '../components/warroom/CommsIntelligence.jsx';
import SectorMap from '../components/warroom/SectorMap.jsx';
import JoinWarRoom from '../components/warroom/JoinWarRoom.jsx';
import { useWarRoomStore } from '../store/warRoomStore.js';

const ZONES = [
  { key: 'threat',    label: 'THREAT MATRIX',      delay: 0.15 },
  { key: 'mission',   label: 'MISSION QUEUE',       delay: 0.30 },
  { key: 'countdown', label: 'ACTIVE COUNTDOWNS',   delay: 0.45 },
  { key: 'comms',     label: 'COMMS INTELLIGENCE',  delay: 0.60 },
  { key: 'sector',    label: 'SECTOR MAP',           delay: 0.75 },
];

function ZoneCard({ label, delay, children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`zone-card border border-[rgba(74,101,128,0.25)] p-3 flex flex-col ${className}`}
    >
      <div className="zone-label mb-2 pb-2 border-b border-[rgba(74,101,128,0.2)] shrink-0">
        {label}
      </div>
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </motion.div>
  );
}

export default function WarRoom() {
  const { subjects, triage, triageLoading, loadTriage, bootComplete, setBootComplete } = useStore();
  const { warRoom, roomLoading, loadRoom, leaveRoom } = useWarRoomStore();
  const scanRef = useRef(null);
  const [showScan, setShowScan] = useState(!bootComplete);

  useEffect(() => {
    if (!bootComplete) {
      const timer = setTimeout(() => {
        setShowScan(false);
        setBootComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [bootComplete, setBootComplete]);

  useEffect(() => {
    loadTriage();
    loadRoom();
  }, [loadTriage, loadRoom]);

  if (roomLoading || !warRoom) {
    return (
      <div className="relative h-[calc(100vh-3rem)] p-3 overflow-hidden">
        {(showScan || roomLoading) && <div className="scanline-sweep" ref={scanRef} />}
        {!roomLoading && <JoinWarRoom />}
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-3rem)] p-3 overflow-hidden">
      {/* Boot scanline */}
      {showScan && <div className="scanline-sweep" ref={scanRef} />}

      {/* Asymmetric war room grid */}
      <div className="h-full grid gap-3" style={{
        gridTemplateColumns: '1.4fr 1fr',
        gridTemplateRows: '1fr 1fr 120px',
      }}>
        {/* Zone 1: Threat Matrix — top left, spans 2 rows */}
        <ZoneCard
          label={
            <div className="flex justify-between items-center w-full">
              <span>SUBJECTS & MISSIONS</span>
              <div className="flex gap-4 items-center">
                <span className="text-nexus-cyan text-[10px]">ROOM: {warRoom.name} (CODE: {warRoom.passcode})</span>
                <button onClick={leaveRoom} className="text-nexus-red text-[9px] hover:underline">DISCONNECT</button>
              </div>
            </div>
          }
          delay={0.15}
          className="row-span-2"
        >
          <SubjectGrid subjects={subjects} />
        </ZoneCard>

        {/* Zone 2: Mission Queue — right side */}
        <ZoneCard label="MISSION QUEUE" delay={0.3} className="row-span-2">
          <MissionQueue priorities={triage?.priorities || []} loading={triageLoading} />
        </ZoneCard>

        {/* Zone 4: Comms Intelligence — middle right */}
        <ZoneCard label="COMMS INTELLIGENCE" delay={0.60}>
          <CommsIntelligence
            briefing={triage?.briefing}
            loading={triageLoading}
          />
        </ZoneCard>

        {/* Zone 3: Active Countdowns — spans full width */}
        <ZoneCard label="ACTIVE MISSIONS / COUNTDOWNS" delay={0.45} className="col-span-2">
          <ActiveCountdowns subjects={subjects} />
        </ZoneCard>
      </div>

      {/* Zone 5: Sector Map — bottom strip */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.75 }}
        className="zone-card border border-[rgba(74,101,128,0.25)] p-3 mt-3"
      >
        <div className="zone-label mb-2">SECTOR MAP — NEXT 30 DAYS</div>
        <SectorMap subjects={subjects} />
      </motion.div>
    </div>
  );
}
