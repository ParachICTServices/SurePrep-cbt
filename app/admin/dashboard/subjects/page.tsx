"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "sonner";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import {
  Loader2, Edit2, Trash2, X, Save, LayoutGrid, AlertTriangle, Palette, Plus,
} from "lucide-react";
import {
  DEFAULT_SUBJECT_HEX,
  normalizeSubjectHex,
  subjectColorToCss,
  subjectSwatchProps,
  topicsToApiPayload,
  type TopicRow,
} from "@/app/lib/subjectColor";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://cbt.excelpracticehub.com/api"
).replace(/\/$/, "");

const defaultTopicRow = (): TopicRow => ({ id: "", name: "", cost: "500" });

interface Subject {
  id: string;
  name: string;
  color: string;
  category?: string;
  createdAt?: string;
  questionCount?: number;
}

type SubjectCategory = "sciences" | "arts" | "commercial" | "general";

export default function SubjectsManager() {
  const { loading: authLoading } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editForm, setEditForm] = useState({ name: "", colorHex: DEFAULT_SUBJECT_HEX });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    colorHex: DEFAULT_SUBJECT_HEX,
    category: "general" as SubjectCategory,
    topics: [defaultTopicRow()],
  });
  const [creating, setCreating] = useState(false);

  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    subjectId: string | null;
    subjectName: string;
    questionCount: number;
  }>({ isOpen: false, subjectId: null, subjectName: "", questionCount: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      try {
        const sRes = await fetch(`${API_BASE_URL}/subjects`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const sRaw = await sRes.json();
        const sData = Array.isArray(sRaw) ? sRaw : (sRaw.data || []);
        
        const formatted = sData.map((s: any) => ({
            id: s.id || s._id,
            name: s.name,
            color: s.color,
            category: s.category,
            createdAt: s.createdAt,
            questionCount: s.questionCount ?? 0,
        }));

        setSubjects(formatted);

        const counts: Record<string, number> = {};
        let needsCountFetch = false;

        formatted.forEach((sub: Subject) => {
          if (typeof sub.questionCount === 'number') {
            counts[sub.id] = sub.questionCount;
          } else {
            needsCountFetch = true;
          }
        });

        if (needsCountFetch) {
          await Promise.all(
            formatted.map(async (sub: Subject) => {
              if (counts[sub.id] !== undefined) return;
              try {
                const qRes = await fetch(`${API_BASE_URL}/questions?subjectId=${sub.id}&limit=1`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                const qData = await qRes.json();
                counts[sub.id] = qData.total || qData.count || 0;
              } catch {
                counts[sub.id] = 0;
              }
            })
          );
        }

        setQuestionCounts(counts);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) fetchData();
  }, [authLoading]);

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    const c = subject.color?.trim() || "";
    setEditForm({
      name: subject.name,
      colorHex: c.startsWith("#") ? c : subjectColorToCss(subject.color),
    });
  };

  const handleCreateSubject = async () => {
    if (!addForm.name.trim()) {
      toast.error("Subject name is required");
      return;
    }
    const topicsPayload = topicsToApiPayload(addForm.topics);
    if (topicsPayload.length === 0) {
      toast.error("Add at least one topic with a name.");
      return;
    }
    const token = localStorage.getItem("auth_token");
    if (!token) {
      toast.error("You are not signed in. Please open the admin login again.");
      return;
    }
    setCreating(true);
    try {
      const color = normalizeSubjectHex(addForm.colorHex);
      const response = await fetch(`${API_BASE_URL}/subjects/admin`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: addForm.name.trim(),
          color,
          category: addForm.category,
          topics: topicsPayload,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(typeof err?.message === "string" ? err.message : "Create failed");
      }
      const raw = await response.json();
      const newSub = raw?.data ?? raw;
      const id = newSub.id || newSub._id;
      if (!id) throw new Error("Invalid response");
      const createdColor = typeof newSub.color === "string" ? newSub.color : color;
      const created: Subject = {
        id,
        name: addForm.name.trim(),
        color: createdColor,
        category: addForm.category,
        questionCount: 0,
      };
      setSubjects((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setQuestionCounts((prev) => ({ ...prev, [id]: 0 }));
      toast.success(`Subject "${created.name}" created`);
      setShowAddModal(false);
      setAddForm({
        name: "",
        colorHex: DEFAULT_SUBJECT_HEX,
        category: "general",
        topics: [defaultTopicRow()],
      });
    } catch (error) {
      console.error("Error creating subject:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create subject");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingSubject) return;
    setSaving(true);
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch(`${API_BASE_URL}/subjects/admin/${editingSubject.id}`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          color: normalizeSubjectHex(editForm.colorHex),
        })
      });

      if (!response.ok) throw new Error("Update failed");

      const nextColor = normalizeSubjectHex(editForm.colorHex);
      setSubjects(prev =>
        prev.map(s =>
          s.id === editingSubject.id ? { ...s, name: editForm.name.trim(), color: nextColor } : s
        )
      );
      toast.success("Subject updated successfully!");
      setEditingSubject(null);
    } catch (error) {
      console.error("Error updating subject:", error);
      toast.error("Failed to update subject");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (subject: Subject) => {
    setConfirmDialog({
      isOpen: true,
      subjectId: subject.id,
      subjectName: subject.name,
      questionCount: questionCounts[subject.id] ?? 0,
    });
  };
  
  const handleConfirmDelete = async () => {
    const subjectId = confirmDialog.subjectId;
    if (!subjectId) return;

    setDeleting(true);
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch(`${API_BASE_URL}/subjects/admin/${subjectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Deletion failed");

      setSubjects(prev => prev.filter(s => s.id !== subjectId));
      setQuestionCounts(prev => {
        const next = { ...prev };
        delete next[subjectId];
        return next;
      });

      toast.success("Subject deleted successfully.");
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast.error("Failed to delete subject. Please try again.");
    } finally {
      setDeleting(false);
      setConfirmDialog({ isOpen: false, subjectId: null, subjectName: "", questionCount: 0 });
    }
  };

  if (loading || authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Subjects</h1>
          <p className="text-slate-500 dark:text-slate-400">View and edit all exam subjects.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Total: <strong className="text-slate-900 dark:text-white">{subjects.length}</strong> subjects
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus size={18} />
            Add subject
          </button>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.length === 0 ? (
          <div className="col-span-3 bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
            <LayoutGrid className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
            <p className="text-slate-500 dark:text-slate-400">No subjects found.</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 mb-6">Create your first subject to get started.</p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition"
            >
              <Plus size={18} />
              Add subject
            </button>
          </div>
        ) : (
          subjects.map((subject) => (
            <div
              key={subject.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div {...subjectSwatchProps(subject.color)}>
                  <LayoutGrid size={24} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(subject)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit Subject"><Edit2 size={18} /></button>
                  <button onClick={() => handleDeleteClick(subject)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete Subject"><Trash2 size={18} /></button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 capitalize mb-1">{subject.name}</h3>
              <p className="text-sm text-slate-400">
                {questionCounts[subject.id] ?? 0} question{(questionCounts[subject.id] ?? 0) !== 1 ? "s" : ""}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">ID: {subject.id}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Subject Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 border border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add subject</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition text-slate-700 dark:text-slate-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subject name *</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Mathematics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
                <select
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  value={addForm.category}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, category: e.target.value as SubjectCategory }))
                  }
                >
                  <option value="general">General</option>
                  <option value="sciences">Sciences</option>
                  <option value="arts">Arts</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Palette size={16} /> Color (hex)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="color"
                    value={normalizeSubjectHex(addForm.colorHex)}
                    onChange={(e) => setAddForm((f) => ({ ...f, colorHex: e.target.value }))}
                    className="h-12 w-14 cursor-pointer rounded-lg border border-slate-300 dark:border-slate-600 p-1 bg-slate-50 dark:bg-slate-900"
                    aria-label="Subject color"
                  />
                  <input
                    type="text"
                    value={addForm.colorHex}
                    onChange={(e) => {
                      let v = e.target.value.trim();
                      if (v && !v.startsWith("#")) v = `#${v}`;
                      setAddForm((f) => ({ ...f, colorHex: v }));
                    }}
                    className="flex-1 min-w-[8rem] p-3 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    placeholder="#6366f1"
                    spellCheck={false}
                    maxLength={7}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Topics <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setAddForm((f) => ({ ...f, topics: [...f.topics, { id: "", name: "", cost: "0" }] }))
                    }
                    className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Plus size={16} /> Add topic
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Each topic needs a name and cost. Topic ID is optional (UUID).
                </p>
                <div className="space-y-3">
                  {addForm.topics.map((row, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50"
                    >
                      <div className="md:col-span-4">
                        <label className="text-xs text-slate-500 mb-1 block">Name</label>
                        <input
                          type="text"
                          className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                          placeholder="Algebra"
                          value={row.name}
                          onChange={(e) => {
                            const next = [...addForm.topics];
                            next[idx] = { ...next[idx], name: e.target.value };
                            setAddForm((f) => ({ ...f, topics: next }));
                          }}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-xs text-slate-500 mb-1 block">Cost</label>
                        <input
                          type="number"
                          min={0}
                          className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                          value={row.cost}
                          onChange={(e) => {
                            const next = [...addForm.topics];
                            next[idx] = { ...next[idx], cost: e.target.value };
                            setAddForm((f) => ({ ...f, topics: next }));
                          }}
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="text-xs text-slate-500 mb-1 block">Topic ID (optional)</label>
                        <input
                          type="text"
                          className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                          placeholder="UUID"
                          value={row.id}
                          onChange={(e) => {
                            const next = [...addForm.topics];
                            next[idx] = { ...next[idx], id: e.target.value };
                            setAddForm((f) => ({ ...f, topics: next }));
                          }}
                        />
                      </div>
                      <div className="md:col-span-1 flex justify-end pb-1">
                        <button
                          type="button"
                          disabled={addForm.topics.length <= 1}
                          onClick={() =>
                            setAddForm((f) => ({ ...f, topics: f.topics.filter((_, i) => i !== idx) }))
                          }
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg disabled:opacity-30 disabled:pointer-events-none"
                          title="Remove topic"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateSubject}
                  disabled={
                    creating ||
                    !addForm.name.trim() ||
                    topicsToApiPayload(addForm.topics).length === 0
                  }
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {creating ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                  {creating ? "Creating…" : "Create subject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Edit Subject</h2>
              <button onClick={() => setEditingSubject(null)} className="p-2 hover:bg-slate-100 rounded-lg transition"><X size={24} /></button>
            </div>

            {(questionCounts[editingSubject.id] ?? 0) > 0 && (
              <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-bold text-amber-900">Notice</p>
                  <p className="text-sm text-amber-800 mt-1">This subject has {questionCounts[editingSubject.id]} question(s).</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject ID</label>
                <input type="text" value={editingSubject.id} disabled className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject Name</label>
                <input type="text" className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Palette size={16} /> Color (hex)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="color"
                    value={normalizeSubjectHex(editForm.colorHex)}
                    onChange={(e) => setEditForm((f) => ({ ...f, colorHex: e.target.value }))}
                    className="h-12 w-14 cursor-pointer rounded-lg border border-slate-300 p-1 bg-slate-50"
                    aria-label="Subject color"
                  />
                  <input
                    type="text"
                    value={editForm.colorHex}
                    onChange={(e) => {
                      let v = e.target.value.trim();
                      if (v && !v.startsWith("#")) v = `#${v}`;
                      setEditForm((f) => ({ ...f, colorHex: v }));
                    }}
                    className="flex-1 min-w-[8rem] p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                    placeholder="#6366f1"
                    spellCheck={false}
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setEditingSubject(null)} className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition">Cancel</button>
                <button onClick={handleSaveEdit} disabled={saving || !editForm.name.trim()} className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={`Delete "${confirmDialog.subjectName}"?`}
        message={`This will permanently delete the subject. Associated questions may also be affected depending on server configuration.`}
        confirmText={deleting ? "Deleting…" : "Delete Subject"}
        cancelText="Cancel"
        isDangerous
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, subjectId: null, subjectName: "", questionCount: 0 })}
      />
    </div>
  );
}