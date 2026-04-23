/* eslint-disable @typescript-eslint/no-unused-vars */
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDMaFMqPfZM9310zFTeqUV9bekS5KrT05s",
  authDomain: "theatrack-9016c.firebaseapp.com",
  projectId: "theatrack-9016c",
  storageBucket: "theatrack-9016c.firebasestorage.app",
  messagingSenderId: "592799304000",
  appId: "1:592799304000:web:ac8fb96dba8c00caa792a5",
  measurementId: "G-15G8L6WTFT"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();
  
  messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new message.',
      icon: '/icons/icon-192.png'
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.log('Firebase SW init skipped (requires config)');
}

self.addEventListener('install', (event) => {
  console.log('FCM Service worker installed');
});
