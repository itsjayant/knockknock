'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const DEFAULT_RINGTONES = [
    { id: 'default', name: 'Default Bell' },
    { id: 'chime', name: 'Gentle Chime' },
    { id: 'ding', name: 'Ding Dong' },
];

type UserSettings = {
    ringtoneId: string;
    ringtoneUrl?: string;
    volume: number;
};

export default function SettingsForm({ userId }: { userId: string }) {
    const [settings, setSettings] = useState<UserSettings>({
        ringtoneId: 'default',
        volume: 70,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    // Load settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const docRef = doc(db, 'userSettings', userId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as UserSettings;
                    setSettings(data);
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [userId]);

    // Save settings
    const handleSave = async () => {
        setSaving(true);
        setSuccess(false);

        try {
            const docRef = doc(db, 'userSettings', userId);
            await setDoc(docRef, settings, { merge: true });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const handlePlayRingtone = async () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const now = audioContext.currentTime;
            const duration = 1.5;
            const volume = settings.volume / 100;

            // Create gain node for volume control
            const gainNode = audioContext.createGain();
            gainNode.connect(audioContext.destination);
            gainNode.gain.setValueAtTime(volume, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

            if (settings.ringtoneId === 'default') {
                // Default Bell: Two tones (low then high)
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
            } else if (settings.ringtoneId === 'chime') {
                // Gentle Chime: Descending tones
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
            } else if (settings.ringtoneId === 'ding') {
                // Ding Dong: Sharp high then low
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
        } catch (error) {
            console.error('Error playing ringtone:', error);
        }
    };

    if (loading) {
        return (
            <div className="rounded-lg bg-slate-100 border border-slate-200 px-6 py-8 animate-pulse">
                <p className="text-sm text-slate-600">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Ringtone Selection */}
            <div className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3 mb-4">
                    <MusicNoteIcon className="!text-2xl text-blue-600" />
                    <h2 className="text-xl font-bold text-slate-900">Notification Ringtone</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                            Choose a ringtone
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {DEFAULT_RINGTONES.map((ringtone) => (
                                <button
                                    key={ringtone.id}
                                    onClick={() => setSettings({ ...settings, ringtoneId: ringtone.id })}
                                    className={`p-4 rounded-lg border-2 transition-all text-left ${settings.ringtoneId === ringtone.id
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                        }`}
                                >
                                    <p className="font-semibold text-slate-900">{ringtone.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Volume Control */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                            Volume: {settings.volume}%
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={settings.volume}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        volume: parseInt(e.target.value),
                                    })
                                }
                                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <VolumeUpIcon className="text-slate-600" />
                        </div>
                    </div>

                    {/* Test Button */}
                    <button
                        onClick={handlePlayRingtone}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition-all"
                    >
                        <PlayArrowIcon className="!text-lg" />
                        Test Ringtone
                    </button>
                </div>
            </div>

            {/* Save Section */}
            <div className="flex gap-3 justify-end flex-col sm:flex-row">
                {success && (
                    <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-2">
                        <CheckCircleIcon className="!text-lg text-green-700" />
                        <p className="text-sm font-medium text-green-700">Settings saved successfully</p>
                    </div>
                )}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-all"
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {/* Info */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Custom ringtone uploads and custom sounds will be added in a future update. For now, you can choose from our preset ringtones.
                </p>
            </div>
        </div>
    );
}
