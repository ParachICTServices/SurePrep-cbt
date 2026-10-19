import { readFileSync } from "node:fs";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";


function getAdminApp() {
  const existingApp = getApps()[0];
  if (existingApp) return existingApp;

  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccountFile =
    process.env.FIREBASE_SERVICE_ACCOUNT_FILE ?? process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (serviceAccountJson) {
    return initializeApp({
      credential: cert(JSON.parse(serviceAccountJson)),
      ...(projectId ? { projectId } : {}),
    });
  }

  if (serviceAccountFile) {
    return initializeApp({
      credential: cert(JSON.parse(readFileSync(serviceAccountFile, "utf8"))),
      ...(projectId ? { projectId } : {}),
    });
  }

  return initializeApp({ credential: applicationDefault(), ...(projectId ? { projectId } : {}) });
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function logAdminError(context: string, error: unknown): void {
  const details = error instanceof Error ? error : new Error(String(error));
  const code = "code" in details ? String(details.code) : undefined;
  console.error(context, {
    name: details.name,
    ...(code ? { code } : {}),
    message: details.message.slice(0, 300),
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}