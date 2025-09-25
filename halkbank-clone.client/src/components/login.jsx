import React, { useState } from "react";

export default function Login({ onLoginSuccess }) {
    const [tckn, setTckn] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        if (tckn.length !== 11) {
            setError("TCKN 11 haneli olmalıdır.");
            setIsLoading(false);
            return;
        }

        if (!password) {
            setError("Şifre zorunludur.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/Firebase/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tckn, password }),
            });

            if (!response.ok) {
                const errData = await response.json();
                setError(errData.message || "Giriş başarısız oldu.");
                setIsLoading(false);
                return;
            }

            const data = await response.json();
            onLoginSuccess(data);
        } catch (err) {
            setError("Sunucu hatası, lütfen tekrar deneyin.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = tckn.length === 11 && password.length > 0;

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit} className="login-form">
                <div className="logo-container">
                    <img
                        src="/halkbanklogo.jpg"
                        alt="Halkbank Logo"
                        className="halkbank-logo"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/200x60/cccccc/000000?text=Logo+Yüklenemedi";
                        }}
                    />
                </div>

                <h2 className="form-title">Giriş Yap</h2>

                {error && <p className="error-message">{error}</p>}

                <div className="form-group">
                    <label htmlFor="tckn" className="form-label">TCKN:</label>
                    <input
                        id="tckn"
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        value={tckn}
                        maxLength={11}
                        onChange={(e) => setTckn(e.target.value.replace(/\D/g, ""))}
                        placeholder="TCKN giriniz"
                        className="form-input"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password" className="form-label">Şifre:</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Şifrenizi giriniz"
                        className="form-input"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={!isFormValid || isLoading}
                    className="submit-button"
                >
                    {isLoading ? (
                        <div className="spinner"></div>
                    ) : (
                        "Giriş Yap"
                    )}
                </button>
            </form>
        </div>
    );
}
