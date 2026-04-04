'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Package, packageService, UpdatePackageRequest } from '@/app/lib/api/services/packageService';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function EditPackagePage() {
  const router = useRouter();
  const params = useParams();
  const packageId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [originalPackage, setOriginalPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState<UpdatePackageRequest>({
    name: '',
    credits: 0,
    bonus: 0,
    price: 0,
  });

  useEffect(() => {
    loadPackage();
  }, [packageId]);

  const loadPackage = async () => {
    try {
      setInitialLoading(true);
      const pkg = await packageService.getPackageById(packageId);
      setOriginalPackage(pkg);
      setFormData({
        name: pkg.name,
        credits: pkg.credits,
        bonus: pkg.bonus,
        price: pkg.price,
      });
    } catch (error) {
      console.error('Error loading package:', error);
      toast.error('Failed to load package');
      router.push('/admin/dashboard/packages');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast.error('Package name is required');
      return;
    }
    
    if (!formData.credits || formData.credits <= 0) {
      toast.error('Credits must be greater than 0');
      return;
    }
    
    if (!formData.price || formData.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      await packageService.updatePackage(packageId, formData);
      toast.success('Package updated successfully');
      router.push('/admin/dashboard/packages');
    } catch (error: any) {
      console.error('Error updating package:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to update package';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof UpdatePackageRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const hasChanges = () => {
    if (!originalPackage) return false;
    return (
      formData.name !== originalPackage.name ||
      formData.credits !== originalPackage.credits ||
      formData.bonus !== originalPackage.bonus ||
      formData.price !== originalPackage.price
    );
  };

  if (initialLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  if (!originalPackage) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Package Not Found</h1>
          <Link
            href="/admin/dashboard/packages"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Return to Packages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/admin/dashboard/packages"
          className="text-slate-400 hover:text-white flex items-center gap-2 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Packages
        </Link>
        <h1 className="text-2xl font-bold text-white">Edit Package</h1>
        <p className="text-slate-400 mt-1">
          Editing package: <span className="font-mono text-slate-300">{originalPackage.id}</span>
        </p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
              Package Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Starter Pack, Premium Bundle"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="credits" className="block text-sm font-medium text-slate-300 mb-2">
                Credits *
              </label>
              <input
                type="number"
                id="credits"
                value={formData.credits || ''}
                onChange={(e) => handleChange('credits', parseInt(e.target.value) || 0)}
                placeholder="50"
                min="1"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="bonus" className="block text-sm font-medium text-slate-300 mb-2">
                Bonus Credits
              </label>
              <input
                type="number"
                id="bonus"
                value={formData.bonus || ''}
                onChange={(e) => handleChange('bonus', parseInt(e.target.value) || 0)}
                placeholder="0"
                min="0"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-slate-300 mb-2">
              Price (₦) *
            </label>
            <input
              type="number"
              id="price"
              value={formData.price || ''}
              onChange={(e) => handleChange('price', parseInt(e.target.value) || 0)}
              placeholder="10"
              min="1"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
            <p className="text-slate-400 text-sm mt-1">
              Enter price in Naira (e.g., 10 for ₦10)
            </p>
          </div>

          {formData.credits && formData.credits > 0 && (
            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">Package Preview</h3>
              <div className="space-y-1 text-sm">
                <p className="text-slate-300">
                  <span className="text-slate-400">Name:</span> {formData.name || 'Package Name'}
                </p>
                <p className="text-slate-300">
                  <span className="text-slate-400">Total Credits:</span> {(formData.credits || 0) + (formData.bonus || 0)} 
                  {formData.bonus && formData.bonus > 0 && (
                    <span className="text-emerald-400"> ({formData.credits} + {formData.bonus} bonus)</span>
                  )}
                </p>
                <p className="text-slate-300">
                  <span className="text-slate-400">Price:</span> {formData.price && formData.price > 0 ? formatPrice(formData.price) : 'N/A'}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading || !hasChanges()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:opacity-50 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              {loading ? 'Updating...' : 'Update Package'}
            </button>
            <Link
              href="/admin/dashboard/packages"
              className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Cancel
            </Link>
          </div>

          {!hasChanges() && (
            <p className="text-slate-400 text-sm">No changes detected</p>
          )}
        </form>
      </div>
    </div>
  );
}