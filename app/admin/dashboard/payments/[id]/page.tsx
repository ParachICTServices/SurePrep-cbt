'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  creditTransactionAdminService,
  type CreditTransactionRecord,
} from '@/app/lib/api/services/creditTransactionAdminService';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';

function formatValue(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export default function AdminPaymentDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const [record, setRecord] = useState<CreditTransactionRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await creditTransactionAdminService.getById(id);
        if (!cancelled) setRecord(data);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          toast.error('Failed to load transaction.');
          setRecord(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const entries = record ? Object.entries(record) : [];

  return (
    <div className="p-6 text-slate-900 dark:text-slate-100 max-w-3xl mx-auto">
      <Link
        href="/admin/dashboard/payments"
        className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to payments
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <CreditCard className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transaction</h1>
          {id && <p className="text-slate-600 dark:text-slate-400 font-mono text-sm mt-0.5">{id}</p>}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : !record ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-16">Transaction not found.</p>
        ) : (
          <dl className="divide-y divide-slate-200 dark:divide-slate-700">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
              >
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wide sm:col-span-1">
                  {key}
                </dt>
                <dd className="mt-1 text-sm text-slate-800 dark:text-slate-200 sm:col-span-2 sm:mt-0 break-words whitespace-pre-wrap font-mono">
                  {formatValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
