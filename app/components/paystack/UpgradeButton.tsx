"use client";
import { useAuth } from '@/app/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { useState } from 'react';import { toast } from 'sonner';
export default function UpgradeButton() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);

  if (userData?.subscriptionStatus === 'premium') {
    return <button disabled className="bg-gray-200 text-gray-500 px-6 py-3 rounded-lg">Premium Active</button>;
  }

  const handlePayment = async () => {
    if (!user || !user.email) return;
    setLoading(true);

    try {
      const PaystackPop = (await import('@paystack/inline-js')).default;
      const paystack = new PaystackPop();
      
      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string,
        email: user.email,
        amount: 2000 * 100, // ₦2,000 in kobo
        currency: 'NGN',
        metadata: {
          custom_fields: [
            { display_name: "User ID", variable_name: "user_id", value: user.uid }
          ]
        },
        onSuccess: async (transaction: any) => {
          try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
              subscriptionStatus: 'premium',
              subscriptionExpiry: Date.now() + (30 * 24 * 60 * 60 * 1000) // +30 Days
            });
            window.location.reload(); 
          } catch (error) {
            console.error("Error updating profile", error);
          }
        },
        onCancel: () => {
          setLoading(false);
        }
      });
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Error initializing payment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handlePayment}
      disabled={loading}
      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 active:scale-95"
    >
      {loading ? "Processing..." : "Upgrade to Premium (₦2,000)"}
    </button>
  );
}