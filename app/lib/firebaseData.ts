import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type DocumentReference,
} from "firebase/firestore";
import { db, auth, isFirebaseConfigured } from "@/app/lib/firebase";
import type { User } from "@/app/type";

export const FIRESTORE_COLLECTIONS = {
  users: "users",
  subjects: "subjects",
  questions: "questions",
  results: "testResults",
  packages: "packages",
  creditTransactions: "creditTransactions",
  creditUsage: "creditUsage",
  examConfigurations: "examConfigurations",
} as const;

export type FirestoreRecord = DocumentData & { id: string };

function withoutUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => (item === undefined ? null : withoutUndefined(item)));
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, withoutUndefined(item)]),
    );
  }
  return value;
}

function requireFirebase(): void {
  if (!isFirebaseConfigured || !db || !auth) {
    throw new Error("Firebase is not configured. Add the NEXT_PUBLIC_FIREBASE_* variables to .env.local.");
  }
}

export function recordFromSnapshot(snapshot: { id: string; data: () => DocumentData }): FirestoreRecord {
  return { id: snapshot.id, ...snapshot.data() };
}

export async function listRecords(collectionName: string): Promise<FirestoreRecord[]> {
  requireFirebase();
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map(recordFromSnapshot);
}

export async function getRecord(collectionName: string, id: string): Promise<FirestoreRecord | null> {
  requireFirebase();
  const snapshot = await getDoc(doc(db, collectionName, id));
  return snapshot.exists() ? recordFromSnapshot(snapshot) : null;
}

export async function createRecord(collectionName: string, data: DocumentData): Promise<FirestoreRecord> {
  requireFirebase();
  const createdAt = new Date().toISOString();
  const cleanData = withoutUndefined(data) as DocumentData;
  const reference = await addDoc(collection(db, collectionName), { ...cleanData, createdAt, updatedAt: createdAt });
  return { id: reference.id, ...cleanData, createdAt, updatedAt: createdAt };
}

export async function setRecord(collectionName: string, id: string, data: DocumentData): Promise<FirestoreRecord> {
  requireFirebase();
  const updatedAt = new Date().toISOString();
  await setDoc(doc(db, collectionName, id), { ...data, updatedAt }, { merge: true });
  return { id, ...(await getRecord(collectionName, id)) } as FirestoreRecord;
}

export async function updateRecord(collectionName: string, id: string, data: DocumentData): Promise<FirestoreRecord> {
  requireFirebase();
  const updatedAt = new Date().toISOString();
  await updateDoc(doc(db, collectionName, id), { ...data, updatedAt });
  return { id, ...(await getRecord(collectionName, id)) } as FirestoreRecord;
}

export async function removeRecord(collectionName: string, id: string): Promise<void> {
  requireFirebase();
  await deleteDoc(doc(db, collectionName, id));
}

export function profileFromRecord(id: string, data: DocumentData | undefined): User {
  return {
    id,
    email: String(data?.email ?? auth.currentUser?.email ?? ""),
    displayName: (data?.displayName as string | null | undefined) ?? auth.currentUser?.displayName ?? null,
    role: typeof data?.role === "string" ? data.role : undefined,
    examCategory: data?.examCategory ?? "senior",
    specialization: data?.specialization ?? "general",
    credits: Number(data?.credits ?? 0),
    totalCreditsEarned: Number(data?.totalCreditsEarned ?? 0),
    emailVerified: Boolean(data?.emailVerified ?? auth.currentUser?.emailVerified),
    createdAt: String(data?.createdAt ?? new Date().toISOString()),
  };
}

export async function getCurrentUserProfile(): Promise<User> {
  requireFirebase();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("You must be signed in.");
  const profile = await getRecord(FIRESTORE_COLLECTIONS.users, currentUser.uid);
  return profileFromRecord(currentUser.uid, profile ?? undefined);
}

export async function saveUserProfile(uid: string, data: Partial<User>): Promise<User> {
  requireFirebase();
  const existing = await getRecord(FIRESTORE_COLLECTIONS.users, uid);
  const profile = profileFromRecord(uid, { ...(existing ?? {}), ...data });
  const { role, ...profileFields } = profile;
  await setDoc(doc(db, FIRESTORE_COLLECTIONS.users, uid), {
    ...profileFields,
    ...(role !== undefined ? { role } : {}),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return profile;
}

export async function changeUserCredits(uid: string, amount: number): Promise<User> {
  requireFirebase();
  const reference = doc(db, FIRESTORE_COLLECTIONS.users, uid);
  const profile = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) throw new Error("User profile not found.");
    const current = Number(snapshot.data().credits ?? 0);
    const next = current + amount;
    if (next < 0) throw new Error("Insufficient credits.");
    transaction.update(reference, { credits: next, updatedAt: serverTimestamp() });
    return { ...snapshot.data(), credits: next };
  });
  return profileFromRecord(uid, profile);
}

export function referenceFor(collectionName: string, id: string): DocumentReference {
  return doc(db, collectionName, id);
}