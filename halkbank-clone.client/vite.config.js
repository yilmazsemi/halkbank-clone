import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';

// Sertifikalarýn kaydedileceði klasör yolu (Windows veya Linux/Mac)
const baseFolder =
    env.APPDATA && env.APPDATA !== ''
        ? `${env.APPDATA}/ASP.NET/https`
        : `${env.HOME}/.aspnet/https`;

// Sertifika dosya isimleri
const certificateName = "halkbank-clone.client";
const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

// Klasör yoksa oluþtur
if (!fs.existsSync(baseFolder)) {
    fs.mkdirSync(baseFolder, { recursive: true });
}

// Sertifikalar yoksa dotnet dev-certs ile oluþtur
if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
    const result = child_process.spawnSync('dotnet', [
        'dev-certs',
        'https',
        '--export-path',
        certFilePath,
        '--format',
        'Pem',
        '--no-password',
    ], { stdio: 'inherit' });

    if (result.status !== 0) {
        throw new Error("Could not create certificate.");
    }
}

// Backend HTTPS adresi (Swagger ve ASP.NET Core portuna göre ayarla)
const targetBackend = 'http://localhost:5090';

// Vite yapýlandýrmasý
export default defineConfig({
    plugins: [plugin()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        }
    },
    server: {
        // Proxy ayarlarý
        proxy: {
            // /api ile baþlayan tüm istekleri backend'e yönlendir
            '^/api': {
                target: targetBackend,
                secure: false,       // Self-signed sertifika için
                changeOrigin: true,  // Host baþlýðýný backend'e göre deðiþtir
                // rewrite: (path) => path.replace(/^\/api/, '/api'), // Gerek yok, istersen kaldýrabilirsin
            }
        },
        port: parseInt(env.DEV_SERVER_PORT || '61480'), // Vite dev server portu
        https: {
            key: fs.readFileSync(keyFilePath),
            cert: fs.readFileSync(certFilePath),
        }
    }
});
