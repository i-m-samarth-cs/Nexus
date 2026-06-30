import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/index.js';
import Layout from './components/Layout.jsx';
import WarRoom from './pages/WarRoom.jsx';
import SubjectCommand from './pages/SubjectCommand.jsx';
import IntelligenceReport from './pages/IntelligenceReport.jsx';
import Setup from './pages/Setup.jsx';
import Profile from './pages/Profile.jsx';
import Auth from './pages/Auth.jsx';

function ProtectedRoute({ children }) {
  const { user, authLoading } = useStore();
  if (authLoading) return <BootingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

function BootingScreen() {
  return (
    <div className="min-h-screen bg-nexus-bg flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="display-text text-nexus-cyan text-2xl font-black tracking-widest">NEXUS</div>
        <div className="terminal-text text-nexus-text-dim text-sm animate-pulse">INITIALIZING...</div>
      </div>
    </div>
  );
}

export default function App() {
  const checkAuth = useStore(s => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<WarRoom />} />
          <Route path="subject/:id" element={<SubjectCommand />} />
          <Route path="intelligence" element={<IntelligenceReport />} />
          <Route path="setup" element={<Setup />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
