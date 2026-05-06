import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Users, ClipboardList, TrendingUp, Building2, MapPin,
  ArrowRight, ThumbsUp, Phone, Mail, Calendar,
} from 'lucide-react';
import { loadHCPs } from '../store/hcpsSlice';
import { loadInteractions } from '../store/interactionsSlice';

const SPECIALTY_COLORS = {
  Oncology:          { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  Cardiology:        { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  Neurology:         { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
  'Internal Medicine':{ bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  Endocrinology:     { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
};

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="card fade-in" style={{ padding: 22, display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 50, height: 50, borderRadius: 12, flexShrink: 0,
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

function HCPCard({ hcp }) {
  const sc = SPECIALTY_COLORS[hcp.specialty] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
  return (
    <Link to={`/hcp/${hcp.id}`} style={{ textDecoration: 'none' }}>
      <div className="card fade-in" style={{
        padding: 18, cursor: 'pointer',
        borderLeft: `3px solid ${sc.color}`,
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: sc.bg, border: `1px solid ${sc.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Users size={18} color={sc.color} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{hcp.name}</div>
            <span style={{ ...sc, padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, display: 'inline-block', background: sc.bg, border: `1px solid ${sc.border}` }}>
              {hcp.specialty}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {hcp.hospital && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <Building2 size={12} /> {hcp.hospital}
            </div>
          )}
          {hcp.territory && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <MapPin size={12} /> {hcp.territory}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const { list: hcps, loading: hl } = useSelector(s => s.hcps);
  const { list: interactions, loading: il } = useSelector(s => s.interactions);

  useEffect(() => { dispatch(loadHCPs()); dispatch(loadInteractions()); }, [dispatch]);

  const positiveCount = interactions.filter(i => i.sentiment === 'positive').length;
  const recent = interactions.slice(0, 5);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-subtitle">Welcome back — here's your territory at a glance</div>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 28 }}>
        <StatCard icon={Users} label="Total HCPs" value={hcps.length} color="#6366f1" bg="#eef2ff" />
        <StatCard icon={ClipboardList} label="Interactions Logged" value={interactions.length} color="#059669" bg="#ecfdf5" />
        <StatCard icon={ThumbsUp} label="Positive Sentiment" value={positiveCount} color="#d97706" bg="#fffbeb" />
      </div>

      <div className="grid-2">
        {/* HCPs */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>HCP Directory</h2>
            <Link to="/log" className="btn btn-primary btn-sm">
              <ClipboardList size={14} /> Log Interaction
            </Link>
          </div>
          {hl ? (
            <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></div>
          ) : hcps.length === 0 ? (
            <div className="empty-state"><div className="icon"><Users size={40} /></div><p>No HCPs found</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {hcps.map(h => <HCPCard key={h.id} hcp={h} />)}
            </div>
          )}
        </div>

        {/* Recent interactions */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Interactions</h2>
            <Link to="/history" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {il ? (
            <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></div>
          ) : recent.length === 0 ? (
            <div className="empty-state"><div className="icon"><ClipboardList size={40} /></div><p>No interactions yet</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recent.map(i => (
                <div key={i.id} className="card fade-in" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{i.hcp?.name}</span>
                    <span className={`badge badge-${i.sentiment}`}>{i.sentiment}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span className={`badge badge-${i.interaction_type}`}>{i.interaction_type}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                      <Calendar size={11} /> {i.date}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {(i.ai_summary || i.notes || '').slice(0, 110)}…
                  </div>
                  {i.next_action && (
                    <div style={{ marginTop: 10, padding: '7px 11px', background: 'var(--accent-light)', borderRadius: 7, fontSize: 12, color: 'var(--accent)', fontWeight: 500, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <ArrowRight size={13} style={{ marginTop: 1, flexShrink: 0 }} /> {i.next_action}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
