# BrightPath Learning Center

A modern React learning hub for a children's education center.

## What is included

- Route-based pages for Home, Programs, About, Blog, FAQs, Contact, Privacy Policy, Terms, Thank You, and a custom 404 page
- Firebase Hosting deployment
- Firestore-backed contact inquiries and page tracking from the browser SDK
- Markdown-powered blog content
- Responsive layout for desktop, tablet, and mobile

## Local development

1. Install dependencies:

```bash
npm install
```

2. Run the dev server:

```bash
npm run dev
```

3. Open the site at the Vite URL shown in the terminal.

## Firebase setup

Create a local `.env.local` file with the Firebase web config values:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=brightpath-learning-center
VITE_FIREBASE_STORAGE_BUCKET=brightpath-learning-center.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_APPCHECK_SITE_KEY=...
VITE_ADMIN_DASHBOARD_CODE=...
```

The example values are listed in `.env.example`.

App Check is enabled for the BrightPath Firestore project using reCAPTCHA Enterprise, so the live site expects the App Check site key to be present at build time.

The `/admin` route now uses a local fallback code gate because Firebase Auth requires billing on this project. The admin dashboard only mirrors data captured in the browser after successful submits and tracking events.

## Build

```bash
npm run build
```

## Firebase deploy

```bash
firebase deploy --only hosting --project brightpath-learning-center
```

## Notes

- The repo is intentionally kept free of local secrets.
- Firestore rules are locked to BrightPath's contact and tracking collections.
- If you want stronger protection later, add Firebase App Check or Auth.
