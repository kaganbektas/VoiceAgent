import { useState, useEffect } from 'react';
import { api } from '../api';
import { Phone, Search, ChevronRight } from 'lucide-react';
import { useLang, dashboard as t } from '../LanguageContext';

export default function CallsPage() {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState('');
    const { lang } = useLang();
    const l = t[lang];

    useEffect(() => {
        api.getCalls(100).then(setCalls).catch(console.error).finally(() => setLoading(false));
    }, []);

    const filtered = calls.filter(c =>
        c.callerPhone?.toLowerCase().includes(search.toLowerCase()) ||
        c.summary?.toLowerCase().includes(search.toLowerCase())
    );

    const formatDuration = (s) => s > 0 ? `${Math.floor(s / 60)}m ${s % 60}s` : '—';
    const formatDate = (d) => new Date(d).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const statusBadge = (status) => {
        const map = { completed: 'success', 'in-progress': 'info', failed: 'danger', missed: 'warning' };
        return <span className={`badge ${map[status] || 'neutral'}`}>{status}</span>;
    };

    if (loading) return <div className="loading-page"><div className="spinner" /></div>;

    return (
        <div className="slide-up">
            <div className="page-header">
                <h2>{l.callHistoryTitle}</h2>
                <p>{l.callHistorySub}</p>
            </div>

            <div className="toolbar">
                <div className="search-input" style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                    <input className="form-input" placeholder={l.searchCalls} value={search}
                        onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} aria-label="Search calls" />
                </div>
            </div>

            {filtered.length > 0 ? (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>{l.caller}</th>
                                <th>{l.status}</th>
                                <th>{l.duration}</th>
                                <th>{l.summary}</th>
                                <th>{l.date}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(call => (
                                <tr key={call.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(call)} onKeyDown={e => e.key === 'Enter' && setSelected(call)} tabIndex={0} role="button">
                                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{call.callerPhone}</td>
                                    <td>{statusBadge(call.status)}</td>
                                    <td>{formatDuration(call.duration)}</td>
                                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {call.summary || '—'}
                                    </td>
                                    <td>{formatDate(call.startedAt)}</td>
                                    <td><ChevronRight size={16} color="var(--text-muted)" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <Phone size={40} />
                        <h3>{l.noCallsYet}</h3>
                        <p>{l.noCallsYetSub}</p>
                    </div>
                </div>
            )}

            {selected && (
                <div className="modal-overlay" onClick={() => setSelected(null)} onKeyDown={e => e.key === 'Escape' && setSelected(null)} role="dialog" aria-modal="true">
                    <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()} role="document">
                        <div className="modal-header">
                            <h3>{l.callDetails}</h3>
                            <button className="modal-close" aria-label="Close dialog" onClick={() => setSelected(null)}>✕</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                            <div><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.caller}</span><br /><strong>{selected.callerPhone}</strong></div>
                            <div><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.duration}</span><br /><strong>{formatDuration(selected.duration)}</strong></div>
                            <div><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.status}</span><br />{statusBadge(selected.status)}</div>
                            <div><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.date}</span><br /><strong>{formatDate(selected.startedAt)}</strong></div>
                        </div>
                        {selected.summary && (
                            <div style={{ marginBottom: 16 }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.summary}</span>
                                <p style={{ marginTop: 4, fontSize: 14 }}>{selected.summary}</p>
                            </div>
                        )}
                        {selected.transcript && (
                            <div>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.transcript}</span>
                                <div className="transcript" style={{ marginTop: 8 }}>
                                    {selected.transcript.split('\n').map((line, i) => {
                                        const isUser = line.startsWith('[user]');
                                        return (
                                            <div key={`line-${i}-${line.slice(0, 10)}`} className={`transcript-line ${isUser ? 'user' : 'assistant'}`}>
                                                <div className="role">{isUser ? '🗣️ Caller' : '🤖 AI'}</div>
                                                {line.replace(/\[(user|assistant)\]:?\s*/, '')}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
