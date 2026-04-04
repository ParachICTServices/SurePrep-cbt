'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  packageService,
  CreatePackageRequest,
  getPackageCardBackground,
  type Package,
} from '@/app/lib/api/services/packageService';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

const inputClass =
  'w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';

const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2';

const DEFAULT_CARD_COLOR = '#059669';

function pickerSafeHex(value: string | undefined | null): string {
  const v = value?.trim();
  if (v && /^#[0-9A-Fa-f]{6}$/i.test(v)) return v.toLowerCase();
  if (v && /^#[0-9A-Fa-f]{3}$/i.test(v)) {
    const h = v.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  return DEFAULT_CARD_COLOR;
}

export default function CreatePackagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePackageRequest>({
    name: '',
    credits: 0,
    bonus: 0,
    price: 0,
    color: DEFAULT_CARD_COLOR,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Package name is required');
      return;
    }

    if (formData.credits <= 0) {
      toast.error('Credits must be greater than 0');
      return;
    }

    if (formData.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      await packageService.createPackage({
        ...formData,
        color: pickerSafeHex(formData.color),
      });
      toast.success('Package created successfully');
      router.push('/admin/dashboard/packages');
    } catch (error: unknown) {
      console.error('Error creating package:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create package');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreatePackageRequest, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  return (
    <div className="p-6 text-slate-900 dark:text-slate-100">
      <div className="mb-6">
        <Link
          href="/admin/dashboard/packages"
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Packages
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Package</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Add a new credit package for students</p>
      </div>

      <div className="max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6 shadow-sm"
        >
          <div>
            <label htmlFor="name" className={labelClass}>
              Package Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Starter Pack, Premium Bundle"
              className={inputClass}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="credits" className={labelClass}>
                Credits *
              </label>
              <input
                type="number"
                id="credits"
                value={formData.credits || ''}
                onChange={(e) => handleChange('credits', parseInt(e.target.value, 10) || 0)}
                placeholder="50"
                min={1}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="bonus" className={labelClass}>
                Bonus Credits
              </label>
              <input
                type="number"
                id="bonus"
                value={formData.bonus || ''}
                onChange={(e) => handleChange('bonus', parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                min={0}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="price" className={labelClass}>
              Price (₦) *
            </label>
            <input
              type="number"
              id="price"
              value={formData.price || ''}
              onChange={(e) => handleChange('price', parseInt(e.target.value, 10) || 0)}
              placeholder="10"
              min={1}
              className={inputClass}
              required
            />
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Enter price in Naira (e.g., 10 for ₦10)
            </p>
          </div>

          <div>
            <span className={labelClass}>Card color</span>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">
              Used as the gradient on the student purchase page for this package.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <input
                type="color"
                id="package-color"
                value={pickerSafeHex(formData.color)}
                onChange={(e) => handleChange('color', e.target.value)}
                className="h-12 w-18 cursor-pointer rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 p-1 shadow-inner"
                aria-label="Package card color"
              />
              <input
                type="text"
                value={formData.color ?? ''}
                onChange={(e) => {
                  let next = e.target.value.trim();
                  if (next && !next.startsWith('#')) next = `#${next}`;
                  handleChange('color', next);
                }}
                className={`${inputClass} max-w-38 font-mono text-sm`}
                placeholder="#059669"
                spellCheck={false}
                maxLength={7}
                aria-label="Package color as hex"
              />
            </div>
          </div>

          {formData.credits > 0 && (
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-600 p-4">
              <h3 className="text-slate-900 dark:text-white font-medium mb-2">Package Preview</h3>
              {(() => {
                const previewPkg: Package = {
                  id: 'preview',
                  name: formData.name || 'Package',
                  credits: formData.credits,
                  bonus: formData.bonus,
                  price: formData.price,
                  color: formData.color,
                };
                const cardBg = getPackageCardBackground(previewPkg);
                return (
                  <div
                    className={`mb-4 rounded-xl p-4 text-white shadow-md ${cardBg.className}`}
                    style={cardBg.style}
                  >
                    <p className="font-semibold">{previewPkg.name}</p>
                    <p className="text-sm text-white/90">
                      {previewPkg.credits + previewPkg.bonus} credits ·{' '}
                      {formData.price > 0 ? formatPrice(formData.price) : '—'}
                    </p>
                  </div>
                );
              })()}
              <div className="space-y-1 text-sm">
                <p className="text-slate-700 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400">Name:</span>{' '}
                  {formData.name || 'Package Name'}
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400">Total Credits:</span>{' '}
                  {formData.credits + formData.bonus}
                  {formData.bonus > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {' '}
                      ({formData.credits} + {formData.bonus} bonus)
                    </span>
                  )}
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400">Price:</span>{' '}
                  {formData.price > 0 ? formatPrice(formData.price) : 'N/A'}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {loading ? 'Creating...' : 'Create Package'}
            </button>
            <Link
              href="/admin/dashboard/packages"
              className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-6 py-2 rounded-lg transition-colors inline-flex items-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
