import { randomBytes } from "node:crypto";
import { FieldPath, Timestamp } from "firebase-admin/firestore";
import { getAdminDb, logAdminError } from "@/app/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


const QUESTIONS_PER_SUBJECT = 20;
const DEMO_SESSION_TTL_MS = 30 * 60 * 1000;
const RANDOM_DOCUMENT_ID_CHARACTERS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

// Value stored on the question documents -> label shown to students.
// "maths" is stored on a few questions, so it is folded into Mathematics.
const SUBJECTS: { label: string; values: string[] }[] = [
  { label: "English Language", values: ["english"] },
  { label: "Mathematics", values: ["mathematics", "maths"] },
  { label: "Biology", values: ["biology"] },
  { label: "Chemistry", values: ["chemistry"] },
  { label: "Physics", values: ["physics"] },
  { label: "Economics", values: ["economics"] },
  { label: "Commerce", values: ["commerce"] },
  { label: "Government", values: ["government"] },
  { label: "Accounting", values: ["accounting"] },
];

function randomDocumentId(): string {
  return Array.from(randomBytes(20), (byte) =>
    RANDOM_DOCUMENT_ID_CHARACTERS[byte % RANDOM_DOCUMENT_ID_CHARACTERS.length],
  ).join("");
}

type DemoDoc = {
  id: string;
  subject: string;
  text: string;
  options: string[];
  explanation: string;
  correctOption: number;
};

function parseDocument(id: string, data: FirebaseFirestore.DocumentData, label: string): DemoDoc | null {
  if (
    typeof data.questionText !== "string" ||
    !Array.isArray(data.options) ||
    data.options.length !== 4 ||
    !data.options.every((option: unknown) => typeof option === "string") ||
    !Number.isInteger(data.correctOption) ||
    data.correctOption < 0 ||
    data.correctOption >= data.options.length
  ) {
    return null;
  }
  return {
    id,
    subject: label,
    text: data.questionText,
    options: data.options as string[],
    explanation: typeof data.explanation === "string" ? data.explanation : "",
    correctOption: data.correctOption as number,
  };
}

async function pickForSubject(
  db: FirebaseFirestore.Firestore,
  subject: { label: string; values: string[] },
): Promise<DemoDoc[]> {
  const base = db
    .collection("questions")
    .where("subject", "in", subject.values)
    .orderBy(FieldPath.documentId())
    .select("questionText", "options", "explanation", "subject", "correctOption");

  // Start at a random point, then wrap to the start if we run out. Fetch a few extra
  // so malformed documents can be skipped.
  const fetchCount = QUESTIONS_PER_SUBJECT + 3;
  const firstPage = await base.startAt(randomDocumentId()).limit(fetchCount).get();
  const docs = [...firstPage.docs];
  if (docs.length < fetchCount) {
    const seen = new Set(docs.map((d) => d.id));
    const wrapped = await base.limit(fetchCount).get();
    for (const d of wrapped.docs) if (!seen.has(d.id)) docs.push(d);
  }

  const out: DemoDoc[] = [];
  for (const d of docs) {
    const parsed = parseDocument(d.id, d.data(), subject.label);
    if (parsed) out.push(parsed);
    if (out.length === QUESTIONS_PER_SUBJECT) break;
  }
  return out;
}

export async function GET() {
  try {
    const db = getAdminDb();
    const perSubject = await Promise.all(SUBJECTS.map((subject) => pickForSubject(db, subject)));
    const questions = perSubject.flat();

    if (questions.length === 0) {
      return Response.json(
        { error: "Demo questions are temporarily unavailable.", code: "DEMO_UNAVAILABLE" },
        { status: 503 },
      );
    }

    const sessionId = randomBytes(32).toString("base64url");
    await db.collection("demoSessions").doc(sessionId).create({
      questions: questions.map(({ id, subject, correctOption }) => ({ id, subject, correctOption })),
      expiresAt: Timestamp.fromMillis(Date.now() + DEMO_SESSION_TTL_MS),
      createdAt: Timestamp.now(),
    });

    return Response.json(
      {
        sessionId,
        questions: questions.map((question) => ({
          id: question.id,
          subject: question.subject,
          text: question.text,
          options: question.options,
          explanation: question.explanation,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logAdminError("Public demo question loading failed", error);
    return Response.json(
      { error: "The demo is temporarily unavailable. Please try again shortly.", code: "DEMO_UNAVAILABLE" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}