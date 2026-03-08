import { useState, useEffect } from 'react';
import { api } from '../api';
import { Users, Plus, Search, Trash2, Pencil } from 'lucide-react';
import { useLang, dashboard as t } from '../LanguageContext';
import ConfirmDialog from '../ConfirmDialog';

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({ name: '', phone: '', email: '' });
    const [confirmState, setConfirmState] = useState(null);
    const [editCustomer, setEditCustomer] = useState(null); // { id, name, phone, email }
    const { lang } = useLang();
    const l = t[lang];

    // Format: 5351234567 → (535) 123 45 67
    const formatPhone = (phone) => {
        if (!phone) return '—';
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 10) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
        }
        return phone;
    };

    const load = () => {
        setLoading(true);
        api.getCustomers().then(setCustomers).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        await api.createCustomer(form);
        setShowModal(false);
        setForm({ name: '', phone: '', email: '' });
        load();
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        await api.updateCustomer(editCustomer.id, {
            name: editCustomer.name,
            phone: editCustomer.phone,
            email: editCustomer.email
        });
        setEditCustomer(null);
        load();
    };

    const handleDelete = (id) => {
        setConfirmState({
            message: lang === 'tr' ? 'Bu müşteriyi kalıcı olarak silmek istediginize emin misiniz?' : 'Are you sure you want to permanently delete this customer?',
            onConfirm: async () => {
                setConfirmState(null);
                await api.deleteCustomer(id);
                load();
            }
        });
    };

    const filtered = customers.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search)
    );

    if (loading) return <div className="loading-page"><div className="spinner" /></div>;

    return (
        <div className="slide-up">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2>{l.custTitle}</h2>
                    <p>{l.custSub}</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> {lang === 'tr' ? 'Müşteri Ekle' : 'Add Customer'}
                </button>
            </div>

            <div className="toolbar">
                <div className="search-input" style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                    <input className="form-input" placeholder={l.searchCust} value={search}
                        onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} aria-label="Search customers" />
                </div>
            </div>

            {filtered.length > 0 ? (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>{l.name}</th>
                                <th>{l.phone}</th>
                                <th>{l.email}</th>
                                <th>{l.totalCalls}</th>
                                <th>{l.lastCall}</th>
                                <th>{l.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</td>
                                    <td>{formatPhone(c.phone)}</td>
                                    <td>{c.email || '—'}</td>
                                    <td>{c.totalCalls}</td>
                                    <td>{c.lastCallAt ? new Date(c.lastCallAt).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US') : '—'}</td>
                                    <td style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-secondary btn-sm btn-icon" aria-label="Edit customer" onClick={() => setEditCustomer({ id: c.id, name: c.name, phone: c.phone || '', email: c.email || '' })}>
                                            <Pencil size={14} />
                                        </button>
                                        <button className="btn btn-danger btn-sm btn-icon" aria-label="Delete customer" onClick={() => handleDelete(c.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <Users size={40} />
                        <h3>{l.noCust}</h3>
                        <p>{l.noCustSub}</p>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)} onKeyDown={e => e.key === 'Escape' && setShowModal(false)} role="dialog" aria-modal="true">
                    <div className="modal" onClick={e => e.stopPropagation()} role="document">
                        <div className="modal-header">
                            <h3>{lang === 'tr' ? 'Müşteri Ekle' : 'Add Customer'}</h3>
                            <button className="modal-close" aria-label="Close dialog" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label htmlFor="custName">{l.name} *</label>
                                <input id="custName" className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="custPhone">{l.phone} *</label>
                                <input id="custPhone" className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required placeholder="+1..." />
                            </div>
                            <div className="form-group">
                                <label htmlFor="custEmail">{l.email}</label>
                                <input id="custEmail" className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{l.cancel}</button>
                                <button type="submit" className="btn btn-primary">{lang === 'tr' ? 'Müşteri Ekle' : 'Add Customer'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editCustomer && (
                <div className="modal-overlay" onClick={() => setEditCustomer(null)} onKeyDown={e => e.key === 'Escape' && setEditCustomer(null)} role="dialog" aria-modal="true">
                    <div className="modal" onClick={e => e.stopPropagation()} role="document">
                        <div className="modal-header">
                            <h3>{lang === 'tr' ? 'Müşteriyi Düzenle' : 'Edit Customer'}</h3>
                            <button className="modal-close" aria-label="Close dialog" onClick={() => setEditCustomer(null)}>✕</button>
                        </div>
                        <form onSubmit={handleEditSave}>
                            <div className="form-group">
                                <label>{l.name} *</label>
                                <input className="form-input" value={editCustomer.name} onChange={e => setEditCustomer(ec => ({ ...ec, name: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label>{l.phone}</label>
                                <input className="form-input" value={editCustomer.phone} onChange={e => setEditCustomer(ec => ({ ...ec, phone: e.target.value }))} placeholder="+90..." />
                            </div>
                            <div className="form-group">
                                <label>{l.email}</label>
                                <input className="form-input" type="email" value={editCustomer.email} onChange={e => setEditCustomer(ec => ({ ...ec, email: e.target.value }))} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setEditCustomer(null)}>{l.cancel}</button>
                                <button type="submit" className="btn btn-primary">{lang === 'tr' ? 'Kaydet' : 'Save'}</button>
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
        </div>
    );
}
