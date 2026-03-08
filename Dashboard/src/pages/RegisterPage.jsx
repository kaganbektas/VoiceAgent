import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLang, dashboard as t } from '../LanguageContext';

export default function RegisterPage() {
    const [form, setForm] = useState({
        businessName: '', ownerName: '', email: '', password: '', businessType: 'dental'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();
    const { lang } = useLang();
    const l = t[lang];

    const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form);
            navigate('/');
        } catch (err) {
            setError(err.message || (lang === 'tr' ? 'Kayıt başarısız' : 'Registration failed'));
        }
        setLoading(false);
    };

    const bizTypes = lang === 'tr'
        ? { dental: 'Diş Kliniği', salon: 'Kuaför / Spa', medical: 'Tıp Kliniği', legal: 'Hukuk Bürosu', auto: 'Oto Servis', other: 'Diğer' }
        : { dental: 'Dental Office', salon: 'Hair Salon / Spa', medical: 'Medical Practice', legal: 'Law Office', auto: 'Auto Service', other: 'Other' };

    return (
        <div className="auth-page">
            <div className="auth-card slide-up">
                <div className="logo-section">
                    <div className="logo-icon"><img src="/logo.png" alt="DigiAsistan" style={{ height: 40, width: 'auto' }} /></div>
                    <h2>DigiAsistan</h2>
                    <p>{l.regSub}</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} autoComplete="off">
                    <div className="form-group">
                        <label htmlFor="regBizName">{l.businessName}</label>
                        <input id="regBizName" className="form-input" placeholder={lang === 'tr' ? 'örn. Dr. Yılmaz Kliniği' : 'Dr. Smith Dental'} value={form.businessName}
                            onChange={e => update('businessName', e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="regOwner">{lang === 'tr' ? 'Adınız' : 'Your Name'}</label>
                        <input id="regOwner" className="form-input" placeholder={lang === 'tr' ? 'Ali Yılmaz' : 'John Smith'} value={form.ownerName}
                            onChange={e => update('ownerName', e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="regEmail">{l.email}</label>
                        <input id="regEmail" className="form-input" type="email" placeholder={lang === 'tr' ? 'ali@klinik.com' : 'john@drsmith.com'} value={form.email}
                            onChange={e => update('email', e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="regPassword">{l.password}</label>
                        <input id="regPassword" className="form-input" type="password" placeholder={lang === 'tr' ? 'Min. 6 karakter' : 'Min. 6 characters'} value={form.password}
                            onChange={e => update('password', e.target.value)} autoComplete="new-password" required minLength={6} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="regBizType">{lang === 'tr' ? 'İşletme Türü' : 'Business Type'}</label>
                        <select id="regBizType" className="form-input" value={form.businessType} onChange={e => update('businessType', e.target.value)}>
                            {Object.entries(bizTypes).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                        {loading ? <span className="btn-spinner"></span> : l.regBtn}
                    </button>
                </form>

                <p className="auth-switch">
                    {l.haveAccount} <Link to="/login">{l.signIn}</Link>
                </p>
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <Link to="/" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
                        ← {lang === 'tr' ? 'Ana Sayfaya Dön' : 'Back to Homepage'}
                    </Link>
                </div>
            </div>
        </div>
    );
}
