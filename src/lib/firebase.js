import { addDoc, collection, getFirestore } from 'firebase/firestore';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY || '';
export const adminDashboardCode = import.meta.env.VITE_ADMIN_DASHBOARD_CODE || 'brightpath-admin';
const adminCacheKeys = {
  inquiries: 'brightpath-admin-inquiries',
  events: 'brightpath-admin-events',
};

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

if (appCheckSiteKey) {
  initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export const firebaseDb = getFirestore(firebaseApp);
export const isFirebaseReady = Boolean(firebaseConfig.projectId && firebaseConfig.apiKey && firebaseConfig.appId);

function getBrowserStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

function readAdminCache(key) {
  const storage = getBrowserStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAdminCache(key, entries) {
  const storage = getBrowserStorage();
  if (!storage) return;

  storage.setItem(key, JSON.stringify(entries.slice(0, 25)));
}

export function getAdminDashboardData() {
  return {
    inquiries: readAdminCache(adminCacheKeys.inquiries),
    events: readAdminCache(adminCacheKeys.events),
  };
}

function rememberAdminInquiry(entry) {
  const current = readAdminCache(adminCacheKeys.inquiries);
  writeAdminCache(adminCacheKeys.inquiries, [entry, ...current]);
}

function rememberAdminEvent(entry) {
  const current = readAdminCache(adminCacheKeys.events);
  writeAdminCache(adminCacheKeys.events, [entry, ...current]);
}

export async function saveSiteEvent(name, details = {}) {
  if (!isFirebaseReady) {
    throw new Error('Firebase is not configured.');
  }

  const record = {
    name,
    path: typeof window !== 'undefined' ? window.location.pathname : '/',
    label: typeof document !== 'undefined' ? document.title : '',
    details,
    source: 'BrightPath Learning Center',
    timestamp: new Date().toISOString(),
  };

  const result = await addDoc(collection(firebaseDb, 'site_events'), record);
  rememberAdminEvent({ id: result.id, ...record });
  return result;
}

export async function saveContactInquiry(formData) {
  if (!isFirebaseReady) {
    throw new Error('Firebase is not configured.');
  }

  const record = {
    name: String(formData?.name || '').trim(),
    age: String(formData?.age || '').trim(),
    email: String(formData?.email || '').trim(),
    message: String(formData?.message || '').trim(),
    recipient: 'kierjoyno@gmail.com',
    source: 'brightpath-learning-center',
    submittedAt: new Date().toISOString(),
    status: 'new',
  };

  const result = await addDoc(collection(firebaseDb, 'contact_inquiries'), record);
  rememberAdminInquiry({ id: result.id, ...record });
  return result;
}
