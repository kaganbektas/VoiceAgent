const API_BASE = '/api';

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');
    }

    async request(path, options = {}) {
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

        const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

        if (res.status === 401 && !path.startsWith('/auth/')) {
            this.setToken(null);
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(err.error || 'Request failed');
        }

        return res.json();
    }

    get(path) { return this.request(path); }
    post(path, body) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); }
    put(path, body) { return this.request(path, { method: 'PUT', body: JSON.stringify(body) }); }
    del(path) { return this.request(path, { method: 'DELETE' }); }

    // Auth
    login(email, password) { return this.post('/auth/login', { email, password }); }
    register(data) { return this.post('/auth/register', data); }

    // Dashboard
    getStats() { return this.get('/dashboard/stats'); }

    // Appointments
    getUpcoming(days = 7) { return this.get(`/appointment/upcoming?days=${days}`); }
    getOverdue() { return this.get('/appointment/overdue'); }
    getAppointment(id) { return this.get(`/appointment/${id}`); }
    getByDate(date) { return this.get(`/appointment/date/${date}`); }
    getAvailability(date) { return this.get(`/appointment/availability/${date}`); }
    bookAppointment(data) { return this.post('/appointment', data); }
    cancelAppointment(id) { return this.del(`/appointment/${id}`); }

    // Customers
    getCustomers() { return this.get('/customer'); }
    createCustomer(data) { return this.post('/customer', data); }
    updateCustomer(id, data) { return this.put(`/customer/${id}`, data); }
    deleteCustomer(id) { return this.del(`/customer/${id}`); }

    // Calls
    getCalls(count = 50) { return this.get(`/call?count=${count}`); }
    getCall(id) { return this.get(`/call/${id}`); }

    // FAQs
    getFaqs() { return this.get('/faq'); }
    createFaq(data) { return this.post('/faq', data); }
    updateFaq(id, data) { return this.put(`/faq/${id}`, data); }
    deleteFaq(id) { return this.del(`/faq/${id}`); }

    // Settings
    getSettings() { return this.get('/settings'); }
    updateSettings(data) { return this.put('/settings', data); }
    updateHours(data) { return this.put('/settings/hours', data); }

    // Billing
    createCheckout(plan) { return this.post('/billing/checkout', { plan, successUrl: window.location.origin + '/settings?billing=success', cancelUrl: window.location.origin + '/settings?billing=cancelled' }); }
    createPortal() { return this.post('/billing/portal', { returnUrl: window.location.origin + '/settings' }); }
}

export const api = new ApiClient();
