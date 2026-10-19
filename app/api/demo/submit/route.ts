import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb, logAdminError } from "@/app/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StoredDemoQuestion = {
  id: string;
  subject: string;
  correctOption: number;
};

type DemoAnswer = {
  sessionId?: unknown;
  answers?: unknown;
};

export async function POST(request: Request) {
  let body: DemoAnswer;
  try {
    body = await request.json() as DemoAnswer;
  } catch {
    return Response.json({ error: "Invalid submission.", code: "INVALID_SUBMISSION" }, { status: 400 });
  }

  if (
    typeof body.sessionId !== "string" ||
    !/^[A-Za-z0-9_-]{40,50}$/.test(body.sessionId) ||
    !body.answers ||
    typeof body.answers !== "object" ||
    Array.isArray(body.answers)
  ) {
    return Response.json({ error: "Invalid submission.", code: "INVALID_SUBMISSION" }, { status: 400 });
  }

  const answers = body.answers as Record<string, unknown>;
  const answerEntries = Object.entries(answers);
  if (
    answerEntries.length > 10 ||
    answerEntries.some(([, option]) => !Number.isInteger(option) || Number(option) < 0 || Number(option) > 3)
  ) {
    return Response.json({ error: "Invalid submission.", code: "INVALID_SUBMISSION" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const sessionReference = db.collection("demoSessions").doc(body.sessionId);
    const outcome = await db.runTransaction(async (transaction) => {
      const sessionSnapshot = await transaction.get(sessionReference);
      if (!sessionSnapshot.exists) return { status: "not_found" as const };

      const session = sessionSnapshot.data();
      const expiresAt = session?.expiresAt;
      if (!(expiresAt instanceof Timestamp) || expiresAt.toMillis() <= Date.now()) {
        transaction.delete(sessionReference);
        return { status: "expired" as const };
      }

      if (session?.submittedResult) {
        return { status: "submitted" as const, result: session.submittedResult };
      }

      const storedQuestions = session?.questions as StoredDemoQuestion[] | undefined;
      if (
        !Array.isArray(storedQuestions) ||
        storedQuestions.length !== 10 ||
        answerEntries.some(([id]) => !storedQuestions.some((question) => question.id === id))
      ) {
        return { status: "invalid" as const };
      }

      const results = storedQuestions.map((question) => {
        const selectedOption = answers[question.id];
        return {
          id: question.id,
          subject: question.subject,
          selectedOption: typeof selectedOption === "number" ? selectedOption : null,
          isCorrect: selectedOption === question.correctOption,
        };
      });
      const score = results.filter((result) => result.isCorrect).length;
      const result = {
        score,
        total: results.length,
        answered: answerEntries.length,
        percentage: Math.round((score / results.length) * 100),
        results,
      };
      transaction.update(sessionReference, {
        submittedAt: Timestamp.now(),
        submittedResult: result,
      });
      return {
        status: "submitted" as const,
        result,
      };
    });

    if (outcome.status === "not_found") {
      return Response.json({ error: "Demo session not found. Start a new demo.", code: "SESSION_NOT_FOUND" }, { status: 404 });
    }
    if (outcome.status === "expired") {
      return Response.json({ error: "Your demo session expired. Start a new demo.", code: "SESSION_EXPIRED" }, { status: 410 });
    }
    if (outcome.status === "invalid") {
      return Response.json({ error: "Your answers could not be validated.", code: "INVALID_SUBMISSION" }, { status: 400 });
    }

    return Response.json(outcome.result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logAdminError("Public demo submission failed", error);
    return Response.json(
      { error: "Your result could not be submitted. Please try again.", code: "DEMO_SUBMIT_FAILED" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}