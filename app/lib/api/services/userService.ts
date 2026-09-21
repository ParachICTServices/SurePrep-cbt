import { auth } from "@/app/lib/firebase";
import {
  FIRESTORE_COLLECTIONS,
  changeUserCredits,
  getCurrentUserProfile,
  listRecords,
  saveUserProfile,
} from "@/app/lib/firebaseData";
import { User, CreditTransaction } from '@/app/type'; 

export const userService = {
  
  async getProfile(): Promise<User> {
    return getCurrentUserProfile();
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("You must be signed in.");
    return saveUserProfile(uid, data);
  },


  async getCredits(): Promise<{ credits: number; totalCreditsEarned: number }> {
    const user = await getCurrentUserProfile();
    return {
      credits: user.credits,
      totalCreditsEarned: user.totalCreditsEarned
    };
  },

  
  async verifyPayment(reference: string, packageId: string): Promise<any> {
    throw new Error("Payment verification requires a trusted server function.");
  },


  async deductCredits(amount: number): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("You must be signed in.");
    await changeUserCredits(uid, -amount);
  },


  async getCreditTransactions(): Promise<CreditTransaction[]> {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    const transactions = await listRecords(FIRESTORE_COLLECTIONS.creditTransactions);
    return transactions.filter((transaction) => transaction.userId === uid) as CreditTransaction[];
  },
  
  
  async getDashboardSummary(): Promise<any> {
    const user = await getCurrentUserProfile();
    const transactions = await this.getCreditTransactions();
    return { user, credits: user.credits, totalCreditsEarned: user.totalCreditsEarned, transactions };
  }
};