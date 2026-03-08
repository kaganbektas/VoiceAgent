import { useState, useEffect } from 'react';
import { api } from '../api';
import { Settings, Save, Clock, Globe, MessageSquare, Building2, Sparkles } from 'lucide-react';
import { useLang, dashboard as t } from '../LanguageContext';

const timeSlots = [];
for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
        const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        const ampm = h < 12 ? 'AM' : 'PM';
        const label = `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
        timeSlots.push({ val, label });
    }
}

export default function SettingsPage() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState('');
    const [form, setForm] = useState({ greetingMessage: '', timezone: '', language: '' });
    const [hours, setHours] = useState([]);
    const { lang } = useLang();
    const l = t[lang];

    const days = [
        { key: 0, short: 'Sun', full: l.sun, emoji: '☀️' },
        { key: 1, short: 'Mon', full: l.mon, emoji: '🟢' },
        { key: 2, short: 'Tue', full: l.tue, emoji: '🟢' },
        { key: 3, short: 'Wed', full: l.wed, emoji: '🟢' },
        { key: 4, short: 'Thu', full: l.thu, emoji: '🟢' },
        { key: 5, short: 'Fri', full: l.fri, emoji: '🟢' },
        { key: 6, short: 'Sat', full: l.sat, emoji: '🟡' },
    ];

    useEffect(() => {
        api.getSettings().then(data => {
            setSettings(data);
            setForm({
                greetingMessage: data.greetingMessage || '',
                timezone: data.timezone || 'America/New_York',
                language: data.language || 'en'
            });
            setHours(data.businessHours?.length > 0
                ? data.businessHours.map(h => ({ ...h }))
                : days.map((d) => ({
                    dayOfWeek: d.key, openTime: '09:00', closeTime: '17:00', isClosed: d.key === 0
                }))
            );
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const saveSettings = async () => {
        setSaving(true);
        try {
            await api.updateSettings(form);
            setSaved('settings');
            setTimeout(() => setSaved(''), 2000);
        } catch (e) { alert(e.message); }
        setSaving(false);
    };

    const saveHours = async () => {
        setSaving(true);
        try {
            await api.updateHours(hours);
            setSaved('hours');
            setTimeout(() => setSaved(''), 2000);
        } catch (e) { alert(e.message); }
        setSaving(false);
    };

    const updateHour = (idx, key, val) => {
        setHours(h => h.map((item, i) => i === idx ? { ...item, [key]: val } : item));
    };

    const applyToWeekdays = (openTime, closeTime) => {
        setHours(h => h.map(item =>
            item.dayOfWeek >= 1 && item.dayOfWeek <= 5
                ? { ...item, openTime, closeTime, isClosed: false }
                : item
        ));
    };

    const formatTime = (t) => {
        if (!t) return '';
        const [hh, mm] = t.split(':').map(Number);
        const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
        return `${h12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
    };

    if (loading) return <div className="loading-page"><div className="spinner" /></div>;

    const openDays = hours.filter(h => !h.isClosed).length;
    const mondayHours = hours.find(h => h.dayOfWeek === 1);

    return (
        <div className="slide-up">
            <div className="page-header">
                <h2><Settings size={24} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} /> {l.settingsTitle}</h2>
                <p>{l.settingsSub}</p>
            </div>

            <div className="grid-2">
                {/* Business Info Card */}
                <div className="card">
                    <div className="settings-card-header">
                        <div className="settings-icon-box" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                            <Building2 size={20} />
                        </div>
                        <div>
                            <h3>{l.bizInfo}</h3>
                            <p>{l.bizInfoSub}</p>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="bizName">{l.bizName}</label>
                        <input id="bizName" className="form-input" value={settings?.businessName || ''} disabled
                            style={{ opacity: 0.6 }} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phoneNum">{l.phoneNumber}</label>
                        <input id="phoneNum" className="form-input"
                            value={settings?.subscriptionPlan === 'trial'
                                ? (lang === 'tr' ? '🔒 Numara almak için paketinizi yükseltin' : '🔒 Upgrade plan to get a number')
                                : (settings?.twilioPhoneNumber || (lang === 'tr' ? 'Yapılandırılmamış' : 'Not configured'))}
                            disabled
                            style={{ opacity: 0.6, color: settings?.subscriptionPlan === 'trial' ? 'var(--warning)' : 'inherit' }} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="currentPlan">{l.currentPlan}</label>
                        <div className="plan-badge-row">
                            <span className={`badge ${settings?.subscriptionPlan === 'trial' ? 'warning' : 'success'}`}>
                                {settings?.subscriptionPlan === 'trial' ? l.trial : '🟢 ' + (settings?.subscriptionPlan || 'Active')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* AI Settings Card */}
                <div className="card">
                    <div className="settings-card-header">
                        <div className="settings-icon-box" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3>{l.aiConfig}</h3>
                            <p>{l.aiConfigSub}</p>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="greeting"><MessageSquare size={14} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} /> {l.greeting}</label>
                        <textarea id="greeting" className="form-input" value={form.greetingMessage}
                            onChange={e => setForm(f => ({ ...f, greetingMessage: e.target.value }))}
                            placeholder={lang === 'tr' ? 'Dr. Yılmaz Kliniğini aradığınız için teşekkürler. Size nasıl yardımcı olabilirim?' : 'Thank you for calling Dr. Smith Dental. How can I help you today?'}
                            rows={3} />
                        <span className="form-hint">{l.greetingHint}</span>
                    </div>
                    <div className="form-group">
                        <label htmlFor="timezone"><Globe size={14} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} /> {l.timezone}</label>
                        <select id="timezone" className="form-input" aria-label="Timezone" value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}>
                            <option value="America/New_York">🇺🇸 Eastern (ET)</option>
                            <option value="America/Chicago">🇺🇸 Central (CT)</option>
                            <option value="America/Denver">🇺🇸 Mountain (MT)</option>
                            <option value="America/Los_Angeles">🇺🇸 Pacific (PT)</option>
                            <option value="Europe/Istanbul">🇹🇷 Turkey (TRT)</option>
                            <option value="Europe/London">🇬🇧 London (GMT)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="language">{l.language}</label>
                        <select id="language" className="form-input" aria-label="Language" value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                            <option value="en">🇺🇸 English</option>
                            <option value="tr">🇹🇷 Turkish</option>
                            <option value="es">🇪🇸 Spanish</option>
                            <option value="de">🇩🇪 German</option>
                            <option value="fr">🇫🇷 French</option>
                        </select>
                    </div>
                    <button className="btn btn-secondary" onClick={saveSettings} disabled={saving} style={{ width: '100%' }}>
                        <Save size={16} /> {saved === 'settings' ? l.saved : l.saveSettings}
                    </button>
                </div>
            </div>

            {/* =================== BUSINESS HOURS =================== */}
            <div className="card" style={{ marginTop: 20 }}>
                <div className="settings-card-header" style={{ marginBottom: 4 }}>
                    <div className="settings-icon-box" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                        <Clock size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3>{l.bizHours}</h3>
                        <p>{l.bizHoursSub}</p>
                    </div>
                    <button className="btn btn-secondary" onClick={saveHours} disabled={saving}>
                        <Save size={16} /> {saved === 'hours' ? l.saved : l.saveHours}
                    </button>
                </div>

                {/* Quick summary */}
                <div className="hours-summary">
                    <div className="hours-summary-item">
                        <span className="hours-summary-value">{openDays}</span>
                        <span className="hours-summary-label">{l.daysOpen}</span>
                    </div>
                    <div className="hours-summary-item">
                        <span className="hours-summary-value">{7 - openDays}</span>
                        <span className="hours-summary-label">{l.daysClosed}</span>
                    </div>
                    {mondayHours && !mondayHours.isClosed && (
                        <button className="btn btn-sm btn-secondary" onClick={() => applyToWeekdays(mondayHours.openTime, mondayHours.closeTime)}>
                            {l.applyMonday}
                        </button>
                    )}
                </div>

                {/* Day rows */}
                <div className="hours-grid">
                    {hours.map((h, i) => {
                        const day = days.find(d => d.key === h.dayOfWeek);
                        return (
                            <div key={h.dayOfWeek} className={`hours-row ${h.isClosed ? 'hours-row-closed' : ''}`}>
                                <div className="hours-day">
                                    <div className={`hours-day-icon ${h.isClosed ? 'closed' : 'open'}`}></div>
                                    <div>
                                        <div className="hours-day-name">{day.full}</div>
                                        <div className="hours-day-preview">
                                            {h.isClosed ? l.closed : `${formatTime(h.openTime)} – ${formatTime(h.closeTime)}`}
                                        </div>
                                    </div>
                                </div>

                                <div className="hours-controls">
                                    <label className="hours-toggle">
                                        <input
                                            type="checkbox"
                                            checked={!h.isClosed}
                                            onChange={e => updateHour(i, 'isClosed', !e.target.checked)}
                                        />
                                        <span className="hours-toggle-slider"></span>
                                        <span className="hours-toggle-label">{h.isClosed ? l.closed : l.open}</span>
                                    </label>

                                    {!h.isClosed && (
                                        <div className="hours-time-selects">
                                            <select className="form-input hours-time-select" aria-label={`${day.full} open time`} value={h.openTime}
                                                onChange={e => updateHour(i, 'openTime', e.target.value)}>
                                                {timeSlots.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
                                            </select>
                                            <span className="hours-time-separator">→</span>
                                            <select className="form-input hours-time-select" aria-label={`${day.full} close time`} value={h.closeTime}
                                                onChange={e => updateHour(i, 'closeTime', e.target.value)}>
                                                {timeSlots.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
