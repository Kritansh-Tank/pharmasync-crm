import React, { useState } from 'react';
import {
  ClipboardPen, Pencil, UserSearch, Target, BarChart3,
  Play, ChevronDown, ChevronUp, Loader2, AlertCircle,
} from 'lucide-react';
import { invokeTool } from '../api';

const TOOLS = [
  {
    name: 'log_interaction',
    icon: ClipboardPen,
    label: 'Log Interaction',
    color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe',
    description: 'Captures HCP interaction data. Uses Groq LLM (gemma2-9b-it) to extract entities, generate a professional summary, detect sentiment, and recommend next action. Writes to SQLite.',
    defaults: {
      hcp_name: 'Dr. Sarah Mitchell',
      rep_name: 'Alex Johnson',
      interaction_type: 'visit',
      notes: 'Visited Dr. Mitchell at Memorial Cancer Center. Presented Phase III data for DRUGTX-001. She was highly impressed and asked about patient enrollment criteria and timeline.',
      date: new Date().toISOString().split('T')[0],
      products_discussed: 'DRUGTX-001',
    },
  },
  {
    name: 'edit_interaction',
    icon: Pencil,
    label: 'Edit Interaction',
    color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe',
    description: 'Modifies a logged interaction by ID. If notes are updated, the LLM automatically re-generates the AI summary, sentiment analysis, and next action recommendation.',
    defaults: {
      interaction_id: 1,
      notes: 'Updated: Dr. Mitchell confirmed she will enroll 3 patients in the DRUGTX-001 trial next month. Very enthusiastic about the Phase III efficacy data.',
      regenerate_summary: true,
    },
  },
  {
    name: 'get_hcp_profile',
    icon: UserSearch,
    label: 'Get HCP Profile',
    color: '#059669', bg: '#ecfdf5', border: '#a7f3d0',
    description: 'Retrieves full HCP profile with all logged interactions, engagement score (% positive sentiment), last visit date, and an AI-generated narrative of the engagement status.',
    defaults: { hcp_name: 'Dr. Sarah Mitchell' },
  },
  {
    name: 'suggest_next_action',
    icon: Target,
    label: 'Suggest Next Action',
    color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    description: 'Analyzes the HCP\'s full interaction history using llama-3.3-70b-versatile and returns 3 specific, tactical next-step recommendations tailored to the HCP\'s specialty and engagement history.',
    defaults: { hcp_name: 'Dr. James Patel' },
  },
  {
    name: 'analyze_interaction_history',
    icon: BarChart3,
    label: 'Analyze History',
    color: '#dc2626', bg: '#fef2f2', border: '#fecaca',
    description: 'Territory-wide or HCP-specific trend analysis using llama-3.3-70b-versatile. Returns sentiment breakdown, visit frequency trends, engagement gaps, and an actionable performance report.',
    defaults: { territory: 'North-East' },
  },
];

function JsonDisplay({ data }) {
  return (
    <pre style={{
      marginTop: 14, padding: 16, borderRadius: 8,
      background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
      fontSize: 12, fontFamily: 'monospace', lineHeight: 1.7,
      color: 'var(--text-secondary)', whiteSpace: 'pre-wrap',
      maxHeight: 360, overflowY: 'auto',
    }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function ToolCard({ tool }) {
  const [params, setParams] = useState(JSON.stringify(tool.defaults, null, 2));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const Icon = tool.icon;

  const handleRun = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const parsed = JSON.parse(params);
      const res = await invokeTool(tool.name, parsed);
      setResult(res.data);
      setExpanded(true);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Error running tool');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card fade-in" style={{ padding: 26, borderTop: `3px solid ${tool.color}` }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          background: tool.bg, border: `1px solid ${tool.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} color={tool.color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>{tool.label}</span>
            <code style={{ fontSize: 11, padding: '2px 8px', background: tool.bg, color: tool.color, borderRadius: 4, border: `1px solid ${tool.border}`, fontWeight: 600 }}>{tool.name}()</code>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{tool.description}</div>
        </div>
      </div>

      {/* Params editor */}
      <div className="form-group" style={{ marginBottom: 14 }}>
        <label className="form-label">Parameters (JSON)</label>
        <textarea
          className="form-textarea"
          value={params}
          onChange={e => setParams(e.target.value)}
          style={{ minHeight: 100, fontFamily: 'monospace', fontSize: 12 }}
        />
      </div>

      {error && (
        <div className="alert-error" style={{ marginBottom: 12 }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          onClick={handleRun}
          disabled={loading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 8, border: 'none',
            background: tool.color, color: 'white', cursor: 'pointer',
            fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 14,
            transition: 'all 0.15s', opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? <><Loader2 size={14} style={{ animation: 'spin 0.65s linear infinite' }} /> Running…</>
            : <><Play size={14} /> Run {tool.label}</>}
        </button>

        {result && (
          <button className="btn btn-secondary btn-sm" onClick={() => setExpanded(e => !e)}>
            {expanded ? <><ChevronUp size={13} /> Hide Result</> : <><ChevronDown size={13} /> Show Result</>}
          </button>
        )}
      </div>

      {expanded && result && <JsonDisplay data={result} />}
    </div>
  );
}

export default function ToolDemo() {
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">AI Tools Demo</div>
        <div className="page-subtitle">
          Live demonstration of all 5 LangGraph tools · &nbsp;
          <span style={{ color: '#6366f1', fontWeight: 600 }}>gemma2-9b-it</span>
          &nbsp;&amp;&nbsp;
          <span style={{ color: '#8b5cf6', fontWeight: 600 }}>llama-3.3-70b-versatile</span>
          &nbsp;via Groq
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {TOOLS.map(tool => <ToolCard key={tool.name} tool={tool} />)}
      </div>
    </div>
  );
}
