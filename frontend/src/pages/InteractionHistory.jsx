import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search, Pencil, Trash2, Calendar, User,
  Package, ArrowRight, Loader2, ClipboardList, X, Save,
} from 'lucide-react';
import { loadInteractions, editInteraction, removeInteraction } from '../store/interactionsSlice';

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ interaction, onClose }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    notes: interaction.notes || '',
    interaction_type: interaction.interaction_type || 'visit',
    date: interaction.date || '',
    products_discussed: interaction.products_discussed || '',
    outcome: interaction.outcome || '',
  });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    await dispatch(editInteraction({ id: interaction.id, data: form }));
    setSaving(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 580, padding: 32, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Edit Interaction #{interaction.id}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>AI will re-generate summary if notes change</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={form.date} onChange={set('date')} />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.interaction_type} onChange={set('interaction_type')}>
                {['visit','call','email','conference'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes (AI will re-summarize on save)</label>
            <textarea className="form-textarea" value={form.notes} onChange={set('notes')} style={{ minHeight: 120 }} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Products Discussed</label>
              <input className="form-input" value={form.products_discussed} onChange={set('products_discussed')} />
            </div>
            <div className="form-group">
              <label className="form-label">Outcome</label>
              <input className="form-input" value={form.outcome} onChange={set('outcome')} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={onClose}><X size={14} /> Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 size={14} style={{ animation: 'spin 0.65s linear infinite' }} /> Saving…</> : <><Save size={14} /> Save & Re-generate</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InteractionHistory() {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(s => s.interactions);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => { dispatch(loadInteractions()); }, [dispatch]);

  const handleDelete = id => {
    if (window.confirm('Delete this interaction? This cannot be undone.')) dispatch(removeInteraction(id));
  };

  const filtered = list.filter(i =>
    !filter ||
    i.hcp?.name?.toLowerCase().includes(filter.toLowerCase()) ||
    i.interaction_type?.includes(filter.toLowerCase()) ||
    i.sentiment?.includes(filter.toLowerCase())
  );

  return (
    <div className="page">
      {editing && <EditModal interaction={editing} onClose={() => setEditing(null)} />}

      <div className="page-header">
        <div className="page-title">Interaction History</div>
        <div className="page-subtitle">All logged HCP interactions with AI-generated insights</div>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 20, position: 'relative', maxWidth: 360 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="form-input" style={{ paddingLeft: 36 }}
          placeholder="Filter by HCP, type, or sentiment…"
          value={filter} onChange={e => setFilter(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon"><ClipboardList size={48} /></div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>No interactions found</p>
          <p style={{ fontSize: 13 }}>{filter ? 'Try adjusting your filter' : 'Log your first interaction to get started'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(i => (
            <div key={i.id} className="card fade-in" style={{ padding: 22 }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{i.hcp?.name}</span>
                    <span className={`badge badge-${i.interaction_type}`}>{i.interaction_type}</span>
                    <span className={`badge badge-${i.sentiment}`}>{i.sentiment}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    {i.hcp?.specialty && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{i.hcp.specialty}</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                      <Calendar size={11} /> {i.date}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                      <User size={11} /> {i.rep_name}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditing(i)}>
                    <Pencil size={13} /> Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(i.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="divider" />

              {/* AI Summary */}
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 10 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>AI Summary: </span>
                {i.ai_summary || i.notes}
              </div>

              {/* Products */}
              {i.products_discussed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  <Package size={13} color="var(--text-muted)" />
                  <span style={{ fontWeight: 600 }}>Products:</span> {i.products_discussed}
                </div>
              )}

              {/* Next Action */}
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
