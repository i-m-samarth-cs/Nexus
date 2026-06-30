import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../store/index.js';
import { useWarRoomStore } from '../store/warRoomStore.js';
import SessionWidget from './warroom/SessionWidget.jsx';

const NAV_ITEMS = [
  { to: '/',             label: 'WAR ROOM',    icon: '⬡' },
  { to: '/intelligence', label: 'INTEL',       icon: '◈' },
  { to: '/setup',        label: 'SETUP',       icon: '◎' },
];

export default function Layout() {
  const { user, logout, subjects } = useStore();
  const { widgetSubject, setWidgetSubject, activeSessions } = useWarRoomStore();
  const navigate = useNavigate();

  const globalSession = user ? activeSessions[user.id] : null;

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-nexus-bg flex flex-col">
      {/* Top nav bar */}
      <header className="h-12 bg-nexus-bg-2 border-b border-[rgba(74,101,128,0.3)] flex items-center px-6 gap-8 shrink-0 z-50">
        <div className="display-text text-nexus-cyan font-black text-lg tracking-widest mr-4">NEXUS</div>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `terminal-text text-xs tracking-widest px-4 py-2 transition-all duration-150 ${
                  isActive
                    ? 'text-nexus-cyan border-b-2 border-nexus-cyan'
                    : 'text-nexus-text-dim hover:text-nexus-text-mid'
                }`
              }
            >
              <span className="mr-1">{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>

        {globalSession && (
          <button
            onClick={() => {
              const subject = subjects.find(s => s.id === globalSession.subjectId);
              if (subject) setWidgetSubject(subject);
            }}
            className="ml-2 terminal-text text-xs text-nexus-amber border border-[rgba(255,159,10,0.3)] px-3 py-1 hover:bg-[rgba(255,159,10,0.1)] transition-all animate-pulse"
          >
            ● MISSION ACTIVE
          </button>
        )}

        <div className="ml-auto flex items-center gap-4">
          <NavLink to="/profile" className="terminal-text text-nexus-text-dim text-xs hover:text-nexus-cyan transition-colors" style={{ color: user?.color }}>
            {user?.name || user?.email}
          </NavLink>
          <button onClick={handleLogout} className="nexus-btn text-[10px] py-1 px-3">LOGOUT</button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto relative">
        <Outlet />
      </main>

      {widgetSubject && (
        <SessionWidget 
          subject={widgetSubject} 
          onClose={() => setWidgetSubject(null)} 
        />
      )}
    </div>
  );
}
