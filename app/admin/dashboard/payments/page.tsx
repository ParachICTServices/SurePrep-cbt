'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  creditTransactionAdminService,
  transactionRowId,
  type AdminCreditTransactionListParams,
  type CreditTransactionRecord,
} from '@/app/lib/api/services/creditTransactionAdminService';
import { toast } from 'sonner';
import { CreditCard, Loader2, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

function formatCell(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function formatDate(value: unknown): string {
  if (value == null || typeof value !== 'string') return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

const emptyApplied: Pick<
  AdminCreditTransactionListParams,
  'packageId' | 'type' | 'dateFrom' | 'dateTo' | 'userId'
> = {};

export default function AdminPaymentsPage() {
  const [items, setItems] = useState<CreditTransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | undefined>(undefined);

  const [draftPackageId, setDraftPackageId] = useState('');
  const [draftType, setDraftType] = useState('');
  const [draftDateFrom, setDraftDateFrom] = useState('');
  const [draftDateTo, setDraftDateTo] = useState('');
  const [draftUserId, setDraftUserId] = useState('');

  const [applied, setApplied] = useState<
    Pick<AdminCreditTransactionListParams, 'packageId' | 'type' | 'dateFrom' | 'dateTo' | 'userId'>
  >(emptyApplied);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await creditTransactionAdminService.list({
        limit,
        page,
        ...applied,
      });
      setItems(res.items);
      setTotal(res.total);
      if (typeof res.limit === 'number') setLimit(res.limit);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load credit transactions.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [limit, page, applied]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setApplied({
      packageId: draftPackageId.trim() || undefined,
      type: draftType.trim() || undefined,
      dateFrom: draftDateFrom.trim() || undefined,
      dateTo: draftDateTo.trim() || undefined,
      userId: draftUserId.trim() || undefined,
    });
    setPage(1);
  };

  const clearFilters = () => {
    setDraftPackageId('');
    setDraftType('');
    setDraftDateFrom('');
    setDraftDateTo('');
    setDraftUserId('');
    setApplied(emptyApplied);
    setPage(1);
    setLimit(20);
  };

  const totalPages =
    total != null && limit > 0 ? Math.max(1, Math.ceil(total / limit)) : undefined;
  const canPrev = page > 1;
  const canNext = totalPages != null ? page < totalPages : items.length >= limit;

  return (
    <div className="p-6 text-slate-900 dark:text-slate-100 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            Payments
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Credit transactions — filter by package, type, dates, or user.
          </p>
        </div>
      </div>

      <form
        onSubmit={applyFilters}
        className="bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6 space-y-4 shadow-sm"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Package ID</label>
            <input
              value={draftPackageId}
              onChange={(e) => setDraftPackageId(e.target.value)}
              placeholder="pkg_premium_100"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Type</label>
            <input
              value={draftType}
              onChange={(e) => setDraftType(e.target.value)}
              placeholder="purchase"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">User ID</label>
            <input
              value={draftUserId}
              onChange={(e) => setDraftUserId(e.target.value)}
              placeholder="UUID"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Page size</label>
            <input
              type="number"
              min={1}
              max={100}
              value={limit}
              onChange={(e) => {
                setLimit(Math.max(1, parseInt(e.target.value, 10) || 20));
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Date from</label>
            <input
              type="date"
              value={draftDateFrom}
              onChange={(e) => setDraftDateFrom(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Date to</label>
            <input
              type="date"
              value={draftDateTo}
              onChange={(e) => setDraftDateTo(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            Apply filters
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            Clear
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-sm text-slate-600 dark:text-slate-400">
        <span>
          {total != null ? (
            <>
              Page {page}
              {totalPages != null ? ` of ${totalPages}` : ''} · {items.length} on this page ·{' '}
              {total} total
            </>
          ) : (
            <>
              Page {page} · {items.length} rows
            </>
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canPrev || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <button
            type="button"
            disabled={!canNext || loading}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-16">No transactions match these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400">
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Package</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium text-right">Credits</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium w-24" />
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const id = transactionRowId(row);
                  return (
                    <tr
                      key={id || JSON.stringify(row)}
                      className="border-b border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                    >
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatDate(row.createdAt ?? row.created_at)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300 max-w-[140px] truncate">
                        {formatCell(row.reference ?? row.paymentRef)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400 max-w-[120px] truncate">
                        {formatCell(row.userId ?? row.user_id)}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                        {formatCell(row.packageId ?? row.package_id)}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{formatCell(row.type)}</td>
                      <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-200">
                        {formatCell(row.amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-200">
                        {formatCell(row.credits)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                          {formatCell(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {id ? (
                          <Link
                            href={`/admin/dashboard/payments/${encodeURIComponent(id)}`}
                            className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs font-medium"
                          >
                            View
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
