import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft, Mail, Phone, MapPin, Building2,
  Calendar, User, Package, ArrowRight, TrendingUp,
  ClipboardList, Star,
} from 'lucide-react';
import { loadHCP } from '../store/hcpsSlice';

const SPECIALTY_COLORS = {
  Oncology:           { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  Cardiology:         { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  Neurology:          { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
  'Internal Medicine':{ bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  Endocrinology:      { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
};

function InfoChip({ icon: Icon, label }) {
  if (!label) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
      <Icon size={14} color="var(--text-muted)" /> {label}
    </div>
  );
}

function StatPill({ value, label, color, bg }) {
  return (
    <div style={{ textAlign: 'center', padding: '14px 20px', background: bg, borderRadius: 10, minWidth: 100 }}>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function HCPDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { selected: hcp } = useSelector(s => s.hcps);

  useEffect(() => { dispatch(loadHCP(id)); }, [id, dispatch]);

  if (!hcp) return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
      <span className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );

  const interactions = hcp.interactions || [];
  const positiveCount = interactions.filter(i => i.sentiment === 'positive').length;
  const engagementScore = interactions.length
    ? Math.round((positiveCount / interactions.length) * 100) : 0;
  const sc = SPECIALTY_COLORS[hcp.specialty] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };

  return (
    <div className="page">
      {/* Back */}
      <Link to="/" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none',
        fontWeight: 500, marginBottom: 22,
        padding: '6px 12px', borderRadius: 8,
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)', transition: 'all 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
      >
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      {/* HCP Profile Card */}
      <div className="card" style={{ padding: 28, marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: 18, flexShrink: 0,
            background: sc.bg, border: `2px solid ${sc.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={32} color={sc.color} />
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>{hcp.name}</div>
            <div style={{ marginBottom: 12 }}>
              <span style={{
                padding: '3px 11px', borderRadius: 20,
                background: sc.bg, color: sc.color,
                border: `1px solid ${sc.border}`,
                fontSize: 12, fontWeight: 700,
              }}>{hcp.specialty}</span>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <InfoChip icon={Building2} label={hcp.hospital} />
              <InfoChip icon={MapPin} label={hcp.territory} />
              <InfoChip icon={Mail} label={hcp.email} />
              <InfoChip icon={Phone} label={hcp.phone} />
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <StatPill
              value={interactions.length}
              label="Interactions"
              color="#6366f1" bg="#eef2ff"
            />
            <StatPill
              value={`${engagementScore}%`}
              label="Engagement"
              color="#059669" bg="#ecfdf5"
            />
            <StatPill
              value={interactions[0]?.date || 'Never'}
              label="Last Visit"
              color="#d97706" bg="#fffbeb"
            />
          </div>
        </div>
      </div>

      {/* Interaction History */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardList size={18} color="var(--accent)" /> Interaction History
        </h2>
        <Link to="/log" className="btn btn-primary btn-sm">
          <ClipboardList size={13} /> Log New
        </Link>
      </div>

      {interactions.length === 0 ? (
        <div className="empty-state card" style={{ padding: 48 }}>
          <div className="icon"><ClipboardList size={44} /></div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>No interactions yet</p>
          <p style={{ fontSize: 13 }}>Log your first interaction with {hcp.name}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {interactions.map((i, idx) => (
            <div key={i.id} className="card fade-in" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className={`badge badge-${i.interaction_type}`}>{i.interaction_type}</span>
                  <span className={`badge badge-${i.sentiment}`}>{i.sentiment}</span>
                  {idx === 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#d97706', background: '#fffbeb', padding: '2px 8px', borderRadius: 10, border: '1px solid #fde68a' }}>
                      <Star size={10} fill="#d97706" /> Latest
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                    <Calendar size={12} /> {i.date}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                    <User size={12} /> {i.rep_name}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 10 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>AI Summary: </span>
                {i.ai_summary || i.notes}
              </div>

              {i.products_discussed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  <Package size={13} color="var(--text-muted)" />
                  <strong>Products:</strong> {i.products_discussed}
                </div>
              )}

              {i.next_action && (
                <div style={{ padding: '8px 12px', background: 'var(--accent-light)', borderRadius: 8, fontSize: 13, color: 'var(--accent)', fontWeight: 500, display: 'flex', alignItems: 'flex-start', gap: 7, border: '1px solid #c7d2fe' }}>
                  <ArrowRight size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                  <span><strong>Next Action:</strong> {i.next_action}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
