// src/components/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    User, // Kullanıcı ikonu (genel)
    Mail, // E-posta ikonu
    Phone, // Telefon ikonu
    CreditCard, // Hesap ikonu
    Calendar, // Takvim ikonu (kayıt tarihi)
    MapPin, // Adres ikonu
    Edit3, // Düzenle ikonu
    Loader2, // Yükleme ikonu (dönen)
    Eye, // Göz ikonu (TCKN gösterme)
    EyeOff // Göz kapalı ikonu (TCKN gizleme)
} from 'lucide-react';
import '../ProfilePage.css'; // Stil dosyasını import et

export default function ProfilePage({ user }) {
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState(null);
    const [accountInfo, setAccountInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showFullTckn, setShowFullTckn] = useState(false);

    // Kayıt tarihini okunabilir formatta döndüren yardımcı fonksiyon
    const formatRegistrationDate = (dateString) => {
        if (!dateString) {
            return 'Belirtilmemiş';
        }
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                console.warn("Invalid Date object after parsing:", dateString);
                return 'Belirtilmemiş';
            }
            return date.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            });
        } catch (e) {
            console.error("Tarih formatlama hatası:", e);
            return 'Belirtilmemiş';
        }
    };

    // Telefon numarasını okunabilir formatta döndüren yardımcı fonksiyon
    const formatPhoneNumber = (phoneNumber) => {
        if (!phoneNumber || String(phoneNumber).trim() === '') {
            return 'Belirtilmemiş';
        }
        const cleaned = String(phoneNumber).replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)}`;
        }
        if (cleaned.length === 11 && cleaned.startsWith('0')) {
            return `(${cleaned.substring(0, 4)}) ${cleaned.substring(4, 7)} ${cleaned.substring(7, 9)} ${cleaned.substring(9, 11)}`;
        }
        return phoneNumber;
    };

    // TCKN'yi maskeli veya tam olarak döndüren yardımcı fonksiyon
    const formatTckn = (tckn) => {
        if (!tckn) return 'Belirtilmemiş';
        if (showFullTckn) return tckn;
        return tckn.slice(0, 3) + '*******' + tckn.slice(-1);
    };

    // IBAN'ı boşluklarla formatlayan yardımcı fonksiyon
    const formatIban = (iban) => {
        if (!iban) return 'Belirtilmemiş';
        return iban.replace(/(.{4})/g, '$1 ').trim();
    };

    useEffect(() => {
        const fetchUserData = async () => {
            console.log("ProfilePage'e gelen user prop'u:", user);

            if (!user?.userTckn) {
                setError('Kullanıcı TCKN bilgisi bulunamadı.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const userResponse = await fetch(`/api/Firebase/users/${user.userTckn}`);
                if (!userResponse.ok) {
                    throw new Error('Kullanıcı bilgileri çekilemedi.');
                }
                const userData = await userResponse.json();
                setUserProfile(userData);
                console.log("Çekilen Kullanıcı Bilgileri (userData):", userData);

                const accountResponse = await fetch(`/api/Firebase/accounts?tckn=${user.userTckn}`);
                if (accountResponse.ok) {
                    const accountData = await accountResponse.json();
                    const mainAccount = accountData.find(acc => acc.tckn === user.userTckn);
                    setAccountInfo(mainAccount);
                    console.log("Çekilen Hesap Bilgileri (mainAccount):", mainAccount);
                } else {
                    console.warn('Hesap bilgileri çekilemedi veya bulunamadı.');
                    setAccountInfo(null);
                }

            } catch (err) {
                setError(err.message || 'Veriler yüklenirken hata oluştu.');
                console.error("Veri çekme hatası:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user]);

    const handleBack = () => {
        navigate('/home');
    };

    const handleGoToEditProfile = () => {
        navigate('/edit-profile');
    };


    if (loading) {
        return (
            <div className="profile-page-container">
                <div className="loading-container">
                    <Loader2 className="loading-spinner" size={48} />
                    <p>Profil bilgileri yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error && !userProfile) {
        return (
            <div className="profile-page-container">
                <div className="error-container">
                    <p>{error}</p>
                    <button
                        type="button"
                        onClick={() => navigate('/home')}
                        className="back-button"
                    >
                        <ArrowLeft size={20} />
                        Geri
                    </button>
                </div>
            </div>
        );
    }

    if (!userProfile) {
        return (
            <div className="profile-page-container">
                <div className="error-container">
                    <p>Kullanıcı profili bulunamadı veya bir hata oluştu.</p>
                    <button
                        type="button"
                        onClick={() => navigate('/home')}
                        className="back-button"
                    >
                        <ArrowLeft size={20} />
                        Geri
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page-container">
            <header className="profile-header">
                <button onClick={handleBack} className="back-button">
                    <ArrowLeft size={20} />
                    Geri
                </button>
                <h1 className="profile-title">Profilim</h1>
                <div className="header-actions">
                    <button
                        onClick={handleGoToEditProfile} // Düzenle butonuna tıklandığında EditProfilePage'e yönlendir
                        className="edit-button"
                    >
                        <Edit3 size={20} /> Düzenle
                    </button>
                </div>
            </header>

            <div className="profile-content">
                {/* Profil Kartı */}
                <div className="profile-card">
                    <div className="profile-avatar">
                        <User size={48} />
                    </div>
                    <div className="profile-basic-info">
                        <h2 className="profile-name">
                            {userProfile?.name || userProfile?.surname
                                ? `${userProfile.name || ''} ${userProfile.surname || ''}`.trim()
                                : 'Kullanıcı'
                            }
                        </h2>
                        <p className="profile-tckn">
                            TCKN: {formatTckn(userProfile?.tckn)}
                            <button
                                onClick={() => setShowFullTckn(!showFullTckn)}
                                className="toggle-tckn-button"
                                aria-label={showFullTckn ? "TCKN'yi gizle" : "TCKN'yi göster"}
                            >
                                {showFullTckn ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Kişisel Bilgiler */}
                <div className="info-section">
                    <h3 className="section-title">Kişisel Bilgiler</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <User className="info-icon" size={20} />
                            <div className="info-content">
                                <label>Ad</label>
                                <span>{userProfile?.name || 'Belirtilmemiş'}</span>
                            </div>
                        </div>

                        <div className="info-item">
                            <User className="info-icon" size={20} />
                            <div className="info-content">
                                <label>Soyad</label>
                                <span>{userProfile?.surname || 'Belirtilmemiş'}</span>
                            </div>
                        </div>

                        <div className="info-item">
                            <Mail className="info-icon" size={20} />
                            <div className="info-content">
                                <label>E-posta</label>
                                <span>{userProfile?.email || 'Belirtilmemiş'}</span>
                            </div>
                        </div>

                        <div className="info-item">
                            <Phone className="info-icon" size={20} />
                            <div className="info-content">
                                <label>Telefon</label>
                                <span>{formatPhoneNumber(userProfile?.phoneNumber)}</span>
                            </div>
                        </div>

                        <div className="info-item full-width">
                            <MapPin className="info-icon" size={20} />
                            <div className="info-content">
                                <label>Adres</label>
                                <span>{userProfile?.address || 'Belirtilmemiş'}</span>
                            </div>
                        </div>

                        {userProfile?.createdAt && (
                            <div className="info-item">
                                <Calendar className="info-icon" size={20} />
                                <div className="info-content">
                                    <label>KAYIT TARİHİ</label>
                                    <span>{formatRegistrationDate(userProfile.createdAt)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Hesap Bilgileri */}
                {accountInfo && (
                    <div className="info-section">
                        <h3 className="section-title">Hesap Bilgileri</h3>
                        <div className="account-info-grid">
                            <div className="account-balance-card">
                                <CreditCard className="account-icon" size={24} />
                                <div className="account-details">
                                    <h4>Ana Hesap</h4>
                                    <p className="balance">
                                        <strong>{accountInfo.balance?.toFixed(2) || '0.00'}</strong> TL
                                    </p>
                                    <p className="account-type">{accountInfo.accountType}</p>
                                </div>
                            </div>

                            <div className="iban-card">
                                <div className="iban-label">IBAN</div>
                                <div className="iban-number">{formatIban(accountInfo.iban)}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}