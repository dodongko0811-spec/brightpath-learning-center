import { addDoc, collection, getFirestore } from 'firebase/firestore';
import { getApp, getApps, initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyA-l_-hh8kPFfFE-SR6Zy0JGRLI4X-7fnw',
  authDomain: 'brightpath-learning-center.firebaseapp.com',
  projectId: 'brightpath-learning-center',
  storageBucket: 'brightpath-learning-center.firebasestorage.app',
  messagingSenderId: '102030191936',
  appId: '1:102030191936:web:5c30cf5afdab5d83efdea5',
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
