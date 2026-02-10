"use client";
import { useEffect, useState, useCallback } from "react";
import {
  collection, getDocs, query, orderBy, doc, updateDoc
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import {
  Users, Search, Crown, UserCheck, UserX,
  Loader2, X, Mail, Calendar, Shield,
  ChevronUp, ChevronDown, Filter
} from "lucide-react";

interface UserRow {
  id: string;
  displayName?: string;
  email?: string;
  subscriptionStatus?: string;
  createdAt?: any;
  lastLoginAt?: any;
  phoneNumber?: string;
}

type SortKey = "displayName" | "email" | "subscriptionStatus" | "createdAt";
type SortDir = "asc" | "desc";

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState<"all" | "premium" | "free">("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [updating, setUpdating] = useState(false);

  // Fetch 
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let q;
        try {
          q = query(collection(db, "users"), orderBy("createdAt", "desc"));
        } catch {
          q = query(collection(db, "users"));
        }
        const snap = await getDocs(q);
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserRow)));
      } catch (e) {
        console.error("Error fetching users", e);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Helpers
  const formatDate = (val: any): string => {
    if (!val) return "—";
    try {
      if (val?.seconds) return new Date(val.seconds * 1000).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
      return new Date(val).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
    } catch { return "—"; }
  };

  const initials = (u: UserRow) =>
    ((u.displayName || u.email || "?")[0]).toUpperCase();

  // Sort 
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  // Filter + Sort
  const displayed = users
    .filter(u => {
      const term = search.toLowerCase();
      const matchSearch =
        !term ||
        u.displayName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.id.toLowerCase().includes(term);
      const matchPlan =
        filterPlan === "all" ||
        (filterPlan === "premium" && u.subscriptionStatus === "premium") ||
        (filterPlan === "free" && u.subscriptionStatus !== "premium");
      return matchSearch && matchPlan;
    })
    .sort((a, b) => {
      let av: any = a[sortKey] ?? "";
      let bv: any = b[sortKey] ?? "";
      if (sortKey === "createdAt") {
        av = av?.seconds ?? 0;
        bv = bv?.seconds ?? 0;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  //Toggle premium
  const togglePremium = async (u: UserRow) => {
    setUpdating(true);
    const newStatus = u.subscriptionStatus === "premium" ? "free" : "premium";
    try {
      await updateDoc(doc(db, "users", u.id), { subscriptionStatus: newStatus });
      const update = (prev: UserRow[]) =>
        prev.map(x => x.id === u.id ? { ...x, subscriptionStatus: newStatus } : x);
      setUsers(update);
      if (selectedUser?.id === u.id)
        setSelectedUser(prev => prev ? { ...prev, subscriptionStatus: newStatus } : null);
    } catch (e) {
      console.error(e);
      alert("Failed to update subscription.");
    } finally {
      setUpdating(false);
    }
  };

  // Sort icon
  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? (sortDir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)
      : <ChevronDown size={13} className="opacity-30" />;

  const premiumCount = users.filter(u => u.subscriptionStatus === "premium").length;

  // Render
  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 py-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            {users.length} total · {premiumCount} premium
          </p>
        </div>

        {/* Summary*/}
        <div className="flex gap-2 flex-wrap">
          <span className="bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Users size={12} /> {users.length} Total
          </span>
          <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Crown size={12} /> {premiumCount} Premium
          </span>
          <span className="bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <UserCheck size={12} /> {users.length - premiumCount} Free
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or ID…"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Plan filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white appearance-none min-w-[140px]"
            value={filterPlan}
            onChange={e => setFilterPlan(e.target.value as any)}
          >
            <option value="all">All Plans</option>
            <option value="premium">Premium Only</option>
            <option value="free">Free Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-emerald-600" size={36} />
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="mx-auto text-slate-200 mb-3" size={40} />
            <p className="text-slate-400 font-medium">No users found.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {([
                      ["displayName", "Name"],
                      ["email", "Email"],
                      ["subscriptionStatus", "Plan"],
                      ["createdAt", "Joined"],
                    ] as [SortKey, string][]).map(([k, label]) => (
                      <th
                        key={k}
                        onClick={() => handleSort(k)}
                        className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider cursor-pointer hover:text-slate-800 select-none"
                      >
                        <span className="flex items-center gap-1">
                          {label} <SortIcon k={k} />
                        </span>
                      </th>
                    ))}
                    <th className="px-5 py-3.5 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayed.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold text-xs flex-shrink-0">
                            {initials(u)}
                          </div>
                          <span className="font-medium text-slate-900 truncate max-w-[160px]">
                            {u.displayName || <span className="text-slate-400 italic">No name</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500 truncate max-w-[200px]">{u.email || "—"}</td>
                      <td className="px-5 py-4">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full
                          ${u.subscriptionStatus === "premium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-500"}`}>
                          {u.subscriptionStatus === "premium" ? "✦ Premium" : "Free"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                          >
                            View
                          </button>
                          <button
                            onClick={() => togglePremium(u)}
                            disabled={updating}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition
                              ${u.subscriptionStatus === "premium"
                                ? "text-red-600 bg-red-50 hover:bg-red-100"
                                : "text-amber-700 bg-amber-50 hover:bg-amber-100"}`}
                          >
                            {u.subscriptionStatus === "premium" ? "Revoke" : "Make Premium"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {displayed.map(u => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold text-sm flex-shrink-0">
                    {initials(u)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {u.displayName || <span className="text-slate-400 italic">No name</span>}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full
                      ${u.subscriptionStatus === "premium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-500"}`}>
                      {u.subscriptionStatus === "premium" ? "Premium" : "Free"}
                    </span>
                    <button onClick={() => setSelectedUser(u)} className="text-xs text-slate-500 underline">
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
              Showing {displayed.length} of {users.length} users
            </div>
          </>
        )}
      </div>

      {/* User Detail*/}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">

            {/* Modal header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-7 py-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white text-2xl font-bold">
                  {initials(selectedUser)}
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">
                    {selectedUser.displayName || "No Name"}
                  </h2>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block
                    ${selectedUser.subscriptionStatus === "premium"
                      ? "bg-amber-400 text-amber-900"
                      : "bg-white/20 text-white/70"}`}>
                    {selectedUser.subscriptionStatus === "premium" ? "✦ Premium" : "Free"}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-white/60 hover:text-white p-1 transition">
                <X size={22} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-7 space-y-4">
              <DetailRow icon={<Mail size={15} />} label="Email" value={selectedUser.email || "—"} />
              <DetailRow icon={<Calendar size={15} />} label="Joined" value={formatDate(selectedUser.createdAt)} />
              <DetailRow icon={<Shield size={15} />} label="User ID" value={selectedUser.id} mono />
              <DetailRow
                icon={<Crown size={15} />}
                label="Plan"
                value={selectedUser.subscriptionStatus === "premium" ? "Premium Scholar" : "Free Starter"}
              />
            </div>

            {/* Modal actions */}
            <div className="px-7 pb-7 flex gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition text-sm"
              >
                Close
              </button>
              <button
                onClick={() => togglePremium(selectedUser)}
                disabled={updating}
                className={`flex-1 py-3 rounded-xl font-bold transition text-sm flex items-center justify-center gap-2
                  ${selectedUser.subscriptionStatus === "premium"
                    ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                    : "bg-amber-500 text-white hover:bg-amber-600"}`}
              >
                {updating
                  ? <Loader2 size={16} className="animate-spin" />
                  : selectedUser.subscriptionStatus === "premium"
                    ? <><UserX size={16} /> Revoke Premium</>
                    : <><Crown size={16} /> Grant Premium</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
      <span className="text-slate-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
        <p className={`text-sm text-slate-900 font-semibold truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
      </div>
    </div>
  );
}