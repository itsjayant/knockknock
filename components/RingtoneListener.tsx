'use client';

import { useEffect } from 'react';

export default function RingtoneListener() {
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'PLAY_RINGTONE') {
                playRingtone(event.data.ringtoneId, event.data.volume);
            }
        });
    }, []);

    return null;
}

// Play ringtone using Web Audio API
function playRingtone(ringtoneId: string, volume: number) {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = audioContext.currentTime;
        const duration = 1.5;
        const volumeNormalized = Math.min(volume / 100, 1);

        const gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        gainNode.gain.setValueAtTime(volumeNormalized, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        if (ringtoneId === 'default') {
            const osc1 = audioContext.createOscillator();
            osc1.frequency.setValueAtTime(400, now);
            osc1.connect(gainNode);
            osc1.start(now);
            osc1.stop(now + 0.3);

            const osc2 = audioContext.createOscillator();
            osc2.frequency.setValueAtTime(600, now + 0.3);
            osc2.connect(gainNode);
            osc2.start(now + 0.3);
            osc2.stop(now + duration);
        } else if (ringtoneId === 'chime') {
            const osc1 = audioContext.createOscillator();
            osc1.frequency.setValueAtTime(800, now);
            osc1.frequency.exponentialRampToValueAtTime(400, now + 0.4);
            osc1.connect(gainNode);
            osc1.start(now);
            osc1.stop(now + 0.4);

            const osc2 = audioContext.createOscillator();
            osc2.frequency.setValueAtTime(600, now + 0.4);
            osc2.frequency.exponentialRampToValueAtTime(300, now + 0.8);
            osc2.connect(gainNode);
            osc2.start(now + 0.4);
            osc2.stop(now + duration);
        } else if (ringtoneId === 'ding') {
            const osc1 = audioContext.createOscillator();
            osc1.frequency.setValueAtTime(1000, now);
            osc1.connect(gainNode);
            osc1.start(now);
            osc1.stop(now + 0.25);

            const osc2 = audioContext.createOscillator();
            osc2.frequency.setValueAtTime(500, now + 0.35);
            osc2.connect(gainNode);
            osc2.start(now + 0.35);
            osc2.stop(now + duration);
        }
    } catch (err) {
        console.error('❌ Error playing ringtone:', err);
    }
}
