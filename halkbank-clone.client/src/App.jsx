// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './components/Login';
import PaymentForm from './components/PaymentForm';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import EditProfilePage from './components/EditProfilePage'; // Modal değil, sayfa bileşeni

function App() {
    const [user, setUser] = useState(null);

    const handleLoginSuccess = (userData) => {
        setUser(userData);
        console.log("Login başarılı, kullanıcı ayarlandı:", userData);
    };

    const handleLogout = () => {
        setUser(null);
        console.log("Kullanıcı çıkış yaptı.");
    };

    const updateGlobalUser = (updatedUserData) => {
        setUser(prevUser => {
            if (!prevUser) {
                return updatedUserData;
            }
            return {
                ...prevUser,
                name: updatedUserData.name || prevUser.name,
                surname: updatedUserData.surname || prevUser.surname,
                email: updatedUserData.email || prevUser.email,
                phoneNumber: updatedUserData.phoneNumber || prevUser.phoneNumber,
                address: updatedUserData.address || prevUser.address,
                firstName: updatedUserData.firstName || prevUser.firstName,
                lastName: updatedUserData.lastName || prevUser.lastName,
                // İstersen diğer alanlar
            };
        });
        console.log("Global kullanıcı bilgisi güncellendi:", updatedUserData);
    };

    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={!user ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/home" replace />}
                />
                <Route
                    path="/home"
                    element={user ? <HomePage user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />}
                />
                <Route
                    path="/profile"
                    element={user ? <ProfilePage user={user} /> : <Navigate to="/" replace />}
                />
                <Route
                    path="/payment"
                    element={user ? <PaymentForm user={user} /> : <Navigate to="/" replace />}
                />
                <Route
                    path="/settings"
                    element={user ? <SettingsPage user={user} /> : <Navigate to="/" replace />}
                />
                <Route
                    path="/edit-profile"
                    element={user ? <EditProfilePage user={user} onUpdateUserGlobal={updateGlobalUser} /> : <Navigate to="/" replace />}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
