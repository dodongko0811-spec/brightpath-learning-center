import { addDoc, collection, getFirestore } from 'firebase/firestore';
import { getApp, getApps, initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const firebaseDb = getFirestore(firebaseApp);
export const isFirebaseReady = Boolean(firebaseConfig.projectId && firebaseConfig.apiKey && firebaseConfig.appId);

export async function saveSiteEvent(name, details = {}) {
  if (!isFirebaseReady) {
    throw new Error('Firebase is not configured.');
  }

  return addDoc(collection(firebaseDb, 'site_events'), {
    name,
    path: typeof window !== 'undefined' ? window.location.pathname : '/',
    label: typeof document !== 'undefined' ? document.title : '',
    details,
    source: 'BrightPath Learning Center',
    timestamp: new Date().toISOString(),
  });
}

export async function saveContactInquiry(formData) {
  if (!isFirebaseReady) {
    throw new Error('Firebase is not configured.');
  }

  return addDoc(collection(firebaseDb, 'contact_inquiries'), {
    name: String(formData?.name || '').trim(),
    age: String(formData?.age || '').trim(),
    email: String(formData?.email || '').trim(),
    message: String(formData?.message || '').trim(),
    recipient: 'kierjoyno@gmail.com',
    source: 'brightpath-learning-center',
    submittedAt: new Date().toISOString(),
    status: 'new',
  });
}
