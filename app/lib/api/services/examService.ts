import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase";
import { FIRESTORE_COLLECTIONS, createRecord, getRecord } from "@/app/lib/firebaseData";

export interface TestResult {
  id: string;
  userId: string;
  subject: string;
  subjectId: string;
  topic?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  date: string;
  type: 'practice' | 'mock';
  history: QuestionHistory[];
}

export interface QuestionHistory {
  questionId?: string;
  questionText: string;
  options: string[];
  correctOption: number;
  selectedOption: number;
  explanation: string;
  imageURL?: string;
}

export const examService = {
  async submitTestResult(data: Omit<TestResult, 'id' | 'userId'> & Partial<Pick<TestResult, 'userId'>>): Promise<TestResult> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("You must be signed in to submit a result.");
    return createRecord(FIRESTORE_COLLECTIONS.results, { ...data, userId: data.userId ?? userId }) as Promise<TestResult>;
  },

  async getTestResults(filter?: { type?: string; limit?: number }): Promise<TestResult[]> {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];
    const constraints = [where("userId", "==", userId)];
    if (filter?.type) constraints.push(where("type", "==", filter.type));
    const snapshot = await getDocs(query(collection(db, FIRESTORE_COLLECTIONS.results), ...constraints));
    return snapshot.docs
      .map((result) => ({ id: result.id, ...result.data() }))
      .slice(0, filter?.limit ?? Number.MAX_SAFE_INTEGER) as TestResult[];
  },

  async getTestResult(id: string): Promise<TestResult> {
    const result = await getRecord(FIRESTORE_COLLECTIONS.results, id);
    if (!result || result.userId !== auth.currentUser?.uid) throw new Error("Result not found.");
    return result as TestResult;
  },

  async getStatistics(): Promise<unknown> {
    const results = await this.getTestResults();
    const percentages = results.map((result) => Number(result.percentage ?? 0));
    return {
      totalTests: results.length,
      averageScore: percentages.length ? percentages.reduce((total, value) => total + value, 0) / percentages.length : 0,
      bestScore: percentages.length ? Math.max(...percentages) : 0,
      totalQuestions: results.reduce((total, result) => total + Number(result.totalQuestions ?? 0), 0),
    };
  },
};