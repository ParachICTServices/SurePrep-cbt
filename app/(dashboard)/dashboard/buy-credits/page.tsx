"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { userService } from "@/app/lib/api/services/userService";
import {
  packageService,
  Package,
  getPackageCardBackground,
} from "@/app/lib/api/services/packageService";
import { Coins, Zap, Star, Crown, CheckCircle, Loader2, TrendingUp, Package as PackageIcon } from "lucide-react";
import { toast } from "sonner";
import ComingSoon from "@/app/components/ComingSoon";


// Icon and color mapping for packages
const getPackageIcon = (packageId: string) => {
  const iconMap: { [key: string]: any } = {
    'starter': Zap,
    'basic': Zap,
    'premium': Star,
    'ultimate': Crown,
    'pro': Crown,
  };
  
  const key = Object.keys(iconMap).find(k => packageId.toLowerCase().includes(k));
  return key ? iconMap[key] : PackageIcon;
};

export default function BuyCreditsPage() {
  const { user, refreshUser } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [loading, setLoading] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(true);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setPackagesLoading(true);
      const data = await packageService.getUserPackages();
      setPackages(data);
      if (data.length > 0) {
        setSelectedPackage(data[0]); // Select first package by default
      }
    } catch (error) {
      console.error('Error loading packages:', error);
      toast.error('Failed to load packages');
    } finally {
      setPackagesLoading(false);
    }
  };

  // Payment flows are disabled temporarily. Show Coming Soon instead.
  const handlePurchase = async () => {
    toast.info('Purchases are disabled — premium features coming soon.');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">Purchase Credits</h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Credits are used to unlock practice sessions and mock exams.
        </p>
      </div>

      {/* Current Balance Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-200 text-sm mb-1">Current Balance</p>
            <h2 className="text-5xl font-bold flex items-center gap-3">
              <Coins size={48} className="text-emerald-300" />
              {user?.credits?.toLocaleString() || 0}
              <span className="text-2xl text-emerald-200">credits</span>
            </h2>
          </div>
          <div className="text-right">
            <p className="text-emerald-200 text-sm mb-1">Total Earned</p>
            <p className="text-2xl font-bold text-emerald-100">
              {user?.totalCreditsEarned?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Credit Packages */}
      {packagesLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : packages.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-8 text-center">
          <PackageIcon className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No packages available</h3>
          <p className="text-slate-600 dark:text-slate-400">Please check back later for credit packages.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg, index) => {
            const Icon = getPackageIcon(pkg.id);
            const isSelected = selectedPackage?.id === pkg.id;
            const cardBg = getPackageCardBackground(pkg);
            const isPopular = index === 0; // Mark first package as popular

            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelectedPackage(pkg)}
                style={cardBg.style}
                className={`relative rounded-2xl p-6 transition-all transform hover:scale-105 text-white ${
                  isSelected ? 'ring-4 ring-emerald-500 shadow-2xl scale-105' : 'shadow-lg'
                } ${cardBg.className}`.trim()}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-400 text-amber-900 text-[10px] font-black px-4 py-1 rounded-full shadow-lg">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="flex justify-center mb-4">
                  <div className="bg-white/20 p-4 rounded-2xl">
                    <Icon size={48} />
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                <div className="mb-4">
                  <p className="text-2xl font-bold">{pkg.credits} credits</p>
                  {pkg.bonus > 0 && (
                    <div className="mt-2 flex items-center justify-center gap-2 bg-white/20 rounded-lg py-1 px-3">
                      <TrendingUp size={14} />
                      <span className="text-xs font-bold">+{pkg.bonus} BONUS</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/20 pt-4">
                  <p className="text-xl font-bold">₦{pkg.price.toLocaleString()}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Purchase Summary */}
      {selectedPackage && (
        <div>
          <ComingSoon title="Credits & Premium Packs" description="Purchases and premium packs are temporarily disabled. Credits will be available soon." />
        </div>
      )}
    </div>
  );
}