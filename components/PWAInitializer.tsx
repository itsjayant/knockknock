'use client';

import { useEffect, useState } from 'react';
import DownloadIcon from '@mui/icons-material/Download';

export default function PWAInitializer() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallButton, setShowInstallButton] = useState(false);

    useEffect(() => {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js', { scope: '/' })
                .then((registration) => {
                    console.log('✅ PWA Service Worker registered successfully', registration);
                })
                .catch((error) => {
                    console.error('❌ Service Worker registration failed:', error);
                });
        }

        // Handle install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallButton(true);
            console.log('📱 Install prompt available');
        });

        // Handle app installed
        window.addEventListener('appinstalled', () => {
            setDeferredPrompt(null);
            setShowInstallButton(false);
            console.log('✅ App installed successfully');
        });
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        setDeferredPrompt(null);
        setShowInstallButton(false);
    };

    if (!showInstallButton) {
        return null;
    }

    return (
        <div className="fixed bottom-24 sm:bottom-0 right-4 z-50 animate-slide-in">
            <button
                onClick={handleInstallClick}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl hover:bg-blue-700 active:bg-blue-800 transition-all"
            >
                <DownloadIcon className="!text-lg" />
                <span>Install App</span>
            </button>
        </div>
    );
}
