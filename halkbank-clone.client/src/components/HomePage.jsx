import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, LogOut, Loader2, User, Settings, UserCircle } from 'lucide-react';
import '../HomePage.css';

export default function HomePage({ user, onLogout }) {
    const navigate = useNavigate();
    const [accountInfo, setAccountInfo] = useState(null);
    const [loadingAccount, setLoadingAccount] = useState(true);
    const [accountError, setAccountError] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const userName = user?.user?.name || user?.user?.surname
        ? `${user.user.name || ''} ${user.user.surname || ''}`.trim()
        : user?.userTckn;

    useEffect(() => {
        const fetchAccountInfo = async () => {
            if (!user?.userTckn) {
                setAccountError('Kullanıcı TCKN bilgisi bulunamadı.');
                setLoadingAccount(false);
                return;
            }

            try {
                const response = await fetch(`/api/Firebase/accounts?tckn=${user.userTckn}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Hesap bilgileri çekilemedi.');
                }
                const data = await response.json();
                const mainAccount = data.find(acc => acc.tckn === user.userTckn);
                if (mainAccount) {
                    setAccountInfo(mainAccount);
                } else {
                    setAccountError('Kullanıcıya ait hesap bulunamadı.');
                }
            } catch (error) {
                setAccountError(error.message || 'Hesap bilgileri yüklenemedi.');
            } finally {
                setLoadingAccount(false);
            }
        };

        fetchAccountInfo();
    }, [user?.userTckn]);

    // Dropdown dışına tıklandığında kapat
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownOpen && !event.target.closest('.profile-dropdown-container')) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    const handleGoToPayments = () => {
        navigate('/payment');
    };

    const handleLogout = () => {
        onLogout();
        navigate('/');
    };

    const toggleDropdown = () => {
        setDropdownOpen(prev => !prev);
    };

    const handleProfileClick = () => {
        setDropdownOpen(false);
        // Profil sayfasına yönlendirme
        navigate('/profile');
    };

    const handleSettingsClick = () => {
        setDropdownOpen(false);
        // Ayarlar sayfasına yönlendirme
        navigate('/settings');
    };

    return (
        <div className="home-page-container">
            <header className="home-page-header">
                <div className="header-left">
                    <img src="/halkbanklogo.jpg" alt="Halkbank Logo" className="halkbank-logo" />
                </div>

                <div className="header-center" />

                <div className="header-right">
                    <div className="profile-dropdown-container">
                        <div className="profile-info" onClick={toggleDropdown}>
                            <div className="profile-avatar-wrapper">
                                <User size={24} color="white" />
                            </div>
                            <span className="user-name dropdown-toggle">
                                {userName}
                            </span>
                        </div>

                        {dropdownOpen && (
                            <div className="modern-dropdown-menu">
                                <div className="dropdown-item" onClick={handleProfileClick}>
                                    <UserCircle size={18} />
                                    <span>Profilim</span>
                                </div>
                                <div className="dropdown-item" onClick={handleSettingsClick}>
                                    <Settings size={18} />
                                    <span>Ayarlar</span>
                                </div>
                                <div className="dropdown-divider"></div>
                                <div className="dropdown-item logout-item" onClick={handleLogout}>
                                    <LogOut size={18} />
                                    <span>Çıkış Yap</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="home-page-content">
                <h1 className="page-title">Hoş Geldiniz!</h1>
                <p className="page-description">İşlemlerinizi güvenle gerçekleştirebilirsiniz.</p>

                <div className="account-summary-card">
                    <h2 className="account-summary-title">💳 Hesap Özeti</h2>
                    {loadingAccount ? (
                        <div className="loading-spinner-container">
                            <Loader2 className="loading-spinner-large" />
                            <p>Hesap bilgileri yükleniyor...</p>
                        </div>
                    ) : accountError ? (
                        <p className="account-error-message">{accountError}</p>
                    ) : accountInfo ? (
                        <div className="account-balance-display">
                            <p className="balance-amount">
                                <strong>{accountInfo.balance?.toFixed(2) || '0.00'}</strong> TL
                            </p>
                            <p className="account-details-text">IBAN: {accountInfo.iban}</p>
                            <p className="account-details-text">Hesap Türü: {accountInfo.accountType}</p>
                            <p className="account-details-text">TCKN: {accountInfo.tckn}</p>
                        </div>
                    ) : (
                        <p className="account-error-message">Hesap bilgisi bulunamadı.</p>
                    )}
                </div>

                <div className="feature-cards">
                    <div className="feature-card" onClick={handleGoToPayments}>
                        <CreditCard size={48} className="feature-icon" />
                        <h2 className="feature-card-title">Ödemeler</h2>
                        <p className="feature-card-description">Fatura ve para transfer işlemlerini yap.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}