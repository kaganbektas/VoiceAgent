import { useEffect } from 'react';

export default function ConfirmDialog({ title, message, onConfirm, onCancel, lang }) {
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onCancel(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onCancel]);

    return (
        <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true">
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }} role="alertdialog">
                <div className="modal-header">
                    <h3>{title || (lang === 'tr' ? 'Onay Gerekli' : 'Confirm Action')}</h3>
                    <button className="modal-close" aria-label="Close" onClick={onCancel}>✕</button>
                </div>
                <p style={{ padding: '12px 0 20px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onCancel}>
                        {lang === 'tr' ? 'Vazgeç' : 'Cancel'}
                    </button>
                    <button className="btn btn-danger" onClick={onConfirm}>
                        {lang === 'tr' ? 'Onayla' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
}
