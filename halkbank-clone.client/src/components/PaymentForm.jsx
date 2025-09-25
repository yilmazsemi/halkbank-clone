import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Send, ArrowRightLeft, CheckCircle, AlertCircle, User } from 'lucide-react';
import '../PaymentForm.css';

const PaymentForm = ({ user }) => {
    const navigate = useNavigate();

    const [accounts, setAccounts] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [transferLoading, setTransferLoading] = useState(false);
    const [alert, setAlert] = useState(null);

    const userTckn = user?.userTckn;

    const [formData, setFormData] = useState({
        fromIban: '',
        toIban: '',
        amount: '',
        description: '',
    });

    const showAlert = useCallback((message, type) => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 5000);
    }, []);

    const loadAccounts = useCallback(async () => {
        if (!userTckn) {
            setLoading(false);
            return;
        }
        try {
            const response = await fetch(`/api/Firebase/accounts?tckn=${userTckn}`);
            if (!response.ok) throw new Error('Hesaplar yüklenemedi');
            const data = await response.json();
            const processedAccounts = data.map((acc) => ({
                ...acc,
                id: acc.iban,
                accountHolder: acc.accountHolder || `Kullanıcı ${acc.tckn}`,
            }));
            setAccounts(processedAccounts);
        } catch (error) {
            console.error('Hesap yükleme hatası:', error);
            showAlert('Hesaplar yüklenemedi', 'error');
        } finally {
            setLoading(false);
        }
    }, [showAlert, userTckn]);

    const loadTransfers = useCallback(async () => {
        try {
            const response = await fetch('/api/Firebase/transfers');
            if (!response.ok) throw new Error('Transfer geçmişi yüklenemedi');
            const data = await response.json();
            setTransfers(data);
        } catch (error) {
            console.error('Transfer geçmişi yükleme hatası:', error);
            showAlert('Transfer geçmişi yüklenemedi', 'error');
        }
    }, [showAlert]);

    useEffect(() => {
        loadAccounts();
        loadTransfers();
    }, [loadAccounts, loadTransfers]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.fromIban || !formData.toIban || !formData.amount) {
            showAlert('Lütfen tüm zorunlu alanları doldurun!', 'error');
            return;
        }
        if (formData.fromIban === formData.toIban) {
            showAlert('Aynı hesaba para gönderemezsiniz!', 'error');
            return;
        }

        setTransferLoading(true);
        try {
            const response = await fetch('/api/Firebase/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromIban: formData.fromIban,
                    toIban: formData.toIban,
                    amount: parseFloat(formData.amount),
                    description: formData.description,
                }),
            });
            const result = await response.json();
            if (response.ok) {
                showAlert(result.message || 'Transfer başarılı', 'success');
                setFormData({ fromIban: '', toIban: '', amount: '', description: '' });
                loadAccounts();
                loadTransfers();
            } else {
                showAlert(result.message || 'Transfer başarısız', 'error');
            }
        } catch (error) {
            console.error('Transfer hatası:', error);
            showAlert('Transfer sırasında hata oluştu!', 'error');
        } finally {
            setTransferLoading(false);
        }
    };

    const formatMoney = (amount) =>
        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getAccountName = (iban) => {
        const account = accounts.find((acc) => acc.id === iban);
        return account ? account.accountHolder : 'Bilinmeyen';
    };

    // IBAN benim mi?
    const isMine = (iban) => accounts.some(a => a.id === iban);

    if (loading) {
        return (
            <div className="payment-page-container flex items-center justify-center">
                <div className="loading-spinner-large"></div>
            </div>
        );
    }

    return (
        <div className="payment-page-container">
            <div className="max-width-container">
                {/* Geri Dön Butonu */}
                <div className="back-button-container">
                    <button
                        type="button"
                        onClick={() => navigate('/home')}
                        className="back-button"
                    >
                        ← Geri
                    </button>
                </div>

                {/* Başlık */}
                <div className="header-section">
                    <div className="header-content">
                        <CreditCard className="header-icon" />
                        <div>
                            <h1 className="header-title">Halkbank Para Transferi</h1>
                            <p className="header-subtitle">Güvenli ve hızlı para transferi</p>
                        </div>
                    </div>
                </div>

                {/* Uyarı */}
                {alert && (
                    <div
                        className={`alert-message ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}
                    >
                        {alert.type === 'success' ? (
                            <CheckCircle className="alert-icon" />
                        ) : (
                            <AlertCircle className="alert-icon" />
                        )}
                        <span>{alert.message}</span>
                    </div>
                )}

                <div className="section-grid">
                    {/* Hesaplar Bölümü */}
                    <div className="section-card">
                        <h2 className="section-title">
                            <User className="section-title-icon" />
                            Hesaplarım
                        </h2>
                        <div className="accounts-list">
                            {accounts.length === 0 ? (
                                <p className="text-gray-500 text-center">Hesap bulunamadı.</p>
                            ) : (
                                accounts.map((account) => (
                                    <div key={account.id} className="account-item">
                                        <div className="account-details">
                                            <div className="account-info">
                                                <h3>{account.accountHolder}</h3>
                                                <p>{account.id}</p>
                                                <p className="account-type">{account.accountType}</p>
                                            </div>
                                            <div className="account-balance">
                                                <p>{formatMoney(account.balance)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Transfer Formu */}
                    <div className="section-card">
                        <h2 className="section-title">
                            <ArrowRightLeft className="section-title-icon" />
                            Para Transferi
                        </h2>

                        <div className="transfer-form-fields">
                            <div className="form-row">
                                <div className="form-field">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Gönderen Hesap
                                    </label>
                                    <select
                                        name="fromIban"
                                        value={formData.fromIban}
                                        onChange={handleInputChange}
                                        className="form-select"
                                        required
                                    >
                                        <option value="">Hesap seçiniz...</option>
                                        {accounts.map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.accountHolder} - {account.id} ({formatMoney(account.balance)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Alıcı IBAN
                                    </label>
                                    <input
                                        type="text"
                                        name="toIban"
                                        value={formData.toIban}
                                        onChange={handleInputChange}
                                        className="form-input-text"
                                        placeholder="Alıcının IBAN'ını giriniz"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-field">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Transfer Tutarı (₺)
                                    </label>
                                    <div className="amount-input-wrapper">
                                        <span className="amount-input-icon">₺</span>
                                        <input
                                            type="number"
                                            name="amount"
                                            value={formData.amount}
                                            onChange={handleInputChange}
                                            step="0.01"
                                            min="0.01"
                                            className="form-input-text amount-input"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-field">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Açıklama
                                    </label>
                                    <input
                                        type="text"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="form-input-text"
                                        placeholder="Transfer açıklaması"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={transferLoading}
                                className="submit-transfer-button"
                            >
                                {transferLoading ? (
                                    <div className="loading-spinner"></div>
                                ) : (
                                    <>
                                        <Send className="h-5 w-5" />
                                        Gönder
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Transfer Geçmişi */}
                <div className="section-card transfer-history-section">
                    <h2 className="section-title">
                        <ArrowRightLeft className="section-title-icon" />
                        Transfer Geçmişi
                    </h2>

                    <div className="transfer-history-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {transfers.length === 0 ? (
                            <div className="no-transfers-message">
                                <ArrowRightLeft className="no-transfers-icon" />
                                <p>Henüz transfer yok.</p>
                            </div>
                        ) : (
                            [...transfers]
                                .sort((a, b) => new Date(b.transferDate) - new Date(a.transferDate))
                                .map((transfer) => {
                                    const toMine = isMine(transfer.toIban);
                                    const fromMine = isMine(transfer.fromIban);

                                    const sign =
                                        fromMine && !toMine ? '-' :
                                            toMine && !fromMine ? '+' : '';

                                    const amountClass =
                                        toMine && !fromMine ? 'positive' :
                                            fromMine && !toMine ? 'negative' :
                                                '';

                                    return (
                                        <div key={transfer.id} className="transfer-item">
                                            <div className="transfer-details">
                                                <div className="transfer-accounts">
                                                    <span>{getAccountName(transfer.fromIban)}</span>
                                                    <ArrowRightLeft className="transfer-icon-separator" />
                                                    <span>{getAccountName(transfer.toIban)}</span>
                                                </div>
                                                <p className="transfer-date">{formatDate(transfer.transferDate)}</p>
                                                {transfer.description && (
                                                    <p className="transfer-description">{transfer.description}</p>
                                                )}
                                            </div>
                                            <div className="transfer-amount-status">
                                                <p className={`transfer-amount ${amountClass}`}>
                                                    {`${sign}${formatMoney(transfer.amount)}`}
                                                </p>
                                                <p className="transfer-status">
                                                    {toMine && fromMine ? 'İç transfer' : 'Tamamlandı'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentForm;
