// Firebase Messaging Service Worker
// This file must be in the /public directory to be served at /firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

console.log("[SW] Service Worker loaded");

// Initialize Firebase with actual config from environment
const firebaseConfig = {
    apiKey: "AIzaSyCLovTaP7ufSErXc0L8A1QmBNoBnx3ttxU",
    authDomain: "knockknock-26f8c.firebaseapp.com",
    projectId: "knockknock-26f8c",
    storageBucket: "knockknock-26f8c.appspot.com",
    messagingSenderId: "51540749451",
    appId: "1:51540749451:web:f150dee5e999d8793c788e",
};

try {
    const app = firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging(app);
    console.log("[SW] ✅ Firebase initialized");

    // Handle background push notifications
    messaging.onBackgroundMessage((payload) => {
        console.log("[SW] 🔔 Background message received:", payload);

        const notificationTitle = payload.notification?.title || "KnockKnock";
        const notificationBody = payload.notification?.body || "Someone is at your door!";

        const notificationOptions = {
            body: notificationBody,
            icon: "/next.svg",
            badge: "/vercel.svg",
            tag: "knockknock-notification",
            requireInteraction: true,
            data: payload.data || {},
        };

        console.log("[SW] 📢 Showing notification:", notificationTitle);
        return self.registration.showNotification(notificationTitle, notificationOptions)
            .then(() => {
                console.log("[SW] ✅ Notification displayed successfully");
            })
            .catch((err) => {
                console.error("[SW] ❌ Failed to show notification:", err);
            });
    });

    console.log("[SW] ✅ Background message listener registered");

    // Also listen for notification clicks
    self.addEventListener("notificationclick", (event) => {
        console.log("[SW] 👆 Notification clicked:", event.notification.tag);
        event.notification.close();
        event.waitUntil(
            clients.matchAll({ type: "window", includeUncontrolled: true })
                .then((clientList) => {
                    // Focus existing window if available
                    for (let i = 0; i < clientList.length; i++) {
                        if (clientList[i].url === "/" || clientList[i].url.includes("dashboard")) {
                            return clientList[i].focus();
                        }
                    }
                    // Open new window if no existing one
                    return clients.openWindow("/dashboard");
                })
        );
    });

} catch (error) {
    console.error("[SW] ❌ Error initializing Firebase:", error);
}
