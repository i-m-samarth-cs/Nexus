import { useState } from 'react';
import { useWarRoomStore } from '../../store/warRoomStore.js';
import { useStore } from '../../store/index.js';
import { motion } from 'framer-motion';

export default function JoinWarRoom() {
  const { createRoom, joinRoom, error } = useWarRoomStore();
  const { user, updateProfile } = useStore();
  const [mode, setMode] = useState('join'); // 'join' or 'create'
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  // Profile gate state
  const isDefaultProfile = user?.name === 'Operative' || !user?.name;
  const [profileName, setProfileName] = useState(user?.name === 'Operative' ? '' : (user?.name || ''));
  const [profileColor, setProfileColor] = useState(user?.color || '#00f5ff');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    setLoading(true);
    try {
      await updateProfile({ name: profileName, color: profileColor });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    setLoading(true);
    try {
      if (mode === 'join') {
        await joinRoom(inputValue.trim().toUpperCase());
      } else {
        await createRoom(inputValue.trim());
      }
    } catch (err) {
      // error is handled in store
    } finally {
      setLoading(false);
    }
  };

  if (isDefaultProfile) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full space-y-6"
      >
        <div className="text-center">
          <div className="terminal-text text-nexus-text-dim text-xs tracking-widest mb-2">
            INITIALIZATION
          </div>
          <h2 className="display-text text-xl font-black text-nexus-cyan">
            ESTABLISH IDENTITY
          </h2>
        </div>
        <div className="zone-card border border-[rgba(74,101,128,0.25)] p-5 w-full max-w-sm">
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="zone-label block mb-2">CALLSIGN</label>
              <input
                type="text"
                className="nexus-input w-full text-center tracking-widest uppercase"
                placeholder="E.G. GHOST"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="zone-label block mb-2">SIGNATURE COLOR</label>
              <div className="flex justify-center gap-4">
                {['#00f5ff', '#ff2d55', '#ff9f0a', '#32d74b', '#bf5af2'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setProfileColor(c)}
                    className="w-8 h-8 rounded-full border-2 transition-all"
                    style={{ 
                      backgroundColor: c, 
                      borderColor: profileColor === c ? '#fff' : 'transparent',
                      transform: profileColor === c ? 'scale(1.2)' : 'scale(1)'
                    }}
                  />
                ))}
              </div>
            </div>
            <button 
              type="submit" 
              disabled={!profileName.trim() || loading}
              className="nexus-btn-green nexus-btn w-full disabled:opacity-30 mt-4"
            >
              {loading ? 'SAVING...' : 'CONFIRM IDENTITY'}
            </button>
          </form>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div  
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full space-y-6"
    >
      <div className="text-center">
        <div className="terminal-text text-nexus-text-dim text-xs tracking-widest mb-2">
          MULTIPLAYER CONNECT
        </div>
        <h2 className="display-text text-xl font-black text-nexus-cyan">
          WAR ROOM OFFLINE
        </h2>
      </div>

      <div className="zone-card border border-[rgba(74,101,128,0.25)] p-5 w-full max-w-sm">
        <div className="flex gap-2 mb-4">
          <button 
            className={`flex-1 text-xs py-1 ${mode === 'join' ? 'bg-[rgba(0,245,255,0.15)] text-nexus-cyan border border-nexus-cyan' : 'text-nexus-text-dim border border-transparent'}`}
            onClick={() => { setMode('join'); setInputValue(''); }}
          >
            JOIN
          </button>
          <button 
            className={`flex-1 text-xs py-1 ${mode === 'create' ? 'bg-[rgba(0,245,255,0.15)] text-nexus-cyan border border-nexus-cyan' : 'text-nexus-text-dim border border-transparent'}`}
            onClick={() => { setMode('create'); setInputValue(''); }}
          >
            CREATE
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="zone-label block mb-2">
              {mode === 'join' ? 'ENTER PASSCODE' : 'WAR ROOM NAME'}
            </label>
            <input
              type="text"
              className="nexus-input w-full text-center tracking-widest uppercase"
              placeholder={mode === 'join' ? '6-CHAR CODE' : 'E.G. ALPHA SQUAD'}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              disabled={loading}
              maxLength={mode === 'join' ? 6 : 30}
            />
          </div>

          {error && (
            <div className="terminal-text text-[10px] text-nexus-red text-center">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={!inputValue.trim() || loading}
            className="nexus-btn-green nexus-btn w-full disabled:opacity-30"
          >
            {loading ? 'CONNECTING...' : (mode === 'join' ? 'INITIATE UPLINK' : 'ESTABLISH ROOM')}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
