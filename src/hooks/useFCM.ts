"use client";

import { useState } from "react";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app, db } from "@/lib/firebase/config";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useAuth } from "./useAuth";
import toast from "react-hot-toast";

export function useFCM() {
  const { user } = useAuth();
  const [notificationPermissionStatus, setNotificationPermissionStatus] =
    useState<NotificationPermission | null>(() => {
      if (typeof window !== "undefined" && "Notification" in window) {
        return Notification.permission;
      }
      return null;
    });

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Notifications not supported in this browser.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermissionStatus(permission);

      if (permission === "granted") {
        const supported = await isSupported();
        if (supported && user) {
          const messaging = getMessaging(app);
          const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
          if (!vapidKey) {
            toast.error(
              "Push notifications require a VAPID key. Add NEXT_PUBLIC_FIREBASE_VAPID_KEY to your environment.",
            );
            return;
          }
          const token = await getToken(messaging, { vapidKey });

          if (token) {
            // Save token to user profile
            await updateDoc(doc(db, "users", user.uid), {
              fcmTokens: arrayUnion(token),
            });
            toast.success("Push notifications enabled!");
          }
        }
      } else {
        toast.error("Notification permission denied.");
      }
    } catch (error) {
      console.error("Failed to enable notifications:", error);
      toast.error(
        "Setup required for push notifications. Add VAPID key in settings.",
      );
    }
  };

  return { notificationPermissionStatus, requestPermission };
}
