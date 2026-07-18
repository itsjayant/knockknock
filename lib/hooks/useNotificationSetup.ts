import { useEffect, useState } from "react";
import { getMessagingClient } from "@/lib/firebase";
import { getToken, onMessage } from "firebase/messaging";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

export function useNotificationSetup() {
    const [permission, setPermission] = useState<NotificationPermission | null>(null);
    const [loading, setLoading] = useState(false);
    const [registered, setRegistered] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isSafari, setIsSafari] = useState(false);
    const [notificationsSupported, setNotificationsSupported] = useState(true);

    useEffect(() => {
        // Mark as mounted to prevent hydration mismatch
        setMounted(true);

        // Detect Safari browser
        const ua = navigator.userAgent;
        const isSafariUA = /Safari/.test(ua) && !/Chrome/.test(ua);
        const isIOS = /iPad|iPhone|iPod/.test(ua);
        setIsSafari(isSafariUA);

        // Check if notifications are supported
        const notificationsAPI = "Notification" in window;
        const serviceWorkerAPI = "serviceWorker" in navigator;

        // For iOS Safari in PWA mode, we don't need to check pushManager
        // Just having Notification API and service worker is enough
        const isPWAiOS = isSafariUA && isIOS;
        const pushAPI = isPWAiOS || ("pushManager" in ServiceWorkerRegistration.prototype);
        const supported = notificationsAPI && serviceWorkerAPI && pushAPI;

        console.log("🔍 Notification support check:", {
            notificationsAPI,
            serviceWorkerAPI,
            pushAPI,
            isPWAiOS,
            supported,
            isSafariUA,
            isIOS,
        });

        setNotificationsSupported(supported);

        // Check current permission status
        if ("Notification" in window) {
            setPermission(Notification.permission);
        }
    }, []);

    // Check if user already has a registered notification token
    useEffect(() => {
        const checkExistingToken = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    // User not ready yet, retry
                    setTimeout(checkExistingToken, 500);
                    return;
                }

                const q = query(
                    collection(db, "fcmTokens"),
                    where("userId", "==", user.uid)
                );
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    setRegistered(true);
                    console.log("✅ Found existing FCM token registration");
                } else {
                    setRegistered(false);
                }
            } catch (error) {
                console.error("Error checking for existing tokens:", error);
            }
        };

        if (mounted && permission === "granted") {
            checkExistingToken();
        }
    }, [mounted, permission]);

    // Set up foreground message listener when permission is granted
    useEffect(() => {
        if (permission !== "granted") return;

        const setupForegroundListener = async () => {
            try {
                const messaging = await getMessagingClient();
                if (!messaging) return;

                console.log("👂 Setting up foreground message listener...");

                // Listen for foreground messages
                const unsubscribe = onMessage(messaging, (payload) => {
                    console.log("🔔 Foreground message received:", payload);

                    const { notification, data } = payload;

                    if (notification && "serviceWorker" in navigator) {
                        // Show notification using service worker if available
                        navigator.serviceWorker.ready.then((registration) => {
                            registration.showNotification(
                                notification.title || "KnockKnock",
                                {
                                    body: notification.body || "Someone is at your door!",
                                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%230f172a" rx="40" width="192" height="192"/><path d="M 96 40 Q 120 50 120 80 L 120 100 Q 96 115 72 100 L 72 80 Q 72 50 96 40 Z M 96 115 L 96 135" stroke="%23ffffff" stroke-width="8" fill="none" stroke-linecap="round"/></svg>',
                                    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%230f172a" rx="20" width="96" height="96"/><path d="M 48 20 Q 60 25 60 40 L 60 50 Q 48 57 36 50 L 36 40 Q 36 25 48 20 Z M 48 57 L 48 67" stroke="%23ffffff" stroke-width="4" fill="none" stroke-linecap="round"/></svg>',
                                    tag: "knockknock-notification",
                                    requireInteraction: true,
                                    data: data || {},
                                }
                            );
                            console.log("✅ Foreground notification shown");
                        });
                    }
                });

                return () => {
                    console.log("🛑 Unsubscribing from foreground messages");
                    unsubscribe();
                };
            } catch (error) {
                console.error("❌ Failed to setup foreground listener:", error);
            }
        };

        setupForegroundListener();
    }, [permission]);

    async function requestNotificationPermission() {
        // Check HTTPS requirement
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            console.error('❌ Web Push requires HTTPS (or localhost for testing)');
            alert('Notifications require HTTPS. Please access from a secure connection.');
            setLoading(false);
            return false;
        }

        if (!('Notification' in window)) {
            console.log('❌ Notifications not supported');
            return false;
        }

        setLoading(true);

        try {
            // Request permission
            const permission = await Notification.requestPermission();
            setPermission(permission);
            console.log("📬 Notification permission:", permission);

            if (permission !== "granted") {
                console.log("❌ Notification permission denied");
                setLoading(false);
                return false;
            }

            // Register service worker
            if ("serviceWorker" in navigator) {
                const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
                console.log("✅ Service worker registered:", registration);
            }

            // Get FCM token
            const messaging = await getMessagingClient();
            if (!messaging) {
                console.log("❌ Messaging not supported");
                setLoading(false);
                return false;
            }

            // Get the VAPID public key from env
            const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
            if (!vapidKey) {
                console.error("❌ VAPID key not configured");
                setLoading(false);
                return false;
            }

            console.log("🔑 Getting FCM token...");
            const token = await getToken(messaging, { vapidKey });

            if (!token) {
                console.error("❌ Failed to get FCM token");
                setLoading(false);
                return false;
            }

            console.log("🎫 FCM token obtained:", token.slice(0, 20) + "...");

            // Save token to Firestore
            const user = auth.currentUser;
            if (!user) {
                console.error("❌ No authenticated user");
                setLoading(false);
                return false;
            }

            const deviceId = generateDeviceId();
            const tokenDocRef = doc(
                collection(db, "fcmTokens"),
                `${user.uid}_${deviceId}`
            );

            console.log("💾 Saving token to Firestore:", `${user.uid}_${deviceId}`);
            await setDoc(tokenDocRef, {
                userId: user.uid,
                token,
                createdAt: serverTimestamp(),
            });

            setRegistered(true);
            console.log("✅ FCM token registered successfully!");

            // Re-check and update permission state after successful registration
            // iOS Safari needs a small delay to properly settle the permission state
            await new Promise(resolve => setTimeout(resolve, 100));
            const finalPermission = Notification.permission;
            setPermission(finalPermission);
            console.log("📬 Final permission state:", finalPermission);

            setLoading(false);
            return true;
        } catch (error) {
            console.error("❌ Failed to setup notifications:", error);
            setLoading(false);
            return false;
        }
    }

    return {
        permission: mounted ? permission : null,
        loading,
        registered,
        requestNotificationPermission,
        mounted,
        isSafari,
        notificationsSupported,
    };
}

// Generate a unique device ID (stored in localStorage)
function generateDeviceId(): string {
    const storageKey = "device_id";
    let deviceId = localStorage.getItem(storageKey);
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem(storageKey, deviceId);
    }
    return deviceId;
}
