import { apiClient } from '../apiClient';

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

function buildQuery(params: AdminCreditTransactionListParams): string {
  const searchParams = new URLSearchParams();
  if (params.limit != null) searchParams.set('limit', String(params.limit));
  if (params.page != null) searchParams.set('page', String(params.page));
  if (params.packageId?.trim()) searchParams.set('packageId', params.packageId.trim());
  if (params.type?.trim()) searchParams.set('type', params.type.trim());
  if (params.dateFrom?.trim()) searchParams.set('dateFrom', params.dateFrom.trim());
  if (params.dateTo?.trim()) searchParams.set('dateTo', params.dateTo.trim());
  if (params.userId?.trim()) searchParams.set('userId', params.userId.trim());
  const q = searchParams.toString();
  return q ? `?${q}` : '';
}

export const creditTransactionAdminService = {
  async list(
    params: AdminCreditTransactionListParams
  ): Promise<AdminCreditTransactionListResult> {
    const response = await apiClient.get<unknown>(
      `/credit-transactions/admin${buildQuery(params)}`
    );
    return parseListResponse(response);
  },

  async getById(id: string): Promise<CreditTransactionRecord> {
    return apiClient.get<CreditTransactionRecord>(
      `/credit-transactions/admin/${encodeURIComponent(id)}`
    );
  },
};

export function transactionRowId(row: CreditTransactionRecord): string {
  const id = row.id ?? row._id;
  return typeof id === 'string' ? id : '';
}
