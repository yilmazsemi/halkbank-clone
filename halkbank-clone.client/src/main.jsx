import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import './login.css';
import './PaymentForm.css';
import './HomePage.css';
import './ProfilePage.css'; // Profil sayfası için CSS ekledim

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>
);
