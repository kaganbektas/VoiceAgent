import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(localStorage.getItem('lang') || 'tr');

    const switchLang = (newLang) => {
        setLang(newLang);
        localStorage.setItem('lang', newLang);
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang: switchLang }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLang() {
    return useContext(LanguageContext);
}

// =================== DASHBOARD TRANSLATIONS ===================
export const dashboard = {
    en: {
        // Layout sidebar
        sidebarDashboard: 'Dashboard', sidebarCalls: 'Call History', sidebarAppointments: 'Appointments',
        sidebarCustomers: 'Customers', sidebarFaqs: 'AI Knowledge', sidebarBilling: 'Billing',
        sidebarSettings: 'Settings', sidebarHomepage: 'Homepage', sidebarSignOut: 'Sign Out',
        trial: '🟡 Trial', active: '🟢 Active',

        // Dashboard page
        dashTitle: 'Dashboard', dashSub: 'Overview of your AI receptionist performance',
        callsToday: 'Calls Today', todayAppts: "Today's Appointments", totalCustomers: 'Total Customers',
        successRate: 'Call Success Rate', callVolume: 'Call Volume', last7: 'Last 7 days',
        recentActivity: 'Recent Activity', noCalls: 'No calls yet',
        noCallsSub: 'Calls will appear here once your AI receptionist starts handling them',
        usageTitle: 'Usage This Month', callMinUsed: 'Call Minutes Used', smsSent: 'SMS Sent',

        // Calls page
        callHistoryTitle: 'Call History', callHistorySub: 'All calls handled by your AI receptionist',
        searchCalls: 'Search calls...', caller: 'Caller', status: 'Status', duration: 'Duration',
        summary: 'Summary', date: 'Date', callDetails: 'Call Details', transcript: 'Transcript',
        noCallsYet: 'No calls yet', noCallsYetSub: 'Call history will appear here as your AI handles calls',

        // Appointments page
        apptTitle: 'Appointments', apptSub: 'Manage appointments booked by your AI',
        searchAppts: 'Search appointments...', bookNew: '+ Book New',
        customer: 'Customer', phoneNum: 'Phone', dateTime: 'Date & Time', service: 'Service',
        actions: 'Actions', cancel: 'Cancel', noAppts: 'No Appointments',
        noApptsSub: 'Appointments booked by your AI will appear here',
        bookAppointment: 'Book Appointment', custName: 'Customer Name', bookBtn: 'Book Appointment',

        // Customers page
        custTitle: 'Customers', custSub: 'People who have called your business',
        searchCust: 'Search customers...', name: 'Name', phone: 'Phone',
        totalCalls: 'Total Calls', lastCall: 'Last Call', noCust: 'No Customers Yet',
        noCustSub: 'Customer profiles are created automatically from incoming calls',

        // FAQ page
        faqTitle: 'AI Knowledge Base', faqSub: 'Teach your AI how to answer common questions',
        searchFaq: 'Search FAQs...', addNew: 'Add New', question: 'Question', answer: 'Answer',
        save: 'Save', remove: 'Remove', noFaqs: 'No FAQs Yet',
        noFaqsSub: 'Add questions and answers to train your AI receptionist',

        // Settings page
        settingsTitle: 'Settings', settingsSub: 'Configure your AI receptionist, business details, and working hours',
        bizInfo: 'Business Info', bizInfoSub: 'Your business details', bizName: 'Business Name',
        phoneNumber: 'Phone Number', currentPlan: 'Current Plan',
        aiConfig: 'AI Configuration', aiConfigSub: 'Customize your AI receptionist',
        greeting: 'Greeting Message', greetingHint: 'The first thing your AI says when answering a call',
        timezone: 'Timezone', language: 'Language', saveSettings: 'Save Settings', saved: '✓ Saved!',
        bizHours: 'Business Hours', bizHoursSub: 'Your AI will inform callers when you\'re open or closed',
        saveHours: 'Save Hours', daysOpen: 'Days Open', daysClosed: 'Days Closed',
        applyMonday: 'Apply Monday hours to all weekdays',
        open: 'Open', closed: 'Closed',
        sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday',

        // Billing page
        billingTitle: 'Billing', billingSub: 'Manage your subscription and payment methods',
        currentPlanTitle: 'Current Plan', changePlan: 'Change Plan', paymentMethod: 'Payment Method',
        addCard: 'Add Card', invoices: 'Recent Invoices', noInvoices: 'No invoices yet',

        // Login / Register
        loginTitle: 'Welcome Back', loginSub: 'Sign in to your account', email: 'Email', password: 'Password',
        loginBtn: 'Sign In', noAccount: "Don't have an account?", signUp: 'Sign up',
        regTitle: 'Create Account', regSub: 'Start your 14-day free trial', businessName: 'Business Name',
        confirmPass: 'Confirm Password', regBtn: 'Create Account', haveAccount: 'Already have an account?', signIn: 'Sign in',
        trialBannerTitle: 'Activate Your AI Phone Number',
        trialBannerDesc: 'You are currently in trial mode. Upgrade your plan to get a dedicated phone number and start receiving real calls.',
        upgradeBtn: 'Upgrade Now',
    },
    tr: {
        // Layout sidebar
        sidebarDashboard: 'Panel', sidebarCalls: 'Arama Geçmişi', sidebarAppointments: 'Randevular',
        sidebarCustomers: 'Müşteriler', sidebarFaqs: 'AI Bilgi Tabanı', sidebarBilling: 'Faturalandırma',
        sidebarSettings: 'Ayarlar', sidebarHomepage: 'Ana Sayfa', sidebarSignOut: 'Çıkış Yap',
        trial: '🟡 Deneme', active: '🟢 Aktif',

        // Dashboard page
        dashTitle: 'Panel', dashSub: 'AI resepsiyonist performans özeti',
        callsToday: 'Bugünkü Aramalar', todayAppts: 'Bugünkü Randevular', totalCustomers: 'Toplam Müşteri',
        successRate: 'Başarı Oranı', callVolume: 'Arama Hacmi', last7: 'Son 7 gün',
        recentActivity: 'Son Aktiviteler', noCalls: 'Henüz arama yok',
        noCallsSub: 'AI resepsiyonistiniz arama almaya başladığında burada görünecek',
        usageTitle: 'Bu Ayki Kullanım', callMinUsed: 'Kullanılan Arama Dakikası', smsSent: 'Gönderilen SMS',

        // Calls page
        callHistoryTitle: 'Arama Geçmişi', callHistorySub: 'AI resepsiyonistinizin karşıladığı tüm aramalar',
        searchCalls: 'Arama ara...', caller: 'Arayan', status: 'Durum', duration: 'Süre',
        summary: 'Özet', date: 'Tarih', callDetails: 'Arama Detayları', transcript: 'Transkript',
        noCallsYet: 'Henüz arama yok', noCallsYetSub: 'AI aramaları yönettikçe burada görünecek',

        // Appointments page
        apptTitle: 'Randevular', apptSub: 'AI tarafından alınan randevuları yönetin',
        searchAppts: 'Randevu ara...', bookNew: '+ Yeni Randevu',
        customer: 'Müşteri', phoneNum: 'Telefon', dateTime: 'Tarih & Saat', service: 'Hizmet',
        actions: 'İşlemler', cancel: 'İptal', noAppts: 'Randevu Yok',
        noApptsSub: 'AI tarafından alınan randevular burada görünecek',
        bookAppointment: 'Randevu Oluştur', custName: 'Müşteri Adı', bookBtn: 'Randevu Al',

        // Customers page
        custTitle: 'Müşteriler', custSub: 'İşletmenizi arayan kişiler',
        searchCust: 'Müşteri ara...', name: 'Ad', phone: 'Telefon',
        totalCalls: 'Toplam Arama', lastCall: 'Son Arama', noCust: 'Henüz Müşteri Yok',
        noCustSub: 'Gelen aramalardan otomatik olarak müşteri profilleri oluşturulur',

        // FAQ page
        faqTitle: 'AI Bilgi Tabanı', faqSub: 'AI\'nize sık sorulan soruları öğretin',
        searchFaq: 'SSS ara...', addNew: 'Yeni Ekle', question: 'Soru', answer: 'Cevap',
        save: 'Kaydet', remove: 'Kaldır', noFaqs: 'Henüz SSS Yok',
        noFaqsSub: 'AI resepsiyonistinizi eğitmek için soru ve cevaplar ekleyin',

        // Settings page
        settingsTitle: 'Ayarlar', settingsSub: 'AI resepsiyonist, işletme bilgileri ve çalışma saatlerini yapılandırın',
        bizInfo: 'İşletme Bilgileri', bizInfoSub: 'İşletme detaylarınız', bizName: 'İşletme Adı',
        phoneNumber: 'Telefon Numarası', currentPlan: 'Mevcut Plan',
        aiConfig: 'AI Yapılandırması', aiConfigSub: 'AI resepsiyonistinizi özelleştirin',
        greeting: 'Karşılama Mesajı', greetingHint: 'AI\'nizin telefonu açtığında söylediği ilk cümle',
        timezone: 'Saat Dilimi', language: 'Dil', saveSettings: 'Ayarları Kaydet', saved: '✓ Kaydedildi!',
        bizHours: 'Çalışma Saatleri', bizHoursSub: 'AI arayanları açık/kapalı olduğunuz hakkında bilgilendirir',
        saveHours: 'Saatleri Kaydet', daysOpen: 'Açık Gün', daysClosed: 'Kapalı Gün',
        applyMonday: 'Pazartesi saatlerini tüm hafta içine uygula',
        open: 'Açık', closed: 'Kapalı',
        sun: 'Pazar', mon: 'Pazartesi', tue: 'Salı', wed: 'Çarşamba', thu: 'Perşembe', fri: 'Cuma', sat: 'Cumartesi',

        // Billing page
        billingTitle: 'Faturalandırma', billingSub: 'Abonelik ve ödeme yöntemlerini yönetin',
        currentPlanTitle: 'Mevcut Plan', changePlan: 'Plan Değiştir', paymentMethod: 'Ödeme Yöntemi',
        addCard: 'Kart Ekle', invoices: 'Son Faturalar', noInvoices: 'Henüz fatura yok',

        // Login / Register
        loginTitle: 'Hoş Geldiniz', loginSub: 'Hesabınıza giriş yapın', email: 'E-posta', password: 'Şifre',
        loginBtn: 'Giriş Yap', noAccount: 'Hesabınız yok mu?', signUp: 'Kayıt ol',
        regTitle: 'Hesap Oluştur', regSub: '14 günlük ücretsiz denemenizi başlatın', businessName: 'İşletme Adı',
        confirmPass: 'Şifre Tekrar', regBtn: 'Hesap Oluştur', haveAccount: 'Zaten hesabınız var mı?', signIn: 'Giriş yap',
        trialBannerTitle: 'AI Telefon Numaranızı Aktifleştirin',
        trialBannerDesc: 'Şu anda deneme modundasınız. Gerçek aramaları almaya başlamak ve özel numaranızı almak için paketinizi yükseltin.',
        upgradeBtn: 'Hemen Yükselt',
    }
};
