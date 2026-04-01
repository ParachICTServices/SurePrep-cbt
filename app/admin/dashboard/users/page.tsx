"use client";
import { useEffect, useState } from "react";
import { Users, Search, Coins, Plus, Loader2, X, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner"; 
import { apiClient } from "@/app/lib/api/apiClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    userId: string | null;
    userName: string | null;
  }>({
    isOpen: false,
    userId: null,
    userName: null
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response: any = await apiClient.get('/users/admin?limit=100');
        const data = Array.isArray(response) ? response : (response.data || response.results || []);
        setUsers(data);
      } catch (e) {
        console.error("Error fetching users", e);
        toast.error("Failed to load users from server.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const openDeleteModal = (userId: string, userName: string) => {
    setConfirmDialog({ isOpen: true, userId, userName });
  };

  const closeDeleteModal = () => {
    setConfirmDialog({ isOpen: false, userId: null, userName: null });
  };

  const executeDelete = async () => {
    if (!confirmDialog.userId) return;

    setUpdating(true);
    try {
      await apiClient.delete(`/users/admin/${confirmDialog.userId}`);
      
      setUsers(prev => prev.filter(u => (u.id || u._id) !== confirmDialog.userId));
      if (selectedUser && (selectedUser.id || selectedUser._id) === confirmDialog.userId) {
        setSelectedUser(null);
      }
      
      toast.success("User deleted successfully");
      closeDeleteModal();
    } catch (e) {
      console.error("Delete error:", e);
      toast.error("Failed to delete user. Check server permissions.");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddCredits = async (u: any, amount: number) => {
    const userId = u.id || u._id;
    setUpdating(true);
    try {
      await apiClient.patch(`/users/admin/${userId}/credits`, { amount });
      
      setUsers(prev => prev.map(x => (x.id || x._id) === userId ? { ...x, credits: (x.credits || 0) + amount } : x));
      
      if (selectedUser && (selectedUser.id || selectedUser._id) === userId) {
        setSelectedUser({ ...selectedUser, credits: (selectedUser.credits || 0) + amount });
      }
      
      toast.success("Credits updated successfully");
    } catch (e) {
      toast.error("Failed to update credits");
    } finally {
      setUpdating(false);
    }
  };

  const displayed = users.filter(u => 
    u.displayName?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Wallets</h1>
          <p className="text-slate-500">Manage student credits and account levels.</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl text-center min-w-[100px]">
           <p className="text-xs text-emerald-600 font-bold uppercase">Total Users</p>
           <p className="text-xl font-black text-emerald-700">{users.length}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" placeholder="Search by name or email..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4 text-center">Wallet Balance</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
                <tr>
                    <td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-600" /></td>
                </tr>
            ) : displayed.map(u => (
              <tr key={u.id || u._id} className="hover:bg-slate-50 group transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                      {(u.displayName || u.email || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{u.displayName || "Anonymous"}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded capitalize font-medium">{u.examCategory || "senior"}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full font-bold text-amber-700">
                    <Coins size={14} /> {u.credits || 0}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button 
                        onClick={() => setSelectedUser(u)}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition"
                    >
                        Manage
                    </button>
                    <button 
                        onClick={() => openDeleteModal(u.id || u._id, u.displayName || u.email)}
                        className="p-2 text-slate-300 hover:text-red-600 transition"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: Wallet Management */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedUser.displayName}</h2>
                  <p className="text-slate-500 text-sm">Wallet & Settings</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition"><X size={20}/></button>
              </div>

              <div className="bg-amber-50 rounded-2xl p-6 text-center border border-amber-100 mb-8 shadow-inner">
                <p className="text-amber-600 text-[10px] font-black uppercase tracking-widest mb-1">Current Balance</p>
                <div className="flex items-center justify-center gap-2 text-4xl font-black text-amber-900">
                  <Coins size={32} /> {selectedUser.credits || 0}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                    <p className="text-sm font-bold text-slate-700 mb-3">Add Credits</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleAddCredits(selectedUser, 50)} disabled={updating} className="flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition">
                            <Plus size={18} /> Add 50
                        </button>
                        <button onClick={() => handleAddCredits(selectedUser, 100)} disabled={updating} className="flex items-center justify-center gap-2 py-3 bg-emerald-900 text-white rounded-xl font-bold hover:bg-black disabled:opacity-50 transition">
                            <Plus size={18} /> Add 100
                        </button>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                    <p className="text-sm font-bold text-slate-700 mb-3">Danger Zone</p>
                    <button 
                        onClick={() => openDeleteModal(selectedUser.id || selectedUser._id, selectedUser.displayName || selectedUser.email)}
                        disabled={updating}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold hover:bg-red-600 hover:text-white transition disabled:opacity-50"
                    >
                        <Trash2 size={18} /> Delete Account
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Custom Delete Confirmation */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
                <AlertTriangle className="text-red-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Deletion</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                Are you sure you want to delete <span className="font-bold text-slate-900">"{confirmDialog.userName}"</span>? 
                This will permanently remove their wallet and data.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={executeDelete}
                  disabled={updating}
                  className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition flex items-center justify-center gap-2"
                >
                  {updating ? <Loader2 className="animate-spin" /> : "Yes, Delete User"}
                </button>
                <button
                  onClick={closeDeleteModal}
                  disabled={updating}
                  className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}