import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../EditProfilePage.css';

function EditProfilePage({ user, onUpdateUserGlobal }) {
    const [firstName, setFirstName] = useState(user?.user?.name || '');
    const [lastName, setLastName] = useState(user?.user?.surname || '');
    const [email, setEmail] = useState(user?.user?.email || '');
    const [phone, setPhone] = useState(user?.user?.phoneNumber || '');
    const [address, setAddress] = useState(user?.user?.address || '');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        if (user?.user) {
            setFirstName(user.user.name || '');
            setLastName(user.user.surname || '');
            setEmail(user.user.email || '');
            setPhone(user.user.phoneNumber || '');
            setAddress(user.user.address || '');
            setError(null);
            // Success mesajı kullanıcı güncellemesi sırasında korunabilir
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const updatedUser = { name: firstName, surname: lastName, email, phoneNumber: phone, address };

        try {
            const response = await fetch(`/api/Firebase/users/${user.userTckn}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedUser),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Güncelleme başarısız.');
            }

            const updatedUserFromServer = await response.json();

            setSuccess('Profil başarıyla güncellendi.');
            onUpdateUserGlobal(updatedUserFromServer);

            setTimeout(() => {
                setSuccess(null);
            }, 3000);

        } catch (err) {
            setError(err.message || 'Bir hata oluştu.');
            console.error('Kullanıcı güncellenemedi:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="edit-profile-page">
            <h2>Profil Bilgilerini Düzenle</h2>

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    ✅ {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="edit-profile-form">
                <div className="form-row" style={{ display: 'flex', gap: '20px' }}>
                    <div className="form-group readonly" style={{ flex: 1 }}>
                        <label htmlFor="firstName">Adınız</label>
                        <input type="text" id="firstName" value={firstName} readOnly placeholder="Adınız" className="readonly" />
                    </div>
                    <div className="form-group readonly" style={{ flex: 1 }}>
                        <label htmlFor="lastName">Soyadınız</label>
                        <input type="text" id="lastName" value={lastName} readOnly placeholder="Soyadınız" className="readonly" />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="email">E-posta Adresi</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="E-posta adresinizi girin"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="phone">Telefon Numarası</label>
                    <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="Telefon numaranızı girin"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="address">Adres</label>
                    <textarea
                        id="address"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="Adresinizi girin"
                        rows={4}
                    />
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate(-1)}
                        style={{
                            backgroundColor: '#6c757d',
                            marginRight: '10px'
                        }}
                    >
                        Geri
                    </button>
                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner"></span> Kaydediliyor...
                            </>
                        ) : (
                            'Kaydet'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditProfilePage;





