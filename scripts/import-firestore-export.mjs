import fs from "node:fs/promises";
import process from "node:process";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const inputPath = process.argv[2];
if (!inputPath) {
  throw new Error("Usage: node scripts/import-firestore-export.mjs <export.json>");
}

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const serviceAccountFile = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
let serviceAccount;

if (serviceAccountJson) {
  serviceAccount = JSON.parse(serviceAccountJson);
} else if (serviceAccountFile) {
  serviceAccount = JSON.parse(await fs.readFile(serviceAccountFile, "utf8"));
} else {
  throw new Error(
    "Set FIREBASE_SERVICE_ACCOUNT_FILE to a service-account JSON file path or FIREBASE_SERVICE_ACCOUNT_JSON to its JSON contents.",
  );
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({ credential: cert(serviceAccount) });
const firestore = getFirestore(app);
const source = JSON.parse(await fs.readFile(inputPath, "utf8"));
const collectionNames = ["questions", "subjects", "users", "results", "sessions", "topics"];

function normalizeValue(value) {
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (!value || typeof value !== "object") return value;
  if (value._type === "timestamp" && typeof value.value === "string") return Timestamp.fromDate(new Date(value.value));
  return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, normalizeValue(nested)]));
}

async function writeCollection(name, records) {
  if (!Array.isArray(records) || records.length === 0) return 0;
  let written = 0;
  for (let start = 0; start < records.length; start += 500) {
    const batch = firestore.batch();
    for (const raw of records.slice(start, start + 500)) {
      const id = String(raw.id ?? raw._id ?? firestore.collection(name).doc().id);
      const data = { ...normalizeValue(raw) };
      delete data._id;
      delete data.id;
      if (name === "users" && data.uid) delete data.uid;
      batch.set(firestore.collection(name).doc(id), data, { merge: true });
    }
    await batch.commit();
    written += Math.min(500, records.length - start);
    console.log(`${name}: ${written}/${records.length}`);
  }
  return written;
}

for (const name of collectionNames) {
  await writeCollection(name, source[name]);
}

console.log("Firestore import complete. Firebase Auth users were not created because the export contains no passwords.");