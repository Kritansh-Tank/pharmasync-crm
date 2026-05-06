import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, ClipboardList, Wrench,
  Pill, ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import LogInteraction from './pages/LogInteraction';
import InteractionHistory from './pages/InteractionHistory';
import ToolDemo from './pages/ToolDemo';
import HCPDetail from './pages/HCPDetail';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/log', icon: FilePlus, label: 'Log Interaction' },
  { to: '/history', icon: ClipboardList, label: 'History' },
  { to: '/tools', icon: Wrench, label: 'AI Tools Demo' },
];

export default function App() {
  const [open, setOpen] = useState(true);

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: open ? 'var(--sidebar-width)' : 64,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.22s ease',
          flexShrink: 0,
          position: 'sticky', top: 0, height: '100vh',
          zIndex: 20, overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}>

          {/* Logo */}
          <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Pill size={18} color="white" />
            </div>
            {open && (
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.2 }}>PharmaSync</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>AI-First CRM</div>
              </div>
            )}
          </div>

          {/* Nav links */}
          <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV.map(({ to, icon: Icon, label, end }) => (
              <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '10px 12px', borderRadius: 8,
                textDecoration: 'none', fontSize: 14, fontWeight: 500,
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-light)' : 'transparent',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap', overflow: 'hidden',
              })}
                onMouseEnter={e => { if (!e.currentTarget.dataset.active) { e.currentTarget.style.background = 'var(--bg-hover)'; } }}
                onMouseLeave={e => { if (!e.currentTarget.dataset.active) { e.currentTarget.style.background = ''; } }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {open && <span>{label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Collapse toggle */}
          <button onClick={() => setOpen(o => !o)} style={{
            margin: '12px 8px', padding: '9px 12px',
            borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--bg-hover)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: open ? 'flex-end' : 'center',
            color: 'var(--text-muted)', transition: 'all 0.15s',
          }}>
            {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </aside>

        {/* ── Main ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Topbar */}
          <header style={{
            padding: '14px 28px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0, zIndex: 10,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              AI-First HCP CRM &nbsp;·&nbsp;
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>llama-3.1-8b-instant</span>
              &nbsp;via Groq
            </span>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 13px', borderRadius: 20,
              background: '#ecfdf5', border: '1px solid #a7f3d0',
              fontSize: 12, fontWeight: 600, color: '#059669',
            }}>
              <Zap size={12} fill="#059669" color="#059669" style={{ animation: 'pulse 2s infinite' }} />
              LangGraph Active
            </div>
          </header>

          <main style={{ flex: 1, overflowY: 'auto' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/log" element={<LogInteraction />} />
              <Route path="/history" element={<InteractionHistory />} />
              <Route path="/tools" element={<ToolDemo />} />
              <Route path="/hcp/:id" element={<HCPDetail />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
