importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDK_M9YQAe7P_AnQdSQUKyJ2d8tRCeIKko",
  authDomain: "mo-rental-notifications.firebaseapp.com",
  projectId: "mo-rental-notifications",
  storageBucket: "mo-rental-notifications.appspot.com",
  messagingSenderId: "252036999331",
  appId: "1:252036999331:web:YOUR_WEB_APP_ID_HERE",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  if (!title) return;
  self.registration.showNotification(title, {
    body: body || "",
    icon: "/Logo.png",
    badge: "/Logo.png",
    data: payload.data || {},
    requireInteraction: false,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.action_url || "/";
  event.waitUntil(clients.openWindow(url));
});
