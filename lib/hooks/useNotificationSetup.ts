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
        const pushAPI = "pushManager" in ServiceWorkerRegistration.prototype || false;
        const supported = notificationsAPI && serviceWorkerAPI && pushAPI;

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
                                    icon: "/next.svg",
                                    badge: "/vercel.svg",
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
        if (!("Notification" in window)) {
            console.log("Notifications not supported");
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
