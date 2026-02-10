"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { 
  Loader2, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Save,
  Filter,
  BookOpen,
  CheckCircle
} from "lucide-react";

interface Question {
  id: string;
  subject: string;
  questionText: string;
  options: string[];
  correctOption: number;
  explanation?: string;
  createdAt?: any;
  createdBy?: string;
}

export default function QuestionBank() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  
  // Edit Modal
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editForm, setEditForm] = useState({
    questionText: "",
    options: ["", "", "", ""],
    correctOption: 0,
    explanation: ""
  });
  const [saving, setSaving] = useState(false);

  // 1. Fetch Questions & Subjects
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Questions
        const qQuery = query(collection(db, "questions"), orderBy("createdAt", "desc"));
        const qSnap = await getDocs(qQuery);
        const qData = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
        setQuestions(qData);

        // Fetch Subjects for filter dropdown
        const sSnap = await getDocs(collection(db, "subjects"));
        const sData = sSnap.docs.map(doc => doc.data());
        setSubjects(sData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Filter Questions
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === "all" || q.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

  // 3. Open Edit Modal
  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setEditForm({
      questionText: question.questionText,
      options: [...question.options],
      correctOption: question.correctOption,
      explanation: question.explanation || ""
    });
  };

  // 4. Save Edit
  const handleSaveEdit = async () => {
    if (!editingQuestion) return;
    setSaving(true);

    try {
      const questionRef = doc(db, "questions", editingQuestion.id);
      await updateDoc(questionRef, {
        questionText: editForm.questionText,
        options: editForm.options,
        correctOption: editForm.correctOption,
        explanation: editForm.explanation,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setQuestions(prev => prev.map(q => 
        q.id === editingQuestion.id 
          ? { ...q, ...editForm }
          : q
      ));

      alert("Question updated successfully!");
      setEditingQuestion(null);
    } catch (error) {
      console.error("Error updating question:", error);
      alert("Failed to update question");
    } finally {
      setSaving(false);
    }
  };

  // 5. Delete Question
  const handleDelete = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question? This action cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, "questions", questionId));
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      alert("Question deleted successfully!");
    } catch (error) {
      console.error("Error deleting question:", error);
      alert("Failed to delete question");
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
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Question Bank</h1>
          <p className="text-slate-500">View and manage all questions in the database.</p>
        </div>
        <div className="bg-slate-100 px-4 py-2 rounded-lg">
          <p className="text-sm text-slate-600">
            Total: <strong className="text-slate-900">{questions.length}</strong> questions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search questions..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Subject Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <select
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 capitalize appearance-none bg-white"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
            >
              <option value="all">All Subjects</option>
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
        </div>

        {filterSubject !== "all" && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-500">Filtered by:</span>
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded capitalize">
              {subjects.find(s => s.id === filterSubject)?.name || filterSubject}
            </span>
            <button
              onClick={() => setFilterSubject("all")}
              className="text-xs text-slate-400 hover:text-slate-600 ml-1"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <BookOpen className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500">No questions found.</p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => (
            <div key={q.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded uppercase">
                      {q.subject}
                    </span>
                    <span className="text-slate-400 text-xs">#{idx + 1}</span>
                  </div>
                  <p className="text-lg font-medium text-slate-900">{q.questionText}</p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(q)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Question"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Question"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                {q.options.map((opt, optIdx) => (
                  <div
                    key={optIdx}
                    className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${
                      optIdx === q.correctOption
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      optIdx === q.correctOption ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-300'
                    }`}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    {opt}
                    {optIdx === q.correctOption && <CheckCircle size={14} className="ml-auto text-emerald-600" />}
                  </div>
                ))}
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <p className="text-xs font-bold text-blue-900 mb-1">Explanation:</p>
                  <p className="text-sm text-blue-800">{q.explanation}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Edit Question</h2>
              <button
                onClick={() => setEditingQuestion(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Edit Form */}
            <div className="space-y-6">
              
              {/* Subject (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={editingQuestion.subject}
                  disabled
                  className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-500 capitalize"
                />
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Question</label>
                <textarea
                  rows={3}
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={editForm.questionText}
                  onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                />
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Options</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {editForm.options.map((opt, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute left-3 top-3 text-slate-400 font-bold text-xs">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <input
                        type="text"
                        className={`w-full pl-8 p-3 border rounded-xl outline-none ${
                          editForm.correctOption === idx
                            ? 'border-emerald-500 bg-emerald-50 focus:ring-2 focus:ring-emerald-500'
                            : 'border-slate-300 focus:ring-2 focus:ring-slate-400'
                        }`}
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...editForm.options];
                          newOpts[idx] = e.target.value;
                          setEditForm({ ...editForm, options: newOpts });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Correct Answer */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Correct Answer</label>
                <div className="flex gap-2">
                  {editForm.options.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, correctOption: idx })}
                      className={`flex-1 py-2 rounded-lg font-bold border transition ${
                        editForm.correctOption === idx
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-300'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Explanation (Optional)</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={editForm.explanation}
                  onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2"
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