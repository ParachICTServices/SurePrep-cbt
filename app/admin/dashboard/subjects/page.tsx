"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, getCountFromServer, where } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { 
  Loader2, 
  Edit2, 
  Trash2, 
  X, 
  Save,
  LayoutGrid,
  AlertTriangle,
  Palette
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
  color: string;
  createdAt?: any;
}

export default function SubjectsManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Modal
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    color: ""
  });
  const [saving, setSaving] = useState(false);

  // Question count per subject
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});

  // Available color options
  const colorOptions = [
    { value: "bg-blue-100 text-blue-600", label: "Blue", preview: "bg-blue-100" },
    { value: "bg-emerald-100 text-emerald-600", label: "Green", preview: "bg-emerald-100" },
    { value: "bg-orange-100 text-orange-600", label: "Orange", preview: "bg-orange-100" },
    { value: "bg-purple-100 text-purple-600", label: "Purple", preview: "bg-purple-100" },
    { value: "bg-pink-100 text-pink-600", label: "Pink", preview: "bg-pink-100" },
    { value: "bg-red-100 text-red-600", label: "Red", preview: "bg-red-100" },
    { value: "bg-yellow-100 text-yellow-600", label: "Yellow", preview: "bg-yellow-100" },
    { value: "bg-indigo-100 text-indigo-600", label: "Indigo", preview: "bg-indigo-100" },
    { value: "bg-teal-100 text-teal-600", label: "Teal", preview: "bg-teal-100" },
    { value: "bg-slate-100 text-slate-600", label: "Gray", preview: "bg-slate-100" },
  ];

  // 1. Fetch Subjects
useEffect(() => {
  const fetchData = async () => {
    try {
      // 🔧 FIX: Don't use orderBy to avoid missing documents
      const sSnap = await getDocs(collection(db, "subjects"));
      
      const sData = sSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Subject));
      
      // Sort manually instead (handles missing createdAt gracefully)
      sData.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA; // Newest first
      });
      
      setSubjects(sData);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

  // 2. Open Edit Modal
  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setEditForm({
      name: subject.name,
      color: subject.color
    });
  };

  // 3. Save Edit
  const handleSaveEdit = async () => {
    if (!editingSubject) return;
    setSaving(true);

    try {
      const subjectRef = doc(db, "subjects", editingSubject.id);
      await updateDoc(subjectRef, {
        name: editForm.name,
        color: editForm.color,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setSubjects(prev => prev.map(s => 
        s.id === editingSubject.id 
          ? { ...s, name: editForm.name, color: editForm.color }
          : s
      ));

      alert("Subject updated successfully!");
      setEditingSubject(null);
    } catch (error) {
      console.error("Error updating subject:", error);
      alert("Failed to update subject");
    } finally {
      setSaving(false);
    }
  };

  // 4. Delete Subject
  const handleDelete = async (subjectId: string) => {
    const questionCount = questionCounts[subjectId] || 0;
    
    if (questionCount > 0) {
      if (!confirm(
        `Warning: This subject has ${questionCount} question(s) associated with it. ` +
        `Deleting this subject will NOT delete the questions, but they will become orphaned. ` +
        `Are you sure you want to continue?`
      )) return;
    } else {
      if (!confirm("Are you sure you want to delete this subject?")) return;
    }

    try {
      await deleteDoc(doc(db, "subjects", subjectId));
      setSubjects(prev => prev.filter(s => s.id !== subjectId));
      alert("Subject deleted successfully!");
    } catch (error) {
      console.error("Error deleting subject:", error);
      alert("Failed to delete subject");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Subjects</h1>
          <p className="text-slate-500">View and edit all exam subjects.</p>
        </div>
        <div className="bg-slate-100 px-4 py-2 rounded-lg">
          <p className="text-sm text-slate-600">
            Total: <strong className="text-slate-900">{subjects.length}</strong> subjects
          </p>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.length === 0 ? (
          <div className="col-span-3 bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <LayoutGrid className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500">No subjects found.</p>
            <p className="text-sm text-slate-400 mt-2">Use the Content Manager to create subjects.</p>
          </div>
        ) : (
          subjects.map((subject) => (
            <div 
              key={subject.id} 
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
            >
              {/* Subject Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${subject.color}`}>
                  <LayoutGrid size={24} />
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(subject)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Subject"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(subject.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Subject"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Subject Details */}
              <h3 className="text-xl font-bold text-slate-900 capitalize mb-2">
                {subject.name}
              </h3>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-sm text-slate-500">Questions</span>
                <span className="text-lg font-bold text-slate-900">
                  {questionCounts[subject.id] || 0}
                </span>
              </div>

              {/* Subject ID */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">ID: {subject.id}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Edit Subject</h2>
              <button
                onClick={() => setEditingSubject(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Warning if subject has questions */}
            {questionCounts[editingSubject.id] > 0 && (
              <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-bold text-amber-900">Notice</p>
                  <p className="text-sm text-amber-800 mt-1">
                    This subject has {questionCounts[editingSubject.id]} question(s). 
                    Changing the subject name will not affect existing questions.
                  </p>
                </div>
              </div>
            )}

            {/* Edit Form */}
            <div className="space-y-6">
              
              {/* Subject ID (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject ID</label>
                <input
                  type="text"
                  value={editingSubject.id}
                  disabled
                  className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-500"
                />
                <p className="text-xs text-slate-400 mt-1">Cannot be changed</p>
              </div>

              {/* Subject Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject Name</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g., Mathematics, English, Physics"
                />
              </div>

              {/* Color Theme */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <Palette size={16} />
                  Color Theme
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {colorOptions.map((colorOption) => (
                    <button
                      key={colorOption.value}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, color: colorOption.value })}
                      className={`h-12 rounded-xl border-2 transition-all ${
                        editForm.color === colorOption.value
                          ? 'border-slate-900 ring-2 ring-slate-900 ring-offset-2'
                          : 'border-slate-200 hover:border-slate-300'
                      } ${colorOption.preview}`}
                      title={colorOption.label}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Selected: <span className="font-bold capitalize">
                    {colorOptions.find(c => c.value === editForm.color)?.label || "Custom"}
                  </span>
                </p>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Preview</label>
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <div className={`p-3 rounded-xl inline-flex ${editForm.color}`}>
                    <LayoutGrid size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 capitalize mt-3">
                    {editForm.name || "Subject Name"}
                  </h3>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEditingSubject(null)}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving || !editForm.name.trim()}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}