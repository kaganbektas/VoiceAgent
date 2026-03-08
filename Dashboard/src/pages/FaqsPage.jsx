import { useState, useEffect } from 'react';
import { api } from '../api';
import { HelpCircle, Plus, Pencil, Trash2, Layers } from 'lucide-react';
import { useLang, dashboard as t } from '../LanguageContext';
import ConfirmDialog from '../ConfirmDialog';

const PRESETS = {
    tr: {
        kuafor: {
            label: 'Kuafor / Berber',
            faqs: [
                { question: 'Randevusuz gelebilir miyim?', answer: 'Randevusuz da gelebilirsiniz ancak randevulu müşterilerimize öncelik veriyoruz. Yoğun saatlerde bekleme süresi olabilir.', category: '' },
                { question: 'Ödeme yöntemleriniz nelerdir?', answer: 'Nakit, kredi kartı ve banka kartı ile ödeme kabul ediyoruz.', category: 'pricing' },
                { question: 'İptal ve değişiklik politikanız nedir?', answer: 'Randevunuzu en az 2 saat öncesinden iptal veya değiştirmenizi rica ederiz.', category: 'policies' },
                { question: 'Çocuklara hizmet veriyor musunuz?', answer: 'Evet, her yaş grubuna hizmet veriyoruz. Çocuk saç kesimi için randevu alabilirsiniz.', category: '' },
                { question: 'Park yeri var mı?', answer: 'Yakın çevrede ücretli otopark mevcuttur.', category: '' },
            ]
        },
        dis: {
            label: 'Dis Klinigi',
            faqs: [
                { question: 'Sigorta kabul ediyor musunuz?', answer: 'Evet, çoğu özel sağlık sigortasını kabul ediyoruz. Detaylı bilgi için kliniğimizi arayabilirsiniz.', category: 'insurance' },
                { question: 'Acil durumlarda randevu alabilir miyim?', answer: 'Evet, acil diş ağrısı ve kırılma gibi durumlarda aynı gün randevu ayarlıyoruz.', category: '' },
                { question: 'İlk muayene ücreti nedir?', answer: 'İlk muayene ve röntgen ücretleri için lütfen kliniğimizi arayın, güncel fiyatlandırmamızı iletebiliriz.', category: 'pricing' },
                { question: 'Çocuk diş hekimliği hizmeti veriyor musunuz?', answer: 'Evet, 3 yaş ve üzeri çocuklara pediatrik diş hekimliği hizmeti sunuyoruz.', category: '' },
                { question: 'Tedavi süreleri ne kadar?', answer: 'Dolgu 30-60 dk, kanal tedavisi 1-2 seans alabilir. Doktorunuz size detaylı bilgi verecektir.', category: '' },
            ]
        },
        oto: {
            label: 'Oto Servis',
            faqs: [
                { question: 'Aracımı servise bırakabilir miyim?', answer: 'Evet, aracınızı servise bırakabilirsiniz. Tahmini süreyi ve ücreti size önceden bildiririz.', category: '' },
                { question: 'Yedek parça garantisi veriyor musunuz?', answer: 'Evet, kullandığımız tüm yedek parçalar garantilidir. Detaylar için servisimizle iletişime geçin.', category: 'policies' },
                { question: 'Fiyat bilgisi için ne yapmalıyım?', answer: 'Aracınızın marka, model ve yıl bilgisini paylaşın, en kısa sürede fiyat teklifi iletebiliriz.', category: 'pricing' },
                { question: 'Servis saatleriniz nelerdir?', answer: 'Hafta içi 08:00-18:00, Cumartesi 09:00-15:00 saatleri arasında hizmet veriyoruz.', category: 'hours' },
                { question: 'Araç muayeneye hazırlık yapıyor musunuz?', answer: 'Evet, araç muayeneye hazırlık kontrolü yapıyoruz. Randevu almanızı tavsiye ederiz.', category: 'services' },
            ]
        },
        spor: {
            label: 'Spor Salonu / Fitness',
            faqs: [
                { question: 'Üyelik paketleriniz nelerdir?', answer: 'Aylık, 3 aylık ve yıllık paketlerimiz mevcuttur. Detaylı bilgi için salonumuzu ziyaret edebilirsiniz.', category: 'pricing' },
                { question: 'Kişisel antrenör hizmeti var mı?', answer: 'Evet, deneyimli kişisel antrenörlerimiz ile birebir çalışma seansları düzenleyebilirsiniz.', category: 'services' },
                { question: 'Grup dersleri ne zaman?', answer: 'Pilates, yoga ve aerobik gibi grup derslerimiz haftanın belirli günlerinde düzenlenmektedir. Program için resepsiyonumuzu arayın.', category: 'hours' },
                { question: 'Duş ve soyunma odası var mı?', answer: 'Evet, erkek ve bayan ayrı duş ve soyunma odaları bulunmaktadır.', category: '' },
                { question: 'Üyelik dondurmak mümkün mü?', answer: 'Evet, belirli koşullar dahilinde üyeliğinizi dondurabilirsiniz. Detay için salonumuzla iletişime geçin.', category: 'policies' },
            ]
        },
        hukuk: {
            label: 'Hukuk Bürosu',
            faqs: [
                { question: 'İlk danışmanlık ücretsiz mi?', answer: 'İlk görüşme için lütfen büromuzu arayın; ücret politikamız hakkında bilgi verebiliriz.', category: 'pricing' },
                { question: 'Hangi hukuk alanlarında hizmet veriyorsunuz?', answer: 'Aile hukuku, iş hukuku, ceza hukuku ve ticaret hukuku başta olmak üzere birçok alanda hizmet sunuyoruz.', category: 'services' },
                { question: 'Randevu nasıl alabilirim?', answer: 'Telefon ile veya bu sistem üzerinden randevu alabilirsiniz. En kısa sürede sizi geri arayacağız.', category: '' },
                { question: 'Belge getirmem gerekiyor mu?', answer: 'İlk görüşmeye davanızla ilgili tüm belge ve sözleşmeleri getirmenizi öneririz.', category: '' },
                { question: 'Davamın süreci ne kadar sürer?', answer: 'Dava süresi konuya ve mahkeme yoğunluğuna göre değişir. Avukatınız size detaylı bilgi verecektir.', category: '' },
            ]
        },
        guzellik: {
            label: 'Güzellik / SPA',
            faqs: [
                { question: 'Hangi cilt bakımı hizmetleriniz var?', answer: 'Yüz maskesi, peeling, nem terapisi, akne tedavisi ve anti-aging uygulamalar sunuyoruz.', category: 'services' },
                { question: 'Randevu ne kadar önceden almalıyım?', answer: 'Hafta sonu için 2-3 gün, hafta içi için 1 gün önceden randevu almanızı öneriyoruz.', category: '' },
                { question: 'Hamile kadınlar için hizmetleriniz var mı?', answer: 'Evet, hamileliğe uygun masaj ve bakım hizmetlerimiz mevcuttur. Randevu sırasında lütfen belirtin.', category: '' },
                { question: 'Hediye çeki satın alabilir miyim?', answer: 'Evet, sevdiklerinize özel hediye çeklerimiz mevcuttur. Detaylı bilgi için salonumuzu arayın.', category: '' },
                { question: 'Ürünlerinizi yerinde satın alabilir miyim?', answer: 'Evet, salon ürünlerimiz yerinde satışa sunulmaktadır.', category: 'pricing' },
            ]
        },
    },
    en: {
        salon: {
            label: 'Hair Salon / Barber',
            faqs: [
                { question: 'Do I need an appointment?', answer: 'Walk-ins are welcome, but appointments are preferred. Wait times may vary during busy periods.', category: '' },
                { question: 'What payment methods do you accept?', answer: 'We accept cash, credit cards, and debit cards.', category: 'pricing' },
                { question: 'What is your cancellation policy?', answer: 'Please cancel or reschedule at least 2 hours in advance.', category: 'policies' },
                { question: 'Do you serve children?', answer: 'Yes, we welcome clients of all ages including children.', category: '' },
            ]
        },
        dental: {
            label: 'Dental Office',
            faqs: [
                { question: 'Do you accept insurance?', answer: 'Yes, we accept most major dental insurance plans. Please contact us for details.', category: 'insurance' },
                { question: 'Can I get a same-day emergency appointment?', answer: 'Yes, we accommodate dental emergencies same-day whenever possible.', category: '' },
                { question: 'How long do appointments take?', answer: 'Fillings take 30-60 minutes; root canals may require 1-2 sessions.', category: '' },
                { question: 'Do you offer pediatric dentistry?', answer: 'Yes, we provide dental care for children aged 3 and older.', category: '' },
            ]
        },
        auto: {
            label: 'Auto Repair Shop',
            faqs: [
                { question: 'Can I drop my car off?', answer: 'Yes, you can drop off your vehicle. We will provide an estimate before starting any work.', category: '' },
                { question: 'Do you provide warranties on parts?', answer: 'Yes, all installed parts come with a warranty. Contact us for specific details.', category: 'policies' },
                { question: 'How do I get a price quote?', answer: 'Share your vehicle make, model, and year — we will get back to you quickly.', category: 'pricing' },
                { question: 'What are your hours?', answer: 'Monday–Friday 8am–6pm, Saturday 9am–3pm.', category: 'hours' },
            ]
        },
        fitness: {
            label: 'Fitness / Gym',
            faqs: [
                { question: 'What membership plans do you offer?', answer: 'We offer monthly, 3-month, and annual memberships. Visit us for current pricing.', category: 'pricing' },
                { question: 'Do you have personal trainers?', answer: 'Yes, certified personal trainers are available for one-on-one sessions.', category: 'services' },
                { question: 'Are group classes available?', answer: 'Yes, we offer yoga, pilates, and aerobics. Contact us for the current schedule.', category: 'hours' },
                { question: 'Can I freeze my membership?', answer: 'Yes, membership freezes are available under certain conditions. Contact us for details.', category: 'policies' },
            ]
        },
    }
};

export default function FaqsPage() {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPresets, setShowPresets] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ question: '', answer: '', category: '' });
    const [confirmState, setConfirmState] = useState(null);
    const { lang } = useLang();
    const l = t[lang];

    const load = () => {
        setLoading(true);
        api.getFaqs().then(setFaqs).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(load, []);

    const openNew = () => {
        setEditing(null);
        setForm({ question: '', answer: '', category: '' });
        setShowModal(true);
    };

    const openEdit = (faq) => {
        setEditing(faq);
        setForm({ question: faq.question, answer: faq.answer, category: faq.category || '' });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (editing) {
            await api.updateFaq(editing.id, form);
        } else {
            await api.createFaq(form);
        }
        setShowModal(false);
        load();
    };

    const handleDelete = (id) => {
        setConfirmState({
            message: lang === 'tr' ? 'Bu SSS kalıcı olarak silinecek. Emin misiniz?' : 'This FAQ will be permanently deleted. Are you sure?',
            onConfirm: async () => {
                setConfirmState(null);
                await api.deleteFaq(id);
                load();
            }
        });
    };

    const applyPreset = async (preset) => {
        setShowPresets(false);
        for (const faq of preset.faqs) {
            await api.createFaq(faq);
        }
        load();
    };

    if (loading) return <div className="loading-page"><div className="spinner" /></div>;

    const catLabels = lang === 'tr'
        ? { '': 'Genel', services: 'Hizmetler', pricing: 'Fiyatlar', hours: 'Çalışma Saatleri', insurance: 'Sigorta', policies: 'Kurallar' }
        : { '': 'General', services: 'Services', pricing: 'Pricing', hours: 'Hours & Location', insurance: 'Insurance', policies: 'Policies' };

    const presets = PRESETS[lang] || PRESETS.tr;

    return (
        <div className="slide-up">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2>{l.faqTitle}</h2>
                    <p>{l.faqSub}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => setShowPresets(true)}>
                        <Layers size={16} /> {lang === 'tr' ? 'Hazir Setler' : 'Presets'}
                    </button>
                    <button className="btn btn-primary" onClick={openNew}>
                        <Plus size={16} /> {l.addNew}
                    </button>
                </div>
            </div>

            <div style={{ background: '#1c1c1f', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
                💡 <strong>{lang === 'tr' ? 'İpucu:' : 'Tip:'}</strong> {lang === 'tr' ? 'Müşterilerinizin sık sorduğu soruları ekleyin. AI bu cevapları kullanarak aramalarda doğru bilgi verecektir.' : 'Add common questions your customers ask. Your AI will use these to give accurate, business-specific answers during calls.'}
            </div>

            {faqs.length > 0 ? (
                faqs.map(faq => (
                    <div key={faq.id} className="faq-item">
                        {faq.category && <span className="badge neutral" style={{ marginBottom: 8 }}>{catLabels[faq.category] || faq.category}</span>}
                        <div className="question">{lang === 'tr' ? 'S' : 'Q'}: {faq.question}</div>
                        <div className="answer">{lang === 'tr' ? 'C' : 'A'}: {faq.answer}</div>
                        <div className="faq-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(faq)}>
                                <Pencil size={14} /> {lang === 'tr' ? 'Düzenle' : 'Edit'}
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(faq.id)}>
                                <Trash2 size={14} /> {lang === 'tr' ? 'Sil' : 'Delete'}
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <HelpCircle size={40} />
                        <h3>{l.noFaqs}</h3>
                        <p>{l.noFaqsSub}</p>
                    </div>
                </div>
            )}

            {/* Presets Modal */}
            {showPresets && (
                <div className="modal-overlay" onClick={() => setShowPresets(false)} role="dialog" aria-modal="true">
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }} role="document">
                        <div className="modal-header">
                            <h3>{lang === 'tr' ? 'Meslege Göre Hazir SSS Seti' : 'Preset FAQ Sets by Profession'}</h3>
                            <button className="modal-close" aria-label="Close" onClick={() => setShowPresets(false)}>✕</button>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                            {lang === 'tr'
                                ? 'Mesleginize uygun hazir sorular ekleyin. Mevcut SSS\'leriniz silinmez.'
                                : 'Add preset questions for your profession. Your existing FAQs will not be deleted.'}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {Object.entries(presets).map(([key, preset]) => (
                                <button
                                    key={key}
                                    className="btn btn-secondary"
                                    style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                                    onClick={() => applyPreset(preset)}
                                >
                                    <Layers size={16} />
                                    <span>
                                        <strong>{preset.label}</strong>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                                            ({preset.faqs.length} {lang === 'tr' ? 'soru' : 'questions'})
                                        </span>
                                    </span>
                                </button>
                            ))}
                        </div>
                        <div style={{ marginTop: 16 }}>
                            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setShowPresets(false)}>
                                {lang === 'tr' ? 'Kapat' : 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)} onKeyDown={e => e.key === 'Escape' && setShowModal(false)} role="dialog" aria-modal="true">
                    <div className="modal" onClick={e => e.stopPropagation()} role="document">
                        <div className="modal-header">
                            <h3>{editing ? (lang === 'tr' ? 'SSS Düzenle' : 'Edit FAQ') : (lang === 'tr' ? 'SSS Ekle' : 'Add FAQ')}</h3>
                            <button className="modal-close" aria-label="Close dialog" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label htmlFor="faqCat">{lang === 'tr' ? 'Kategori' : 'Category'}</label>
                                <select id="faqCat" className="form-input" aria-label="FAQ category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                                    {Object.entries(catLabels).map(([val, label]) => (
                                        <option key={val} value={val}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="faqQ">{l.question} *</label>
                                <input id="faqQ" className="form-input" value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                                    placeholder={lang === 'tr' ? 'örn. Randevusuz gelebilir miyim?' : 'e.g. Do you accept walk-ins?'} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="faqA">{l.answer} *</label>
                                <textarea id="faqA" className="form-input" value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
                                    placeholder={lang === 'tr' ? 'Cevabinizi buraya yazin...' : 'Type your answer here...'} required />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{l.cancel}</button>
                                <button type="submit" className="btn btn-primary">{editing ? l.save : l.addNew}</button>
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
