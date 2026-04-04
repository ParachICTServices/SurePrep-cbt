'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { packageService, CreatePackageRequest } from '@/app/lib/api/services/packageService';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function CreatePackagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePackageRequest>({
    id: '',
    name: '',
    credits: 0,
    bonus: 0,
    price: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id.trim()) {
      toast.error('Package ID is required');
      return;
    }
    
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
      await packageService.createPackage(formData);
      toast.success('Package created successfully');
      router.push('/admin/dashboard/packages');
    } catch (error: any) {
      console.error('Error creating package:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to create package';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreatePackageRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price / 100);
  };

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
        <h1 className="text-2xl font-bold text-white">Create New Package</h1>
        <p className="text-slate-400 mt-1">Add a new credit package for students</p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-6 space-y-6">
          <div>
            <label htmlFor="id" className="block text-sm font-medium text-slate-300 mb-2">
              Package ID *
            </label>
            <input
              type="text"
              id="id"
              value={formData.id}
              onChange={(e) => handleChange('id', e.target.value)}
              placeholder="e.g., starter, premium, ultimate"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
            <p className="text-slate-400 text-sm mt-1">
              Unique identifier for this package (lowercase, no spaces)
            </p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
              Package Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
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
              Price (in kobo) *
            </label>
            <input
              type="number"
              id="price"
              value={formData.price || ''}
              onChange={(e) => handleChange('price', parseInt(e.target.value) || 0)}
              placeholder="1000"
              min="1"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
            {formData.price > 0 && (
              <p className="text-slate-400 text-sm mt-1">
                Display price: {formatPrice(formData.price)}
              </p>
            )}
          </div>

          {formData.credits > 0 && (
            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">Package Preview</h3>
              <div className="space-y-1 text-sm">
                <p className="text-slate-300">
                  <span className="text-slate-400">Name:</span> {formData.name || 'Package Name'}
                </p>
                <p className="text-slate-300">
                  <span className="text-slate-400">Total Credits:</span> {formData.credits + formData.bonus} 
                  {formData.bonus > 0 && (
                    <span className="text-emerald-400"> ({formData.credits} + {formData.bonus} bonus)</span>
                  )}
                </p>
                <p className="text-slate-300">
                  <span className="text-slate-400">Price:</span> {formData.price > 0 ? formatPrice(formData.price) : 'N/A'}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              {loading ? 'Creating...' : 'Create Package'}
            </button>
            <Link
              href="/admin/dashboard/packages"
              className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}