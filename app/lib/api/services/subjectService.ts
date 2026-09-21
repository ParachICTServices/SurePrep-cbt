import {
  FIRESTORE_COLLECTIONS,
  getRecord,
  listRecords,
  recordFromSnapshot,
  createRecord,
  updateRecord,
  removeRecord,
} from "@/app/lib/firebaseData";

export type SubjectCategory = "sciences" | "arts" | "commercial" | "general";

export interface SubjectTopic {
  id: string;
  name: string;
  cost: number;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  category: SubjectCategory;
  topics?: SubjectTopic[];
  questionCount?: number;
  createdAt?: string;
}

export interface PaginatedSubjectsResponse {
  data: Subject[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

function normalizeSubjectsPayload(raw: unknown): PaginatedSubjectsResponse {
  if (Array.isArray(raw)) return { data: raw as Subject[] };
  if (raw && typeof raw === "object") {
    const r = raw as any;
    if (Array.isArray(r.data)) return r as PaginatedSubjectsResponse;
    if (Array.isArray(r.results)) return { data: r.results, ...r };
    if (Array.isArray(r.subjects)) return { data: r.subjects, ...r };
  }
  return { data: [] };
}

export const subjectService = {
  async getSubject(id: string): Promise<Subject> {
    const subject = await getRecord(FIRESTORE_COLLECTIONS.subjects, id);
    if (!subject) throw new Error("Subject not found.");
    return subject as Subject;
  },

  async getSubjectsPage(params: { page?: number; limit?: number } = {}): Promise<PaginatedSubjectsResponse> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const subjects = await listRecords(FIRESTORE_COLLECTIONS.subjects);
    const start = (page - 1) * limit;
    return {
      data: subjects.slice(start, start + limit) as Subject[],
      total: subjects.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(subjects.length / limit)),
    };
  },

  async getAllSubjects(params: { limit?: number } = {}): Promise<Subject[]> {
    const limit = params.limit ?? 50;
    let page = 1;
    const out: Subject[] = [];

    // Keep paging until totalPages is exhausted; fall back to "empty page" stop.
    // This ensures we don't silently cap subjects at 50.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const res = await this.getSubjectsPage({ page, limit });
      out.push(...(res.data || []));

      const totalPages =
        typeof res.totalPages === "number" && Number.isFinite(res.totalPages) ? res.totalPages : null;

      if (totalPages != null) {
        if (page >= totalPages) break;
      } else if (!res.data || res.data.length === 0) {
        break;
      }

      page += 1;
    }

    return out;
  },

  async createSubject(data: Omit<Subject, "id">): Promise<Subject> {
    return createRecord(FIRESTORE_COLLECTIONS.subjects, data) as Promise<Subject>;
  },

  async updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
    return updateRecord(FIRESTORE_COLLECTIONS.subjects, id, data) as Promise<Subject>;
  },

  async deleteSubject(id: string): Promise<void> {
    await removeRecord(FIRESTORE_COLLECTIONS.subjects, id);
  },
};

