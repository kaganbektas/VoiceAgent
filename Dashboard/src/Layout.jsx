import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useLang, dashboard as t } from './LanguageContext';
import { useState } from 'react';
import {
    LayoutDashboard, Phone, CalendarDays, Users,
    Settings, LogOut, HelpCircle, CreditCard, Globe, Menu, X
} from 'lucide-react';

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { lang, setLang } = useLang();
    const l = t[lang];
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const sections = [
        {
            label: lang === 'tr' ? 'Yönet' : 'Manage',
            items: [
                { to: '/dashboard', icon: LayoutDashboard, label: l.sidebarDashboard },
                { to: '/dashboard/appointments', icon: CalendarDays, label: l.sidebarAppointments },
                { to: '/dashboard/customers', icon: Users, label: l.sidebarCustomers },
            ]
        },
        {
            label: lang === 'tr' ? 'İzle' : 'Monitor',
            items: [
                { to: '/dashboard/calls', icon: Phone, label: l.sidebarCalls },
                { to: '/dashboard/faqs', icon: HelpCircle, label: l.sidebarFaqs },
            ]
        },
        {
            label: lang === 'tr' ? 'Yapılandır' : 'Configure',
            items: [
                { to: '/dashboard/settings', icon: Settings, label: l.sidebarSettings },
                { to: '/dashboard/billing', icon: CreditCard, label: l.sidebarBilling },
            ]
        }
    ];

    return (
        <div className="app-layout">
            {/* Mobile header bar */}
            <div className="mobile-header">
                <button className="mobile-menu-btn" aria-label="Toggle menu" onClick={() => setMobileOpen(!mobileOpen)}>
                    {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
                <span className="mobile-title">DigiAsistan</span>
            </div>

            {/* Backdrop */}
            {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} onKeyDown={e => e.key === 'Escape' && setMobileOpen(false)} role="button" tabIndex={0} aria-label="Close menu" />}

            <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
                <Link to="/home" className="sidebar-logo" style={{ textDecoration: 'none' }}>
                    <div className="logo-icon"><img src="/logo.jpg" alt="DigiAsistan" style={{ height: 32, width: 'auto', marginTop: -6 }} /></div>
                    <div style={{ display: 'flex', alignItems: 'center', height: 32 }}>
                        <h1 style={{ margin: 0, lineHeight: 1 }}>DigiAsistan</h1>
                    </div>
                </Link>

                <nav className="sidebar-nav">
                    {sections.map(section => (
                        <div key={section.label} className="nav-section">
                            <div className="nav-section-label">{section.label}</div>
                            {section.items.map(({ to, icon: Icon, label }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    end={to === '/dashboard'}
                                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <Icon />
                                    {label}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div style={{ padding: '8px 14px', marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                            {user?.businessName || 'My Business'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {user?.email}
                        </div>
                    </div>
                    <button className="nav-item lang-switch" onClick={() => setLang(lang === 'en' ? 'tr' : 'en')}>
                        <Globe size={18} />
                        <span>{lang === 'tr' ? 'TR' : 'EN'}</span>
                    </button>
                    <button className="nav-item" onClick={handleLogout}>
                        <LogOut />
                        {l.sidebarSignOut}
                    </button>
                </div>
            </aside>

            <main className="main-content fade-in">
                <Outlet />
            </main>
        </div>
    );
}
