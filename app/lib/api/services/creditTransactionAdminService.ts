import { FIRESTORE_COLLECTIONS, getRecord, listRecords } from "@/app/lib/firebaseData";

export interface AdminCreditTransactionListParams {
  limit?: number;
  page?: number;
  packageId?: string;
  packageName?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
}

export type CreditTransactionRecord = Record<string, unknown> & {
  id?: string;
  _id?: string;
};

export interface AdminCreditTransactionListResult {
  items: CreditTransactionRecord[];
  total?: number;
  page?: number;
  limit?: number;
}

function parseListResponse(response: unknown): AdminCreditTransactionListResult {
  if (Array.isArray(response)) {
    return { items: response as CreditTransactionRecord[] };
  }
  const r = response as Record<string, unknown>;
  const raw = r.data ?? r.results ?? r.items ?? r.transactions;
  const items = Array.isArray(raw) ? (raw as CreditTransactionRecord[]) : [];
  const meta = (r.meta ?? {}) as Record<string, unknown>;
  return {
    items,
    total: typeof r.total === 'number' ? r.total : (meta.total as number | undefined),
    page: typeof r.page === 'number' ? r.page : (meta.page as number | undefined),
    limit: typeof r.limit === 'number' ? r.limit : (meta.limit as number | undefined),
  };
}

export const creditTransactionAdminService = {
  async list(
    params: AdminCreditTransactionListParams
  ): Promise<AdminCreditTransactionListResult> {
    const all = await listRecords(FIRESTORE_COLLECTIONS.creditTransactions);
    const filtered = all.filter((row) =>
      (!params.packageId || row.packageId === params.packageId) &&
      (!params.type || row.type === params.type) &&
      (!params.userId || row.userId === params.userId) &&
      (!params.dateFrom || String(row.createdAt ?? "") >= params.dateFrom) &&
      (!params.dateTo || String(row.createdAt ?? "") <= params.dateTo)
    );
    const page = params.page ?? 1;
    const limit = params.limit ?? filtered.length;
    return { items: filtered.slice((page - 1) * limit, page * limit), total: filtered.length, page, limit };
  },

  async getById(id: string): Promise<CreditTransactionRecord> {
    const result = await getRecord(FIRESTORE_COLLECTIONS.creditTransactions, id);
    if (!result) throw new Error("Credit transaction not found.");
    return result as CreditTransactionRecord;
  },
};

export function transactionRowId(row: CreditTransactionRecord): string {
  const id = row.id ?? row._id;
  return typeof id === 'string' ? id : '';
}
