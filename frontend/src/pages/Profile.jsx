import { useState } from 'react';
import { useStore } from '../store/index.js';
import { motion } from 'framer-motion';

export default function Profile() {
  const { user, updateProfile } = useStore();
  const [name, setName] = useState(user?.name || 'Operative');
  const [color, setColor] = useState(user?.color || '#00f5ff');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await updateProfile({ name, color });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="display-text text-2xl font-black text-nexus-cyan">OPERATIVE PROFILE</h1>
        <div className="terminal-text text-nexus-text-dim text-xs mt-1">UPDATE YOUR INTEL</div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="zone-card border border-[rgba(74,101,128,0.25)] p-5"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="zone-label block mb-2">CALLSIGN / NAME</label>
            <input
              type="text"
              className="nexus-input w-full"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Ghost"
            />
          </div>

          <div>
            <label className="zone-label block mb-2">SIGNATURE COLOR</label>
            <div className="flex gap-3">
              <input
                type="color"
                className="w-12 h-12 bg-transparent border-0 cursor-pointer"
                value={color}
                onChange={e => setColor(e.target.value)}
              />
              <input
                type="text"
                className="nexus-input flex-1"
                value={color}
                onChange={e => setColor(e.target.value)}
                placeholder="#00f5ff"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="nexus-btn-green nexus-btn w-full disabled:opacity-50"
          >
            {saving ? 'UPDATING...' : (success ? 'PROFILE SAVED' : 'SAVE PROFILE')}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
