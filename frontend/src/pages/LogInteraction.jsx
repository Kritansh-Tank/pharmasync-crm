import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FormInput, MessageSquare, Send, CheckCircle2,
  Loader2, User, Bot, Lightbulb,
} from 'lucide-react';
import { loadHCPs } from '../store/hcpsSlice';
import { addInteraction } from '../store/interactionsSlice';
import { addUserMessage, sendMessage } from '../store/chatSlice';

const TYPES = ['visit', 'call', 'email', 'conference'];

// ── Structured Form ──────────────────────────────────────────────────────────
function FormMode() {
  const dispatch = useDispatch();
  const { list: hcps } = useSelector(s => s.hcps);
  const { loading } = useSelector(s => s.interactions);
  const [form, setForm] = useState({
    hcp_id: '', rep_name: '', date: new Date().toISOString().split('T')[0],
    interaction_type: 'visit', notes: '', products_discussed: '', outcome: '',
  });
  const [success, setSuccess] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.hcp_id || !form.rep_name || !form.notes) return;
    await dispatch(addInteraction({ ...form, hcp_id: parseInt(form.hcp_id) }));
    setSuccess(true);
    setForm(f => ({ ...f, notes: '', products_discussed: '', outcome: '' }));
    setTimeout(() => setSuccess(false), 5000);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {success && (
        <div className="alert-success">
          <CheckCircle2 size={16} />
          Interaction logged successfully! AI summary & sentiment generated.
        </div>
      )}

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">HCP *</label>
          <select className="form-select" value={form.hcp_id} onChange={set('hcp_id')} required>
            <option value="">Select Healthcare Professional…</option>
            {hcps.map(h => <option key={h.id} value={h.id}>{h.name} — {h.specialty}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Your Name *</label>
          <input className="form-input" placeholder="e.g. Alex Johnson" value={form.rep_name} onChange={set('rep_name')} required />
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Date *</label>
          <input type="date" className="form-input" value={form.date} onChange={set('date')} required />
        </div>
        <div className="form-group">
          <label className="form-label">Interaction Type *</label>
          <select className="form-select" value={form.interaction_type} onChange={set('interaction_type')}>
            {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Interaction Notes *</label>
        <textarea className="form-textarea" placeholder="Describe the interaction in detail — what was discussed, how the HCP responded, any concerns raised…" value={form.notes} onChange={set('notes')} required style={{ minHeight: 130 }} />
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Products Discussed</label>
          <input className="form-input" placeholder="e.g. CardioMax, NeuroPro" value={form.products_discussed} onChange={set('products_discussed')} />
        </div>
        <div className="form-group">
          <label className="form-label">Outcome</label>
          <input className="form-input" placeholder="e.g. Agreed to prescribe, Requested samples" value={form.outcome} onChange={set('outcome')} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <><Loader2 size={15} style={{ animation: 'spin 0.65s linear infinite' }} /> Processing…</> : <><CheckCircle2 size={15} /> Log with AI Summary</>}
        </button>
      </div>
    </form>
  );
}

// ── Chat Mode ────────────────────────────────────────────────────────────────
function ChatMode() {
  const dispatch = useDispatch();
  const { messages, loading, sessionId } = useSelector(s => s.chat);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    dispatch(addUserMessage(input));
    dispatch(sendMessage({ message: input, session_id: sessionId }));
    setInput('');
  };

  const SUGGESTIONS = [
    "Log a visit with Dr. Sarah Mitchell today about the DRUGTX-001 oncology trial",
    "I just called Dr. James Patel — he's very happy with CardioPro results",
    "Get Dr. Emily Chen's full profile and interaction history",
    "What should I do next with Dr. Priya Sharma?",
    "Analyze all interactions in the North-East territory",
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 560 }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 16px', display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 12 }}>
        {messages.length === 0 && (
          <div style={{ padding: '8px 4px' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, background: 'var(--accent-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Bot size={26} color="var(--accent)" />
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 16, marginBottom: 4 }}>AI CRM Agent</div>
              <div style={{ fontSize: 13 }}>Describe an HCP interaction in plain language — I'll log it, summarize it, and recommend next steps.</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => setInput(s)} style={{
                  background: 'var(--bg-surface-2)', border: '1.5px solid var(--border)',
                  borderRadius: 8, padding: '10px 14px', color: 'var(--text-secondary)',
                  fontSize: 13, cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'Inter,sans-serif', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-surface-2)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <Lightbulb size={14} style={{ marginTop: 1, flexShrink: 0 }} /> {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <Bot size={16} color="var(--accent)" />
              </div>
            )}
            <div style={{
              maxWidth: '78%', padding: '11px 15px', lineHeight: 1.6,
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-surface)',
              border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
              color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
              fontSize: 14, whiteSpace: 'pre-wrap',
              boxShadow: 'var(--shadow-sm)',
            }}>
              {msg.content}
              {msg.tool_calls?.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {msg.tool_calls.map((tc, j) => (
                    <span key={j} style={{ fontSize: 11, padding: '3px 8px', background: 'var(--accent-2-light)', borderRadius: 4, color: 'var(--accent-2)', border: '1px solid #ddd6fe', fontWeight: 600 }}>
                      🔧 {tc.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <User size={16} color="white" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={16} color="var(--accent)" />
            </div>
            <div style={{ padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px 16px 16px 4px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', boxShadow: 'var(--shadow-sm)' }}>
              <Loader2 size={14} style={{ animation: 'spin 0.65s linear infinite' }} />
              Agent thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 10 }}>
        <textarea
          className="form-textarea"
          placeholder="Describe the interaction… e.g. 'Just visited Dr. Smith, she was excited about the Phase III data…'"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          style={{ minHeight: 52, maxHeight: 120, flex: 1, resize: 'none' }}
        />
        <button className="btn btn-primary" onClick={handleSend} disabled={loading || !input.trim()} style={{ alignSelf: 'flex-end' }}>
          <Send size={15} /> Send
        </button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function LogInteraction() {
  const dispatch = useDispatch();
  const [mode, setMode] = useState('form');
  useEffect(() => { dispatch(loadHCPs()); }, [dispatch]);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Log Interaction</div>
        <div className="page-subtitle">Record an HCP interaction via structured form or AI-powered chat</div>
      </div>

      {/* Toggle */}
      <div style={{
        display: 'inline-flex', gap: 4, padding: 4,
        background: 'var(--bg-surface)', borderRadius: 10,
        border: '1px solid var(--border)', marginBottom: 24,
        boxShadow: 'var(--shadow-sm)',
      }}>
        {[['form', FormInput, 'Structured Form'], ['chat', MessageSquare, 'AI Chat']].map(([k, Icon, label]) => (
          <button key={k} onClick={() => setMode(k)} style={{
            padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
            fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 600,
            background: mode === k ? 'var(--accent)' : 'transparent',
            color: mode === k ? 'white' : 'var(--text-secondary)',
            transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 28 }}>
        {mode === 'form' ? <FormMode /> : <ChatMode />}
      </div>
    </div>
  );
}
