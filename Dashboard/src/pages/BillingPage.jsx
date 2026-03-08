import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import { CreditCard, Check, Zap, Building2, Rocket } from 'lucide-react';
import { useLang, dashboard as t } from '../LanguageContext';

const plansData = {
    en: [
        {
            id: 'starter', name: 'Starter', price: '$149', period: '/month', icon: Zap, color: '#10b981',
            features: ['300 call minutes/month', '100 SMS confirmations', 'AI appointment booking', 'Dashboard & analytics', 'Email support']
        },
        {
            id: 'professional', name: 'Professional', price: '$299', period: '/month', icon: Building2, color: '#6366f1', popular: true,
            features: ['1,000 call minutes/month', '500 SMS confirmations', 'AI appointment booking', 'Advanced analytics', 'Custom AI greeting', 'Priority support', 'Multiple phone numbers']
        },
        {
            id: 'enterprise', name: 'Enterprise', price: '$499', period: '/month', icon: Rocket, color: '#f59e0b',
            features: ['3,000 call minutes/month', 'Unlimited SMS', 'AI appointment booking', 'Full analytics suite', 'Custom AI persona', 'Dedicated support', 'API access', 'Multi-location support']
        }
    ],
    tr: [
        {
            id: 'starter', name: 'Başlangıç', price: '$149', period: '/ay', icon: Zap, color: '#10b981',
            features: ['Aylık 300 arama dakikası', '100 SMS onay', 'AI randevu alma', 'Panel & analitik', 'E-posta desteği']
        },
        {
            id: 'professional', name: 'Profesyonel', price: '$299', period: '/ay', icon: Building2, color: '#6366f1', popular: true,
            features: ['Aylık 1.000 arama dakikası', '500 SMS onay', 'AI randevu alma', 'Gelişmiş analitik', 'Özel AI karşılama', 'Öncelikli destek', 'Çoklu telefon numarası']
        },
        {
            id: 'enterprise', name: 'Kurumsal', price: '$499', period: '/ay', icon: Rocket, color: '#f59e0b',
            features: ['Aylık 3.000 arama dakikası', 'Sınırsız SMS', 'AI randevu alma', 'Tam analitik paketi', 'Özel AI kişiliği', 'Özel destek', 'API erişimi', 'Çoklu şube desteği']
        }
    ]
};

export default function BillingPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState('');
    const { lang } = useLang();
    const l = t[lang];
    const plans = plansData[lang];

    const currentPlan = user?.subscriptionPlan || 'trial';

    const handleUpgrade = async (planId) => {
        setLoading(planId);
        try {
            const { url } = await api.createCheckout(planId);
            window.location.href = url;
        } catch (err) {
            alert(err.message || 'Failed to create checkout');
        }
        setLoading('');
    };

    const handleManage = async () => {
        setLoading('portal');
        try {
            const { url } = await api.createPortal();
            window.location.href = url;
        } catch (err) {
            alert(err.message || 'Failed to open billing portal');
        }
        setLoading('');
    };

    return (
        <div className="slide-up">
            <div className="page-header">
                <h2>{l.billingTitle}</h2>
                <p>{l.billingSub}</p>
            </div>

            {/* Current Plan Banner */}
            <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, #18181b, #232326)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{l.currentPlanTitle}</div>
                        <div style={{ fontSize: 22, fontWeight: 700 }}>
                            {currentPlan === 'trial' ? (lang === 'tr' ? '🟡 Ücretsiz Deneme' : '🟡 Free Trial') : currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                        </div>
                        {currentPlan === 'trial' && (
                            <div style={{ fontSize: 13, color: 'var(--warning)', marginTop: 4 }}>
                                {lang === 'tr' ? 'Deneme bitiş:' : 'Trial ends'} {user?.trialEndsAt ? new Date(user.trialEndsAt).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US') : (lang === 'tr' ? '14 gün içinde' : 'in 14 days')}
                            </div>
                        )}
                    </div>
                    {currentPlan !== 'trial' && (
                        <button className="btn btn-secondary" onClick={handleManage} disabled={loading === 'portal'}>
                            <CreditCard size={16} />
                            {loading === 'portal' ? '...' : (lang === 'tr' ? 'Aboneliği Yönet' : 'Manage Subscription')}
                        </button>
                    )}
                </div>
            </div>

            {/* Plan Cards */}
            <div className="grid-3">
                {plans.map(plan => {
                    const Icon = plan.icon;
                    const isCurrent = currentPlan === plan.id;

                    return (
                        <div
                            key={plan.id}
                            className="card"
                            style={{
                                position: 'relative',
                                border: plan.popular ? '2px solid var(--accent)' : undefined,
                                boxShadow: plan.popular ? 'var(--shadow-glow)' : undefined
                            }}
                        >
                            {plan.popular && (
                                <div style={{
                                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                                    background: 'var(--gradient-primary)', padding: '4px 16px', borderRadius: 50,
                                    fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: 'white'
                                }}>
                                    {lang === 'tr' ? 'EN POPÜLER' : 'MOST POPULAR'}
                                </div>
                            )}

                            <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: `${plan.color}15`, color: plan.color
                                }}>
                                    <Icon size={24} />
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 700 }}>{plan.name}</h3>
                                <div style={{ marginTop: 8 }}>
                                    <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: -2 }}>{plan.price}</span>
                                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{plan.period}</span>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border)', padding: '16px 0' }}>
                                {plan.features.map((f, i) => (
                                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 14, color: 'var(--text-secondary)' }}>
                                        <Check size={16} color={plan.color} />
                                        {f}
                                    </div>
                                ))}
                            </div>

                            <button
                                className={`btn ${isCurrent ? 'btn-secondary' : 'btn-primary'}`}
                                style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                                disabled={isCurrent || loading === plan.id}
                                onClick={() => handleUpgrade(plan.id)}
                            >
                                {isCurrent ? (lang === 'tr' ? 'Mevcut Plan' : 'Current Plan') : loading === plan.id ? '...' : (lang === 'tr' ? 'Yükselt' : 'Upgrade')}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Overage Info */}
            <div className="card" style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{lang === 'tr' ? 'Ek Kullanım Ücretleri' : 'Overage Pricing'}</h3>
                <div style={{ display: 'flex', gap: 40 }}>
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>$0.15</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{lang === 'tr' ? 'ek dakika başına' : 'per additional minute'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>$0.02</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{lang === 'tr' ? 'ek SMS başına' : 'per additional SMS'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
