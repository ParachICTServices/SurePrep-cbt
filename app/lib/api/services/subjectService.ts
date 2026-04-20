import { apiClient } from "../apiClient";

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
  async getSubjectsPage(params: { page?: number; limit?: number } = {}): Promise<PaginatedSubjectsResponse> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    const raw = await apiClient.get<unknown>(`/subjects?${qs.toString()}`);
    return normalizeSubjectsPayload(raw);
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
};

