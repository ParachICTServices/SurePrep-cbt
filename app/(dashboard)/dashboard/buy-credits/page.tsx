"use client";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { userService } from "@/app/lib/api/services/userService"; 
import { Coins, Zap, Star, Crown, CheckCircle, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";


const CREDIT_PACKAGES = [
  {
    id: 'starter-basic',
    name: 'Basic Pack',
    credits: 50,
    price: 1000,
    bonus: 10,
    popular: true,
    icon: Zap,
    color: 'from-emerald-600 to-emerald-700',
    badge: 'bg-emerald-500',
  },
  {
    id: 'starter-premium',
    name: 'Premium Pack',
    credits: 100,
    price: 2000,
    bonus: 50,
    popular: false,
    icon: Star,
    color: 'from-blue-600 to-blue-700',
    badge: 'bg-blue-500',
  },
  {
    id: 'ultimate',
    name: 'Ultimate Pack',
    credits: 250,
    price: 5000,
    bonus: 150,
    popular: false,
    icon: Crown,
    color: 'from-purple-600 to-purple-700',
    badge: 'bg-purple-500',
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    credits: 500, 
    price: 10000,
    bonus: 200,
    popular: false,
    icon: Zap,
    color: 'from-amber-600 to-amber-700',
    badge: 'bg-amber-500',
  }
];

export default function BuyCreditsPage() {
  const { user, refreshUser } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState(CREDIT_PACKAGES[0]); 
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!user) {
      toast.error("Please login to purchase credits");
      return;
    }

    setLoading(true);

    try {
      const PaystackPop = (await import("@paystack/inline-js")).default;
      const paystack = new PaystackPop();
      
      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string,
        email: user.email,
        amount: selectedPackage.price * 100,
        currency: 'NGN',
        metadata: {
          custom_fields: [
            { display_name: "User ID", variable_name: "user_id", value: user.id },
            { display_name: "Package", variable_name: "package", value: selectedPackage.id }
          ]
        },
        onSuccess: async (transaction: any) => {
          try {
            toast.loading("Verifying payment...");

            await userService.verifyPayment(transaction.reference, selectedPackage.id);

            toast.dismiss();
            toast.success(`Purchase successful! Credits added to your account. 🎉`);
            
            await refreshUser();
            setLoading(false);
            
          } catch (error: any) {
            console.error("Verification error:", error);
            toast.error(error.message || "Payment verification failed. Please contact support.");
            setLoading(false);
          }
        },
        onCancel: () => {
          setLoading(false);
          toast.error("Transaction cancelled.");
        }
      });
    } catch (error) {
      console.error("Payment initialization error:", error);
      toast.error("Error starting payment. Check your internet connection.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Purchase Credits</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CREDIT_PACKAGES.map((pkg) => {
          const Icon = pkg.icon;
          const isSelected = selectedPackage.id === pkg.id;
          const totalCredits = pkg.credits + pkg.bonus;

          return (
            <button
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg)}
              className={`relative rounded-2xl p-6 transition-all transform hover:scale-105 ${
                isSelected ? 'ring-4 ring-emerald-500 shadow-2xl scale-105' : 'shadow-lg'
              } bg-gradient-to-br ${pkg.color} text-white`}
            >
              {pkg.popular && (
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

      {/* Purchase Summary */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-8">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Summary</h3>
        
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center text-lg font-bold">
            <span className="text-slate-900">Total Credits</span>
            <span className="text-emerald-600">{selectedPackage.credits + selectedPackage.bonus}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold">
            <span className="text-slate-900">Amount to Pay</span>
            <span className="text-slate-900">₦{selectedPackage.price.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={handlePurchase}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-3 text-lg"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Pay Now & Get Credits"}
        </button>
      </div>
    </div>
  );
}