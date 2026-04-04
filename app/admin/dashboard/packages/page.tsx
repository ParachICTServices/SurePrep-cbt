'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  packageService,
  getPackageCardBackground,
} from '@/app/lib/api/services/packageService';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Package as PackageIcon } from 'lucide-react';
import Link from 'next/link';

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await packageService.getAllPackages();
      setPackages(data);
    } catch (error) {
      console.error('Error loading packages:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(id);
      await packageService.deletePackage(id);
      toast.success('Package deleted successfully');
      await loadPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('Failed to delete package');
    } finally {
      setDeleting(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-slate-900 dark:text-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Package Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage credit packages for students</p>
        </div>
        <Link
          href="/admin/dashboard/packages/create"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Create Package
        </Link>
      </div>

      {packages.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center shadow-sm">
          <PackageIcon className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No packages found</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Get started by creating your first credit package</p>
          <Link
            href="/admin/dashboard/packages/create"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Package
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {packages.map((pkg) => {
            const previewBg = getPackageCardBackground(pkg);
            return (
            <div
              key={pkg.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <div
                      className={`h-8 w-16 rounded-lg border border-slate-200 dark:border-slate-600 shrink-0 overflow-hidden ${previewBg.className}`}
                      style={previewBg.style}
                      title={pkg.color ? String(pkg.color) : 'Default palette'}
                      aria-hidden
                    />
                    <PackageIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{pkg.name}</h3>
                  
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Credits</p>
                      <p className="text-slate-900 dark:text-white font-semibold">{pkg.credits.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Bonus Credits</p>
                      <p className="text-slate-900 dark:text-white font-semibold">
                        {pkg.bonus > 0 ? `+${pkg.bonus.toLocaleString()}` : 'None'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Price</p>
                      <p className="text-slate-900 dark:text-white font-semibold">{formatPrice(pkg.price)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <Link
                    href={`/admin/dashboard/packages/${pkg.id}/edit`}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                    title="Edit package"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(pkg.id)}
                    disabled={deleting === pkg.id}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white p-2 rounded-lg transition-colors"
                    title="Delete package"
                  >
                    {deleting === pkg.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
