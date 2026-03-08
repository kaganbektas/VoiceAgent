import { useState, useEffect } from 'react';
import { api } from '../api';
import { Phone, CalendarDays, Users, TrendingUp, Clock, PhoneIncoming } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLang, dashboard as t } from '../LanguageContext';

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { lang } = useLang();
    const l = t[lang];

    useEffect(() => {
        api.getStats().then(setStats).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-page"><div className="spinner" /></div>;

    const chartDays = lang === 'tr'
        ? ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const mockChart = Array.from({ length: 7 }, (_, i) => ({
        day: chartDays[i],
        calls: Math.floor(Math.random() * 20) + 5,
        appointments: Math.floor(Math.random() * 10) + 2,
    }));

    return (
        <div className="slide-up">
            <div className="page-header">
                <h2>{l.dashTitle}</h2>
                <p>{l.dashSub}</p>
            </div>

            {stats?.subscriptionPlan === 'trial' && (
                <div style={{ background: '#111111', border: '1px solid #1f1f1f', color: '#fff', padding: '20px 24px', borderRadius: 10, marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>🔒</span> {l.trialBannerTitle}
                        </h3>
                        <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: 14, maxWidth: 600, lineHeight: 1.5 }}>{l.trialBannerDesc}</p>
                    </div>
                    <button onClick={() => window.location.href = '/dashboard/billing'}
                        style={{ background: '#fff', color: '#18181b', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', transition: 'transform 0.2s', fontSize: 14 }}
                        onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
                        {l.upgradeBtn}
                    </button>
                </div>
            )}

            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-icon purple"><Phone size={22} /></div>
                    <div className="stat-value">{stats?.todayCalls || 0}</div>
                    <div className="stat-label">{l.callsToday}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><CalendarDays size={22} /></div>
                    <div className="stat-value">{stats?.todayAppointments || 0}</div>
                    <div className="stat-label">{l.todayAppts}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><Users size={22} /></div>
                    <div className="stat-value">{stats?.totalCustomers || 0}</div>
                    <div className="stat-label">{l.totalCustomers}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange"><TrendingUp size={22} /></div>
                    <div className="stat-value">{stats?.callSuccessRate ? `${Math.round(stats.callSuccessRate)}%` : '—'}</div>
                    <div className="stat-label">{l.successRate}</div>
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{l.callVolume}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{l.last7}</p>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockChart}>
                                <defs>
                                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ffffff" stopOpacity={0.15} />
                                        <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ background: '#111111', border: '1px solid #1f1f1f', borderRadius: 6 }}
                                    labelStyle={{ color: '#ffffff' }}
                                />
                                <Area type="monotone" dataKey="calls" name={lang === 'tr' ? 'Aramalar' : 'Calls'} stroke="#ffffff" fill="url(#colorCalls)" strokeWidth={2} />
                                <Area type="monotone" dataKey="appointments" name={lang === 'tr' ? 'Randevular' : 'Appointments'} stroke="#22c55e" fill="none" strokeWidth={2} strokeDasharray="4 4" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{l.recentActivity}</h3>
                    {stats?.recentActivity?.length > 0 ? (
                        <div className="activity-list">
                            {stats.recentActivity.map(call => (
                                <div key={call.id} className="activity-item">
                                    <div className="activity-icon" style={{ background: 'var(--accent-glow)' }}>
                                        <PhoneIncoming size={18} color="var(--accent)" />
                                    </div>
                                    <div className="activity-info">
                                        <div className="title">{call.callerPhone}</div>
                                        <div className="subtitle">{call.summary || 'Call handled'}</div>
                                    </div>
                                    <div className="activity-time">
                                        {call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : '—'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <Phone size={40} />
                            <h3>{l.noCalls}</h3>
                            <p>{l.noCallsSub}</p>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ marginTop: 20 }}>
                <div className="card">
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{l.usageTitle}</h3>
                    <div style={{ display: 'flex', gap: 40, marginTop: 16 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                <span style={{ fontSize: 24, fontWeight: 800 }}>{Math.round(stats?.totalCallMinutes || 0)}</span>
                                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ 500 min</span>
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                                <Clock size={14} style={{ verticalAlign: -2, marginRight: 4 }} />{l.callMinUsed}
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                <span style={{ fontSize: 24, fontWeight: 800 }}>{stats?.monthlySmsCount || 0}</span>
                                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ 200</span>
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                                <Phone size={14} style={{ verticalAlign: -2, marginRight: 4 }} />{l.smsSent}
                            </div>
                        </div>
                        <div>
                            <span className={`badge ${stats?.subscriptionPlan === 'trial' ? 'warning' : 'success'}`}>
                                {stats?.subscriptionPlan === 'trial' ? l.trial : '🟢 ' + (stats?.subscriptionPlan || 'Active')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
