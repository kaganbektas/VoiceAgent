import { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { CalendarDays, Plus, X, ChevronLeft, ChevronRight, Clock, User, Scissors, Phone, AlertTriangle, MessageSquare, FileText } from 'lucide-react';
import { useLang, dashboard as t } from '../LanguageContext';
import ConfirmDialog from '../ConfirmDialog';

const TURKISH_MONTHS = ['', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const TURKISH_DAYS = ['Pzr', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const EN_MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const EN_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState([]);
    const [overdueFromPast, setOverdueFromPast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ customerName: '', customerPhone: '', date: '', time: '', serviceType: '', notes: '' });
    const [error, setError] = useState('');
    const [confirmState, setConfirmState] = useState(null);
    const [detailApt, setDetailApt] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const { lang } = useLang();
    const l = t[lang];
    const months = lang === 'tr' ? TURKISH_MONTHS : EN_MONTHS;
    const dayNames = lang === 'tr' ? TURKISH_DAYS : EN_DAYS;

    const formatPhone = (phone) => {
        if (!phone) return '—';
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 10) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
        }
        return phone;
    };

    const loadAll = () => {
        setLoading(true);
        api.getUpcoming(60)
            .then(setAppointments)
            .catch(console.error)
            .finally(() => setLoading(false));
        api.getOverdue()
            .then(setOverdueFromPast)
            .catch(() => setOverdueFromPast([]));
    };

    useEffect(loadAll, []);

    // Turkey time (UTC+3)
    const turkeyNow = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const todayStr = toDateStr(new Date());
    const nowMinutes = turkeyNow.getUTCHours() * 60 + turkeyNow.getUTCMinutes();

    // Overdue: today's confirmed/pending appointments where startTime was 2+ hours ago
    const overdueAppointments = useMemo(() => {
        return appointments.filter(a => {
            if (a.status === 2 || a.status === 3 || a.status === 4) return false;
            if (a.date !== todayStr) return false;
            const [h, m] = (a.startTime || '00:00').split(':').map(Number);
            return (nowMinutes - (h * 60 + m)) >= 120;
        });
    }, [appointments, todayStr, nowMinutes]);

    const appointmentsByDate = useMemo(() => {
        const map = {};
        appointments.forEach(a => {
            const d = a.date;
            if (!map[d]) map[d] = [];
            map[d].push(a);
        });
        return map;
    }, [appointments]);

    const selectedDateStr = toDateStr(selectedDate);
    const dayAppointments = appointmentsByDate[selectedDateStr] || [];

    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();
        const days = [];

        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
        }
        return days;
    }, [currentMonth]);

    const today = new Date();
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    const goToday = () => { setCurrentMonth(new Date()); setSelectedDate(new Date()); };

    const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleBook = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.bookAppointment(form);
            setShowModal(false);
            setForm({ customerName: '', customerPhone: '', date: '', time: '', serviceType: '', notes: '' });
            loadAll();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCancel = (id) => {
        setConfirmState({
            message: lang === 'tr' ? 'Bu randevuyu iptal etmek istediginize emin misiniz?' : 'Are you sure you want to cancel this appointment?',
            onConfirm: async () => {
                setConfirmState(null);
                await api.cancelAppointment(id);
                loadAll();
            }
        });
    };

    const openNewWithDate = () => {
        setForm(f => ({ ...f, date: selectedDateStr }));
        setShowModal(true);
    };

    const openDetail = async (apt) => {
        setDetailApt({ ...apt, callSummary: null });
        setDetailLoading(true);
        try {
            const full = await api.getAppointment(apt.id);
            setDetailApt(full);
        } catch {
            // Detay yüklenemezse sadece mevcut veriyi göster
        } finally {
            setDetailLoading(false);
        }
    };

    const statusMap = {
        0: [lang === 'tr' ? 'Bekliyor' : 'Pending', 'warning'],
        1: [lang === 'tr' ? 'Onaylı' : 'Confirmed', 'success'],
        2: [lang === 'tr' ? 'İptal' : 'Cancelled', 'danger'],
        3: [lang === 'tr' ? 'Tamamlandı' : 'Completed', 'info']
    };

    const formatSelectedDate = () => {
        const d = selectedDate;
        const dayName = lang === 'tr'
            ? ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][d.getDay()]
            : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
        return `${d.getDate()} ${months[d.getMonth() + 1]} ${d.getFullYear()}, ${dayName}`;
    };

    if (loading) return <div className="loading-page"><div className="spinner" /></div>;

    return (
        <div className="slide-up">
            <div className="page-header">
                <h2>{l.apptTitle}</h2>
                <p>{l.apptSub}</p>
            </div>

            {/* Overdue Appointments */}
            {(overdueAppointments.length > 0 || overdueFromPast.length > 0) && (
                <div className="card" style={{ marginBottom: 20, border: '1px solid #f59e0b44', background: '#1c1712' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: '#f59e0b' }}>
                        <AlertTriangle size={18} />
                        <strong>{lang === 'tr'
                            ? `Gecikmiş Randevular (${overdueAppointments.length + overdueFromPast.length})`
                            : `Overdue Appointments (${overdueAppointments.length + overdueFromPast.length})`}
                        </strong>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {/* Geçmiş günlerden gelenler */}
                        {overdueFromPast.map(apt => {
                            const [label, color] = statusMap[apt.status] || ['—', 'neutral'];
                            return (
                                <div key={`past-${apt.id}`} className="cal-appt-card card" style={{ borderLeft: '3px solid #f59e0b' }} onClick={() => openDetail(apt)}>
                                    <div className="cal-appt-time">
                                        <Clock size={14} />
                                        <span style={{ fontWeight: 600, color: '#f59e0b' }}>{apt.date}</span>
                                        <span style={{ marginLeft: 6 }}>{apt.startTime?.substring(0, 5)}</span>
                                    </div>
                                    <div className="cal-appt-info">
                                        <div className="cal-appt-name"><User size={14} /><span>{apt.customerName}</span></div>
                                        {apt.serviceType && <div className="cal-appt-service"><Scissors size={13} /><span>{apt.serviceType}</span></div>}
                                        {apt.customerPhone && <div className="cal-appt-phone"><Phone size={13} /><span>{formatPhone(apt.customerPhone)}</span></div>}
                                    </div>
                                    <div className="cal-appt-footer">
                                        <div className="cal-appt-badges">
                                            <span className={`badge ${color}`}>{label}</span>
                                            <span className="badge danger">{lang === 'tr' ? 'Gelmedi?' : 'No-show?'}</span>
                                        </div>
                                        <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); handleCancel(apt.id); }}>
                                            <X size={14} /> {l.cancel}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {/* Bugünden gelenler */}
                        {overdueAppointments.map(apt => {
                            const [label, color] = statusMap[apt.status] || ['—', 'neutral'];
                            return (
                                <div key={`today-${apt.id}`} className="cal-appt-card card" style={{ borderLeft: '3px solid #f59e0b' }} onClick={() => openDetail(apt)}>
                                    <div className="cal-appt-time">
                                        <Clock size={14} />
                                        <span>{apt.startTime?.substring(0, 5)}</span>
                                        {apt.endTime && <span className="cal-appt-end">— {apt.endTime?.substring(0, 5)}</span>}
                                    </div>
                                    <div className="cal-appt-info">
                                        <div className="cal-appt-name"><User size={14} /><span>{apt.customerName}</span></div>
                                        {apt.serviceType && <div className="cal-appt-service"><Scissors size={13} /><span>{apt.serviceType}</span></div>}
                                        {apt.customerPhone && <div className="cal-appt-phone"><Phone size={13} /><span>{formatPhone(apt.customerPhone)}</span></div>}
                                    </div>
                                    <div className="cal-appt-footer">
                                        <div className="cal-appt-badges">
                                            <span className={`badge ${color}`}>{label}</span>
                                        </div>
                                        {apt.status !== 2 && (
                                            <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); handleCancel(apt.id); }}>
                                                <X size={14} /> {l.cancel}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="cal-layout">
                {/* Calendar */}
                <div className="cal-container card">
                    <div className="cal-header">
                        <button className="cal-nav-btn" aria-label="Previous month" onClick={prevMonth}><ChevronLeft size={18} /></button>
                        <div className="cal-title">
                            <span>{months[currentMonth.getMonth() + 1]} {currentMonth.getFullYear()}</span>
                            {!(isSameDay(selectedDate, today) && currentMonth.getMonth() === today.getMonth()) && (
                                <button className="cal-today-btn" onClick={goToday}>
                                    {lang === 'tr' ? 'Bugün' : 'Today'}
                                </button>
                            )}
                        </div>
                        <button className="cal-nav-btn" aria-label="Next month" onClick={nextMonth}><ChevronRight size={18} /></button>
                    </div>

                    <div className="cal-grid">
                        {dayNames.map(d => (
                            <div key={d} className="cal-day-name">{d}</div>
                        ))}
                        {calendarDays.map(({ date, isCurrentMonth }) => {
                            const ds = toDateStr(date);
                            const isToday = isSameDay(date, today);
                            const isSelected = isSameDay(date, selectedDate);
                            const hasAppts = appointmentsByDate[ds]?.length > 0;
                            const apptCount = appointmentsByDate[ds]?.length || 0;

                            return (
                                <button
                                    key={`day-${date.toISOString()}`}
                                    className={[
                                        'cal-day',
                                        !isCurrentMonth && 'cal-day-other',
                                        isToday && 'cal-day-today',
                                        isSelected && 'cal-day-selected',
                                    ].filter(Boolean).join(' ')}
                                    onClick={() => setSelectedDate(date)}
                                >
                                    <span className="cal-day-num">{date.getDate()}</span>
                                    {isToday && <span className="cal-today-label">{lang === 'tr' ? 'Bugün' : 'Today'}</span>}
                                    {hasAppts && (
                                        <div className="cal-dots">
                                            {Array.from({ length: Math.min(apptCount, 3) }).map((_, j) => (
                                                <span key={j} className="cal-dot" />
                                            ))}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Day Detail */}
                <div className="cal-detail">
                    <div className="cal-detail-header">
                        <div>
                            <h3 className="cal-detail-title">{formatSelectedDate()}</h3>
                            <p className="cal-detail-count">
                                {dayAppointments.length > 0
                                    ? `${dayAppointments.length} ${lang === 'tr' ? 'randevu' : 'appointment(s)'}`
                                    : (lang === 'tr' ? 'Randevu yok' : 'No appointments')
                                }
                            </p>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={openNewWithDate}>
                            <Plus size={14} /> {lang === 'tr' ? 'Ekle' : 'Add'}
                        </button>
                    </div>

                    {dayAppointments.length > 0 ? (
                        <div className="cal-appt-list">
                            {dayAppointments
                                .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                                .map(apt => {
                                    const [label, color] = statusMap[apt.status] || ['—', 'neutral'];
                                    const isOverdue = overdueAppointments.some(o => o.id === apt.id);
                                    return (
                                        <div key={apt.id} className="cal-appt-card card" style={{ ...(isOverdue ? { borderLeft: '3px solid #f59e0b' } : {}), cursor: 'pointer' }} onClick={() => openDetail(apt)}>
                                            <div className="cal-appt-time">
                                                <Clock size={14} />
                                                <span>{apt.startTime?.substring(0, 5)}</span>
                                                {apt.endTime && <span className="cal-appt-end">— {apt.endTime?.substring(0, 5)}</span>}
                                                {isOverdue && <span className="badge warning" style={{ marginLeft: 6, fontSize: 11 }}>{lang === 'tr' ? 'Gecikmiş' : 'Overdue'}</span>}
                                            </div>
                                            <div className="cal-appt-info">
                                                <div className="cal-appt-name">
                                                    <User size={14} />
                                                    <span>{apt.customerName}</span>
                                                </div>
                                                {apt.serviceType && (
                                                    <div className="cal-appt-service">
                                                        <Scissors size={13} />
                                                        <span>{apt.serviceType}</span>
                                                    </div>
                                                )}
                                                {apt.customerPhone && (
                                                    <div className="cal-appt-phone">
                                                        <Phone size={13} />
                                                        <span>{formatPhone(apt.customerPhone)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="cal-appt-footer">
                                                <div className="cal-appt-badges">
                                                    <span className={`badge ${color}`}>{label}</span>
                                                    <span className={`badge ${apt.bookedVia === 'ai_call' ? 'info' : 'neutral'}`}>
                                                        {apt.bookedVia === 'ai_call' ? '🤖 AI' : '👤 Dashboard'}
                                                    </span>
                                                </div>
                                                {apt.status !== 2 && (
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleCancel(apt.id)}>
                                                        <X size={14} /> {l.cancel}
                                                    </button>
                                                )}
                                            </div>
                                            {apt.notes && (
                                                <div className="cal-appt-notes">{apt.notes}</div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    ) : (
                        <div className="cal-empty card">
                            <CalendarDays size={36} />
                            <h4>{lang === 'tr' ? 'Bu günde randevu yok' : 'No appointments this day'}</h4>
                            <p>{lang === 'tr' ? 'Yeni randevu eklemek için + butonuna tiklayin' : 'Click + to add an appointment'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Booking Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)} onKeyDown={e => e.key === 'Escape' && setShowModal(false)} role="dialog" aria-modal="true">
                    <div className="modal" onClick={e => e.stopPropagation()} role="document">
                        <div className="modal-header">
                            <h3>{l.bookAppointment}</h3>
                            <button className="modal-close" aria-label="Close dialog" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        {error && <div className="auth-error">{error}</div>}
                        <form onSubmit={handleBook}>
                            <div className="form-group">
                                <label>{l.custName} *</label>
                                <input className="form-input" value={form.customerName} onChange={e => update('customerName', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>{l.phoneNum}</label>
                                <input className="form-input" value={form.customerPhone} onChange={e => update('customerPhone', e.target.value)} placeholder="+90..." />
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label>{l.date} *</label>
                                    <input className="form-input" type="date" value={form.date} min={todayStr} onChange={e => update('date', e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>{lang === 'tr' ? 'Saat' : 'Time'} *</label>
                                    <input className="form-input" type="time" value={form.time} onChange={e => update('time', e.target.value)} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>{l.service}</label>
                                <input className="form-input" value={form.serviceType} onChange={e => update('serviceType', e.target.value)} placeholder={lang === 'tr' ? 'örn. Erkek Saç Kesimi' : 'e.g. Haircut'} />
                            </div>
                            <div className="form-group">
                                <label>{lang === 'tr' ? 'Notlar' : 'Notes'}</label>
                                <textarea className="form-input" value={form.notes} onChange={e => update('notes', e.target.value)} placeholder={lang === 'tr' ? 'Özel notlar...' : 'Any special notes...'} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{l.cancel}</button>
                                <button type="submit" className="btn btn-primary">{l.bookBtn}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {confirmState && (
                <ConfirmDialog
                    message={confirmState.message}
                    onConfirm={confirmState.onConfirm}
                    onCancel={() => setConfirmState(null)}
                    lang={lang}
                />
            )}

            {/* Randevu Detay Modal */}
            {detailApt && (
                <div className="modal-overlay" onClick={() => setDetailApt(null)} role="dialog" aria-modal="true">
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <User size={18} />
                                {detailApt.customerName}
                            </h3>
                            <button className="modal-close" aria-label="Kapat" onClick={() => setDetailApt(null)}>✕</button>
                        </div>

                        <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {/* Temel bilgiler */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: '10px 14px' }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{lang === 'tr' ? 'Tarih & Saat' : 'Date & Time'}</div>
                                    <div style={{ fontWeight: 600 }}>
                                        {detailApt.date} — {detailApt.startTime?.substring(0, 5)}
                                        {detailApt.endTime && ` – ${detailApt.endTime.substring(0, 5)}`}
                                    </div>
                                </div>
                                {detailApt.customerPhone && (
                                    <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: '10px 14px' }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{lang === 'tr' ? 'Telefon' : 'Phone'}</div>
                                        <div style={{ fontWeight: 600 }}>{formatPhone(detailApt.customerPhone)}</div>
                                    </div>
                                )}
                                {detailApt.serviceType && (
                                    <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: '10px 14px' }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{lang === 'tr' ? 'Hizmet' : 'Service'}</div>
                                        <div style={{ fontWeight: 600 }}>{detailApt.serviceType}</div>
                                    </div>
                                )}
                                <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: '10px 14px' }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{lang === 'tr' ? 'Kaynak' : 'Source'}</div>
                                    <div style={{ fontWeight: 600 }}>{detailApt.bookedVia === 'ai_call' ? '🤖 AI Asistan' : '👤 Dashboard'}</div>
                                </div>
                            </div>

                            {detailApt.notes && (
                                <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: '10px 14px' }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{lang === 'tr' ? 'Notlar' : 'Notes'}</div>
                                    <div style={{ lineHeight: 1.6 }}>{detailApt.notes}</div>
                                </div>
                            )}

                            {/* Konuşma Özeti */}
                            {detailLoading ? (
                                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                                    <div className="spinner" style={{ margin: '0 auto 8px' }} />
                                    {lang === 'tr' ? 'Konuşma özeti yükleniyor...' : 'Loading call summary...'}
                                </div>
                            ) : detailApt.callSummary?.summary ? (
                                <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: '10px 14px', borderLeft: '3px solid var(--primary)' }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <MessageSquare size={13} />
                                        {lang === 'tr' ? 'Konuşma Özeti' : 'Call Summary'}
                                    </div>
                                    <div style={{ lineHeight: 1.7, fontSize: 14 }}>{detailApt.callSummary.summary}</div>
                                </div>
                            ) : detailApt.callLogId ? (
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
                                    <MessageSquare size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                                    {lang === 'tr' ? 'Konuşma özeti henüz mevcut değil.' : 'Call summary not available yet.'}
                                </div>
                            ) : null}

                            {/* Transkript */}
                            {!detailLoading && detailApt.callSummary?.transcript && (
                                <details style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: '10px 14px' }}>
                                    <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, listStyle: 'none' }}>
                                        <FileText size={13} />
                                        {lang === 'tr' ? 'Tam Transkript' : 'Full Transcript'}
                                    </summary>
                                    <pre style={{ marginTop: 10, fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', maxHeight: 250, overflowY: 'auto' }}>
                                        {detailApt.callSummary.transcript}
                                    </pre>
                                </details>
                            )}
                        </div>

                        <div className="modal-actions">
                            {detailApt.status !== 2 && (
                                <button className="btn btn-danger" onClick={() => { setDetailApt(null); handleCancel(detailApt.id); }}>
                                    <X size={14} /> {l.cancel}
                                </button>
                            )}
                            <button className="btn btn-secondary" onClick={() => setDetailApt(null)}>
                                {lang === 'tr' ? 'Kapat' : 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
