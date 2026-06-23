import { useEffect, useRef } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../firebase";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://13.61.185.238:5050/api/v1";
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

function getAuthToken(): string | null {
  try {
    const stored = localStorage.getItem("car_rental_auth");
    return stored ? JSON.parse(stored).token : null;
  } catch {
    return null;
  }
}

async function registerFcmToken(token: string) {
  const authToken = getAuthToken();
  if (!authToken) return;
  await axios.post(
    `${API_BASE}/users/fcm-token`,
    { token },
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
}

export function usePushNotifications(
  onNotification?: (payload: { title?: string; body?: string; data?: Record<string, string> }) => void
) {
  const registered = useRef(false);

  useEffect(() => {
    if (!messaging || registered.current || !VAPID_KEY || VAPID_KEY.includes("YOUR_")) return;

    const setup = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        const token = await getToken(messaging!, { vapidKey: VAPID_KEY });
        if (token) {
          await registerFcmToken(token);
          registered.current = true;
        }
      } catch {
        // Push notifications unavailable — silently skip
      }
    };

    setup();

    const unsubscribe = onMessage(messaging!, (payload) => {
      onNotification?.({
        title: payload.notification?.title,
        body: payload.notification?.body,
        data: payload.data as Record<string, string>,
      });
    });

    return unsubscribe;
  }, [onNotification]);
}
