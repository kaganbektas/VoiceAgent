import {
    Phone, Calendar, HelpCircle, MessageSquare, Shield, Clock,
    ArrowRight, Play, Check, ChevronDown, Star
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../LanguageContext';
import { useAuth } from '../AuthContext';

const t = {
    en: {
        navFeatures: 'Features', navHow: 'How It Works', navPricing: 'Pricing', navFaq: 'FAQ',
        signIn: 'Sign In', startTrial: 'Start Free Trial',
        heroBadge: 'Now with OpenAI Realtime Voice — Ultra-low latency',
        heroTitle1: 'Your AI Receptionist', heroTitle2: 'That Never Sleeps',
        heroSub: 'DigiAsistan answers every phone call for your business — books appointments, answers questions, and sounds completely human. Available 24/7.',
        heroBtn1: 'Start 14-Day Free Trial', heroBtn2: 'See Features',
        stat1: 'Calls Handled', stat2: 'Satisfaction Rate', stat3: 'Avg Response Time',
        socialLabel: 'Trusted by 500+ businesses across the US',
        socialItems: ['Dental Clinics', 'Hair Salons', 'Auto Shops', 'Fitness Studios', 'Medical Offices', 'Law Firms'],
        featTag: 'Features', featTitle1: 'Everything You Need to', featTitle2: 'Never Miss a Call Again', featSub: 'Powered by the latest AI voice technology',
        features: [
            { title: 'AI-Powered Conversations', desc: "Natural, human-like voice interactions powered by OpenAI's Realtime API. Callers won't know they're talking to an AI." },
            { title: 'Smart Appointment Booking', desc: 'Checks real-time availability, detects conflicts, and books appointments automatically. Sends SMS confirmations.' },
            { title: 'FAQ Auto-Responder', desc: 'Train your AI with your business FAQs. It answers common questions about hours, pricing, services, and more.' },
            { title: 'Call Transcripts & Insights', desc: 'Every call is transcribed and summarized. See caller sentiment, actions taken, and conversation history.' },
            { title: 'Custom AI Persona', desc: "Customize the greeting, tone, and knowledge. Your AI sounds like it's been working at your office for years." },
            { title: '24/7 Availability', desc: 'Never miss a call — even at 3 AM, during holidays, or when your staff is busy. Always on, always professional.' }
        ],
        howTag: 'How It Works', howTitle1: 'Up and Running in', howTitle2: 'Under 5 Minutes',
        steps: [
            { n: '01', t: 'Sign Up & Get Your Number', d: 'Create your account and get a dedicated AI phone number. Forward your existing number or use the new one.' },
            { n: '02', t: 'Customize Your AI', d: 'Set business hours, services, greeting message, and FAQ answers. The AI learns your business in minutes.' },
            { n: '03', t: 'Go Live', d: 'Start receiving calls. Your AI handles everything — booking, FAQs, and confirmations automatically.' }
        ],
        priceTag: 'Pricing', priceTitle1: 'Simple, Transparent', priceTitle2: 'Pricing That Scales',
        priceSub: 'Start with a 14-day free trial. No credit card required.',
        plans: [
            { id: 'starter', name: 'Starter', price: '$149', desc: 'For small businesses just getting started', features: ['300 call minutes/month', '100 SMS confirmations', 'AI appointment booking', 'Dashboard & analytics', 'Email support'] },
            { id: 'professional', name: 'Professional', price: '$299', desc: 'For growing businesses with more volume', popular: true, features: ['1,000 call minutes/month', '500 SMS confirmations', 'Advanced analytics', 'Custom AI greeting', 'Priority support', 'Multiple phone numbers'] },
            { id: 'enterprise', name: 'Enterprise', price: '$499', desc: 'For high-volume multi-location businesses', features: ['3,000 call minutes/month', 'Unlimited SMS', 'Custom AI persona', 'Dedicated support', 'API access', 'Multi-location support'] }
        ],
        getStarted: 'Get Started', mostPopular: 'Most Popular',
        priceNote: 'All plans include a 14-day free trial. Overage: $0.15/minute, $0.02/SMS.',
        testTag: 'Testimonials', testTitle1: 'Loved by Businesses', testTitle2: 'Across the Country',
        testimonials: [
            { name: 'Dr. Sarah Mitchell', biz: 'Mitchell Dental Care', initials: 'DS', text: '"DigiAsistan has been a game-changer for our dental practice. We used to miss 30% of calls during procedures — now every call gets answered professionally."' },
            { name: 'Mike Rodriguez', biz: 'Elite Auto Repair', initials: 'MR', text: '"I was skeptical about AI answering my phones, but the quality is incredible. Clients often don\'t realize they\'re talking to an AI."' },
            { name: 'Jennifer Kim', biz: 'Luxe Hair Studio', initials: 'JK', text: '"We\'ve saved $3,000/month on front desk staffing. The AI handles 80% of our calls — scheduling, FAQs, and cancellations."' }
        ],
        faqTag: 'FAQ', faqTitle1: 'Frequently Asked', faqTitle2: 'Questions', faqSub: 'Everything you need to know about DigiAsistan',
        faqs: [
            { q: 'Does it really sound human?', a: "Yes! DigiAsistan uses OpenAI's latest Realtime voice technology, producing incredibly natural, conversational speech with proper intonation and emotional expression." },
            { q: 'Can it handle complex conversations?', a: 'Absolutely. DigiAsistan can check appointment availability, suggest alternatives, handle multi-step booking flows, and even transfer to a human when needed.' },
            { q: 'What happens when I exceed my call minutes?', a: 'Service continues without interruption. Additional minutes are billed at $0.15/minute and SMS at $0.02 each.' },
            { q: 'Can I keep my existing phone number?', a: 'Yes! Forward your existing number to DigiAsistan, or use the dedicated AI number we provide.' },
            { q: 'How long does setup take?', a: 'Most businesses are up and running in under 5 minutes. Sign up, set hours, add FAQs, and go live.' }
        ],
        ctaTitle1: 'Ready to Never Miss', ctaTitle2: 'a Call Again?', ctaSub: 'Start your 14-day free trial today. No credit card required.',
        footerDesc: 'AI-powered phone receptionist for service businesses.',
        footProduct: 'Product', footIndustries: 'Industries', footCompany: 'Company',
        footAbout: 'About', footBlog: 'Blog', footContact: 'Contact', footPrivacy: 'Privacy Policy',
        copyright: '© 2026 DigiAsistan. All rights reserved.'
    },
    tr: {
        navFeatures: 'Özellikler', navHow: 'Nasıl Çalışır', navPricing: 'Fiyatlar', navFaq: 'SSS',
        signIn: 'Giriş Yap', startTrial: 'Ücretsiz Dene',
        heroBadge: 'OpenAI Realtime Ses Teknolojisi — Anlık yanıt',
        heroTitle1: 'Telefonlarınıza', heroTitle2: '7/24 Cevap Veren AI',
        heroSub: 'DigiAsistan, işletmenize gelen aramaları karşılar, randevu oluşturur, müşteri sorularını yanıtlar ve tıpkı bir insan gibi konuşur. Gece gündüz fark etmez.',
        heroBtn1: '14 Gün Ücretsiz Dene', heroBtn2: 'Özellikleri İncele',
        stat1: 'Karşılanan Arama', stat2: 'Müşteri Memnuniyeti', stat3: 'Ort. Yanıt Süresi',
        socialLabel: 'Türkiye genelinde 500+ işletme DigiAsistan kullanıyor',
        socialItems: ['Diş Klinikleri', 'Kuaförler', 'Oto Servisler', 'Spor Salonları', 'Tıp Merkezleri', 'Hukuk Büroları'],
        featTag: 'Özellikler', featTitle1: 'Hiçbir Aramayı', featTitle2: 'Kaçırmamak İçin Her Şey', featSub: 'En güncel yapay zeka ses teknolojisiyle desteklenmektedir',
        features: [
            { title: 'Gerçekçi Sesli Görüşme', desc: 'Yapay zeka, OpenAI teknolojisiyle doğal ve akıcı bir şekilde konuşur. Arayanlar gerçek bir insanla konuştuğunu sanır.' },
            { title: 'Akıllı Randevu Sistemi', desc: 'Müsaitlik durumunu anlık kontrol eder, çakışmaları önler ve randevuyu otomatik oluşturur. SMS ile onay gönderir.' },
            { title: 'Otomatik Soru-Cevap', desc: 'Sık sorulan sorularınızı tanımlayın. Çalışma saatleri, fiyatlar ve hizmetler gibi sorulara anında cevap verir.' },
            { title: 'Arama Kayıtları ve Raporlar', desc: 'Her görüşme yazıya dökülür ve özetlenir. Müşteri memnuniyetini, yapılan işlemleri ve geçmişi kolayca takip edin.' },
            { title: 'Kişiselleştirilebilir Asistan', desc: 'Karşılama mesajını, konuşma tarzını ve bilgi tabanını kendinize göre ayarlayın. Sanki yıllardır çalışanınızmış gibi konuşsun.' },
            { title: '7/24 Kesintisiz Hizmet', desc: 'Gece yarısı, hafta sonu veya bayramda bile telefon cevaplanır. Hiçbir müşteri cevapsız kalmaz.' }
        ],
        howTag: 'Nasıl Çalışır', howTitle1: '5 Dakikada', howTitle2: 'Kurulumu Tamamlayın',
        steps: [
            { n: '01', t: 'Hesap Oluşturun', d: 'Hızlıca kaydolun ve işletmenize özel bir AI telefon numarası alın. Mevcut numaranızı da yönlendirebilirsiniz.' },
            { n: '02', t: 'Asistanınızı Ayarlayın', d: 'Çalışma saatlerinizi, hizmetlerinizi ve sık sorulan sorularınızı girin. Yapay zeka birkaç dakikada işletmenizi öğrenir.' },
            { n: '03', t: 'Hizmete Başlayın', d: 'Artık aramaları almaya hazırsınız! Yapay zeka randevu alır, soruları yanıtlar ve gerekirse sizi bilgilendirir.' }
        ],
        priceTag: 'Fiyatlar', priceTitle1: 'Basit ve Şeffaf', priceTitle2: 'Fiyatlandırma',
        priceSub: '14 gün ücretsiz deneyin. Kredi kartı gerekmez.',
        plans: [
            { id: 'starter', name: 'Başlangıç', price: '$149', desc: 'Küçük işletmeler için ideal', features: ['Aylık 300 arama dakikası', '100 SMS onayı', 'AI ile randevu alma', 'Yönetim paneli', 'E-posta desteği'] },
            { id: 'professional', name: 'Profesyonel', price: '$299', desc: 'Büyüyen işletmeler için', popular: true, features: ['Aylık 1.000 arama dakikası', '500 SMS onayı', 'Detaylı raporlar', 'Özel karşılama mesajı', 'Öncelikli destek', 'Birden fazla numara'] },
            { id: 'enterprise', name: 'Kurumsal', price: '$499', desc: 'Çok şubeli büyük işletmeler için', features: ['Aylık 3.000 arama dakikası', 'Sınırsız SMS', 'Tamamen özel asistan', 'Birebir destek', 'API erişimi', 'Çoklu şube desteği'] }
        ],
        getStarted: 'Hemen Başla', mostPopular: 'En Popüler',
        priceNote: 'Tüm planlar 14 günlük ücretsiz deneme içerir. Ek kullanım: $0.15/dakika, $0.02/SMS.',
        testTag: 'Referanslar', testTitle1: 'Müşterilerimiz', testTitle2: 'Ne Diyor?',
        testimonials: [
            { name: 'Dr. Ayşe Yılmaz', biz: 'Yılmaz Diş Kliniği', initials: 'AY', text: '"DigiAsistan kliniğimiz için harika oldu. Tedavi sırasında aramaların %30\'unu kaçırıyorduk, artık her arama profesyonelce karşılanıyor."' },
            { name: 'Mehmet Kaya', biz: 'Elite Oto Servis', initials: 'MK', text: '"Yapay zekanın telefonu açmasına başta inanamamıştım ama kalitesi gerçekten çok iyi. Müşterilerimiz farkına bile varmıyor."' },
            { name: 'Zeynep Demir', biz: 'Luxe Kuaför', initials: 'ZD', text: '"Resepsiyon masrafından ayda ciddi tasarruf sağladık. Yapay zeka aramalarımızın büyük bölümünü karşılıyor — randevu, bilgi ve iptaller."' }
        ],
        faqTag: 'SSS', faqTitle1: 'Sıkça Sorulan', faqTitle2: 'Sorular', faqSub: 'DigiAsistan hakkında merak edilenler',
        faqs: [
            { q: 'Gerçekten insan gibi mi konuşuyor?', a: 'Evet! DigiAsistan, OpenAI\'nin en gelişmiş ses teknolojisini kullanır. Doğal tonlama ve akıcı konuşmasıyla arayanlar yapay zeka olduğunu anlamaz.' },
            { q: 'Karmaşık durumları halledebilir mi?', a: 'Elbette. Randevu müsaitliğini kontrol eder, alternatif saatler önerir, çok adımlı işlemleri yönetir ve gerektiğinde sizi arar.' },
            { q: 'Arama limitimi aşarsam ne olur?', a: 'Hizmetiniz kesintisiz devam eder. Fazla kullanım dakika başı $0.15, SMS başı $0.02 olarak faturalandırılır.' },
            { q: 'Mevcut telefon numaramı kullanabilir miyim?', a: 'Evet! Mevcut numaranızı DigiAsistan\'a yönlendirebilir veya size özel verilen AI numarasını kullanabilirsiniz.' },
            { q: 'Kurulum ne kadar sürer?', a: 'Çoğu işletme 5 dakikadan kısa sürede başlıyor. Kaydolun, bilgilerinizi girin ve hemen kullanmaya başlayın.' }
        ],
        ctaTitle1: 'Kaçırılan Aramalara', ctaTitle2: 'Son Vermek İster misiniz?', ctaSub: 'Hemen 14 günlük ücretsiz denemenizi başlatın. Kredi kartı gerekmez.',
        footerDesc: 'İşletmeler için yapay zeka destekli telefon asistanı.',
        footProduct: 'Ürün', footIndustries: 'Sektörler', footCompany: 'Şirket',
        footAbout: 'Hakkımızda', footBlog: 'Blog', footContact: 'İletişim', footPrivacy: 'Gizlilik Politikası',
        copyright: '© 2026 DigiAsistan. Tüm hakları saklıdır.'
    }
};

const featureIcons = [Phone, Calendar, HelpCircle, MessageSquare, Shield, Clock];

export default function LandingPage() {
    const [openFaq, setOpenFaq] = useState(null);
    const { lang, setLang } = useLang();
    const { user } = useAuth();
    const l = t[lang];

    return (
        <div className="landing">
            {/* NAVBAR */}
            <nav className="landing-nav">
                <div className="landing-container nav-row">
                    <a href="#hero" className="landing-logo">
                        <div className="landing-logo-icon"><img src="/logo.png" alt="DigiAsistan" style={{ height: 32, width: 'auto', marginTop: -4 }} /></div>
                        <span>DigiAsistan</span>
                    </a>
                    <div className="landing-nav-links">
                        <a href="#features">{l.navFeatures}</a>
                        <a href="#how">{l.navHow}</a>
                        <a href="#pricing">{l.navPricing}</a>
                        <a href="#faq">{l.navFaq}</a>
                    </div>
                    <div className="landing-nav-actions">
                        <button className="lang-toggle" aria-label="Toggle language" onClick={() => setLang(lang === 'en' ? 'tr' : 'en')}>
                            <span className={lang === 'tr' ? 'lang-active' : ''}>TR</span>
                            <span className="lang-sep">/</span>
                            <span className={lang === 'en' ? 'lang-active' : ''}>EN</span>
                        </button>
                        {user ? (
                            <Link to="/dashboard" className="ln-btn-primary-sm">{lang === 'tr' ? 'Panele Git' : 'Go to Dashboard'}</Link>
                        ) : (
                            <>
                                <Link to="/login" className="ln-btn-ghost">{l.signIn}</Link>
                                <Link to="/register" className="ln-btn-primary-sm">{l.startTrial}</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* HERO */}
            <section className="landing-hero" id="hero">
                <div className="hero-orb hero-orb-1"></div>
                <div className="hero-orb hero-orb-2"></div>
                <div className="hero-orb hero-orb-3"></div>
                <div className="landing-container hero-inner">
                    <div className="hero-badge"><span className="badge-pulse"></span> {l.heroBadge}</div>
                    <h1>{l.heroTitle1}<br /><span className="gtext">{l.heroTitle2}</span></h1>
                    <p className="hero-sub">{l.heroSub}</p>
                    <div className="hero-btns">
                        <Link to="/register" className="ln-btn-primary"><ArrowRight size={18} /> {l.heroBtn1}</Link>
                        <a href="#features" className="ln-btn-outline"><Play size={18} /> {l.heroBtn2}</a>
                    </div>
                    <div className="hero-stats-row">
                        <div><strong>50K+</strong><span>{l.stat1}</span></div>
                        <div className="stat-divider"></div>
                        <div><strong>98%</strong><span>{l.stat2}</span></div>
                        <div className="stat-divider"></div>
                        <div><strong>2.3s</strong><span>{l.stat3}</span></div>
                    </div>
                </div>
            </section>

            {/* SOCIAL PROOF */}
            <section className="landing-social">
                <div className="landing-container">
                    <p className="social-label">{l.socialLabel}</p>
                    <div className="social-strip">
                        {l.socialItems.map(s => (
                            <span key={s} className="social-item">{s}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="landing-features" id="features">
                <div className="landing-container">
                    <div className="section-hdr">
                        <span className="section-tag">{l.featTag}</span>
                        <h2>{l.featTitle1}<br /><span className="gtext">{l.featTitle2}</span></h2>
                        <p>{l.featSub}</p>
                    </div>
                    <div className="feat-grid">
                        {l.features.map((f, i) => {
                            const Icon = featureIcons[i];
                            const colors = ['#6366f1', '#10b981', '#f59e0b', '#a855f7', '#3b82f6', '#ef4444'];
                            return (
                                <div className="feat-card" key={f.title}>
                                    <div className="feat-icon" style={{ background: `${colors[i]}15`, color: colors[i] }}><Icon size={24} /></div>
                                    <h3>{f.title}</h3>
                                    <p>{f.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="landing-how" id="how">
                <div className="landing-container">
                    <div className="section-hdr">
                        <span className="section-tag">{l.howTag}</span>
                        <h2>{l.howTitle1}<br /><span className="gtext">{l.howTitle2}</span></h2>
                    </div>
                    <div className="steps-row">
                        {l.steps.map((s, i) => (
                            <div key={s.n} className="step-item">
                                <div className="step-num">{s.n}</div>
                                <h3>{s.t}</h3>
                                <p>{s.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRICING */}
            <section className="landing-pricing" id="pricing">
                <div className="landing-container">
                    <div className="section-hdr">
                        <span className="section-tag">{l.priceTag}</span>
                        <h2>{l.priceTitle1}<br /><span className="gtext">{l.priceTitle2}</span></h2>
                        <p>{l.priceSub}</p>
                    </div>
                    <div className="price-grid">
                        {l.plans.map(p => (
                            <div key={p.id} className={`price-card ${p.popular ? 'price-pop' : ''}`}>
                                {p.popular && <div className="pop-badge">{l.mostPopular}</div>}
                                <h3>{p.name}</h3>
                                <p className="price-desc">{p.desc}</p>
                                <div className="price-amount"><span>{p.price}</span>{lang === 'tr' ? '/ay' : '/month'}</div>
                                <ul>
                                    {p.features.map((f, fi) => <li key={f}><Check size={16} color="#10b981" /> {f}</li>)}
                                </ul>
                                <Link to="/register" className={`ln-btn-price ${p.popular ? 'ln-btn-price-primary' : ''}`}>{l.getStarted}</Link>
                            </div>
                        ))}
                    </div>
                    <p className="price-note">{l.priceNote}</p>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="landing-testimonials">
                <div className="landing-container">
                    <div className="section-hdr">
                        <span className="section-tag">{l.testTag}</span>
                        <h2>{l.testTitle1}<br /><span className="gtext">{l.testTitle2}</span></h2>
                    </div>
                    <div className="test-grid">
                        {l.testimonials.map((tm, i) => (
                            <div key={tm.name} className="test-card">
                                <div className="test-stars">★★★★★</div>
                                <p>{tm.text}</p>
                                <div className="test-author">
                                    <div className="test-avatar">{tm.initials}</div>
                                    <div><strong>{tm.name}</strong><span>{tm.biz}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="ln-faq-section" id="faq">
                <div className="landing-container">
                    <div className="section-hdr">
                        <span className="section-tag">{l.faqTag}</span>
                        <h2>{l.faqTitle1}<br /><span className="gtext">{l.faqTitle2}</span></h2>
                        <p>{l.faqSub}</p>
                    </div>
                    <div className="ln-faq-list">
                        {l.faqs.map((f, i) => (
                            <div key={f.q} className={`ln-faq-item ${openFaq === i ? 'ln-faq-open' : ''}`}>
                                <button className="ln-faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                    <div className="ln-faq-num">{String(i + 1).padStart(2, '0')}</div>
                                    <span>{f.q}</span>
                                    <div className="ln-faq-icon">
                                        <span className="ln-faq-plus"></span>
                                    </div>
                                </button>
                                <div className="ln-faq-answer" style={{ maxHeight: openFaq === i ? 200 : 0 }}>
                                    <div className="ln-faq-answer-inner">
                                        <p>{f.a}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="landing-cta">
                <div className="landing-container">
                    <div className="cta-box">
                        <div className="cta-orb cta-orb-1"></div>
                        <div className="cta-orb cta-orb-2"></div>
                        <h2>{l.ctaTitle1}<br />{l.ctaTitle2}</h2>
                        <p>{l.ctaSub}</p>
                        <Link to="/register" className="ln-btn-primary">{l.startTrial} <ArrowRight size={18} /></Link>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="landing-footer">
                <div className="landing-container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <div className="landing-logo"><div className="landing-logo-icon"><img src="/logo.png" alt="DigiAsistan" style={{ height: 28, width: 'auto', marginTop: -4 }} /></div><span>DigiAsistan</span></div>
                            <p>{l.footerDesc}</p>
                        </div>
                        <div className="footer-col">
                            <h4>{l.footProduct}</h4>
                            <a href="#features">{l.navFeatures}</a><a href="#pricing">{l.navPricing}</a><a href="#how">{l.navHow}</a><a href="#faq">{l.navFaq}</a>
                        </div>
                        <div className="footer-col">
                            <h4>{l.footIndustries}</h4>
                            {l.socialItems.slice(0, 4).map(s => <a key={s} href="#">{s}</a>)}
                        </div>
                        <div className="footer-col">
                            <h4>{l.footCompany}</h4>
                            <a href="#">{l.footAbout}</a><a href="#">{l.footBlog}</a><a href="#">{l.footContact}</a><a href="#">{l.footPrivacy}</a>
                        </div>
                    </div>
                    <div className="footer-bottom"><p>{l.copyright}</p></div>
                </div>
            </footer>
        </div>
    );
}
