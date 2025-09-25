// src/components/SettingsPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Bell, Settings, Lock, Info } from 'lucide-react';

import '../SettingsPage.css';

const SettingsPage = () => {
    const navigate = useNavigate();

    const handleBackClick = () => {
        navigate(-1);
    };

    const handleEditPersonalInfoClick = () => {
        navigate('/edit-profile'); // Kullanıcıyı '/edit-profile' rotasına yönlendir
    };

    return (
        <div className="settings-page-container">
            <header className="settings-header">
                <button className="back-button" onClick={handleBackClick}>
                    <ArrowLeft size={20} />
                    Geri
                </button>
                <h1 className="settings-title">Ayarlar</h1>
                <div style={{ width: '20px' }}></div>
            </header>

            <main className="settings-content">
                {/* Hesap Ayarları */}
                <section className="settings-section">
                    <h2 className="section-title">
                        <User size={20} className="section-title-icon" />
                        Hesap Ayarları
                    </h2>
                    <div className="settings-grid">
                        <div className="settings-item">
                            <label>Kişisel Bilgiler</label>
                            <span>Ad, Soyadı, E-posta vb.</span>
                            <button className="settings-action-button" onClick={handleEditPersonalInfoClick}>Düzenle</button>
                        </div>
                        <div className="settings-item">
                            <label>Şifre ve Güvenlik</label>
                            <span>Şifre değiştir, 2FA</span>
                            <button className="settings-action-button">Yönet</button>
                        </div>
                        <div className="settings-item">
                            <label>Varsayılan Hesap</label>
                            <span>Ana hesabınızı seçin</span>
                            <button className="settings-action-button">Seç</button>
                        </div>
                    </div>
                </section>

                {/* Bildirimler */}
                <section className="settings-section">
                    <h2 className="section-title">
                        <Bell size={20} className="section-title-icon" />
                        Bildirimler
                    </h2>
                    <div className="settings-grid">
                        <div className="settings-item settings-toggle-item">
                            <label>Para Transferi Bildirimleri</label>
                            <input type="checkbox" className="toggle-switch" defaultChecked />
                        </div>
                        <div className="settings-item settings-toggle-item">
                            <label>Kampanya ve Duyurular</label>
                            <input type="checkbox" className="toggle-switch" />
                        </div>
                        <div className="settings-item settings-toggle-item">
                            <label>Güvenlik Uyarıları</label>
                            <input type="checkbox" className="toggle-switch" defaultChecked />
                        </div>
                    </div>
                </section>

                {/* Uygulama Ayarları */}
                <section className="settings-section">
                    <h2 className="section-title">
                        <Settings size={20} className="section-title-icon" />
                        Uygulama Ayarları
                    </h2>
                    <div className="settings-grid">
                        <div className="settings-item">
                            <label>Tema</label>
                            <select className="settings-select">
                                <option>Açık</option>
                                <option>Koyu</option>
                                <option>Sistem Ayarı</option>
                            </select>
                        </div>
                        <div className="settings-item settings-toggle-item">
                            <label>Parmak İzi/Yüz Tanıma ile Giriş</label>
                            <input type="checkbox" className="toggle-switch" />
                        </div>
                    </div>
                </section>

                {/* Hakkında */}
                <section className="settings-section">
                    <h2 className="section-title">
                        <Info size={20} className="section-title-icon" />
                        Hakkında
                    </h2>
                    <div className="settings-grid">
                        <div className="settings-item">
                            <label>Uygulama Versiyonu</label>
                            <span>1.0.0</span>
                        </div>
                        <div className="settings-item settings-link-item">
                            <a href="/privacy-policy" onClick={(e) => e.preventDefault()}>Gizlilik Politikası</a>
                        </div>
                        <div className="settings-item settings-link-item">
                            <a href="/terms-of-service" onClick={(e) => e.preventDefault()}>Kullanım Koşulları</a>
                        </div>
                        <div className="settings-item settings-link-item">
                            <a href="/contact-us" onClick={(e) => e.preventDefault()}>Bize Ulaşın</a>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default SettingsPage;