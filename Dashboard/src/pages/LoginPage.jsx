import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLang, dashboard as t } from '../LanguageContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { lang } = useLang();
    const l = t[lang];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message || (lang === 'tr' ? 'Geçersiz e-posta veya şifre' : 'Invalid email or password'));
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-card slide-up">
                <div className="logo-section">
                    <div className="logo-icon"><img src="/logo.png" alt="DigiAsistan" style={{ height: 40, width: 'auto' }} /></div>
                    <h2>DigiAsistan</h2>
                    <p>{l.loginSub}</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} autoComplete="off">
                    <div className="form-group">
                        <label htmlFor="email">{l.email}</label>
                        <input
                            id="email"
                            className="form-input"
                            type="email"
                            placeholder="you@business.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoComplete="off"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">{l.password}</label>
                        <input
                            id="password"
                            className="form-input"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                        />
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                        {loading ? <span className="btn-spinner"></span> : l.loginBtn}
                    </button>
                </form>

                <p className="auth-switch">
                    {l.noAccount} <Link to="/register">{l.signUp}</Link>
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
