"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { toast } from "sonner";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { MathText } from "@/app/components/MathText";
import { 
  Loader2, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Save,
  Filter,
  BookOpen,
  CheckCircle,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckSquare,
  Square,
  Trash
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

interface Question {
  id: string;
  subjectId: string;
  subject?: { name: string };
  questionText: string;
  options: string[];
  correctOption: number;
  explanation?: string;
  imageURL?: string;
  createdAt?: string;
}

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 28 } },
  exit: { opacity: 0, y: -16, scale: 0.97, transition: { duration: 0.18 } }
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 30 } },
  exit: { opacity: 0, scale: 0.94, y: 20, transition: { duration: 0.18 } }
};

export default function QuestionBank() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editForm, setEditForm] = useState({
    questionText: "",
    options: ["", "", "", ""],
    correctOption: 0,
    explanation: ""
  });
  const [saving, setSaving] = useState(false);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    questionId: string | null;
    isBulk?: boolean;
  }>({
    isOpen: false,
    questionId: null,
    isBulk: false
  });


  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('auth_token');
      try {
        const sRes = await fetch(`${API_BASE_URL}/subjects`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const sData = await sRes.json();
        const subjectsArray = Array.isArray(sData) ? sData : (sData.data || []);
        setSubjects(subjectsArray);

        
        const qRes = await fetch(`${API_BASE_URL}/questions/admin?limit=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const qData = await qRes.json();
        const questionsArray = Array.isArray(qData) ? qData : (qData.data || qData.results || []);
        
        setQuestions(questionsArray.map((q: any) => ({
            id: q.id || q._id,
            subject: q.subject?.name || q.subjectId,
            ...q
        })));

      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load questions.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterSubject, itemsPerPage]);
  useEffect(() => { setSelectedQuestions(new Set()); }, [searchTerm, filterSubject, currentPage, itemsPerPage]);

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase());
const matchesSubject = filterSubject === "all" || q.subjectId === filterSubject;
    return matchesSearch && matchesSubject;
  });

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedQuestions = filteredQuestions.slice(startIdx, startIdx + itemsPerPage);

  const goToPage = (page: number) => { setCurrentPage(Math.max(1, Math.min(page, totalPages))); };

  const getPageNumbers = (): (number | "...")[] => {
    const delta = 2;
    const range: (number | "...")[] = [];
    const left = safeCurrentPage - delta;
    const right = safeCurrentPage + delta;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) range.push(i);
      else if (range[range.length - 1] !== "...") range.push("...");
    }
    return range;
  };

  const toggleSelectQuestion = (questionId: string) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) newSet.delete(questionId);
      else newSet.add(questionId);
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedQuestions.size === paginatedQuestions.length) {
      setSelectedQuestions(prev => {
        const newSet = new Set(prev);
        paginatedQuestions.forEach(q => newSet.delete(q.id));
        return newSet;
      });
    } else {
      setSelectedQuestions(prev => {
        const newSet = new Set(prev);
        paginatedQuestions.forEach(q => newSet.add(q.id));
        return newSet;
      });
    }
  };

  const clearSelection = () => setSelectedQuestions(new Set());
  const allCurrentPageSelected = paginatedQuestions.length > 0 && paginatedQuestions.every(q => selectedQuestions.has(q.id));

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setEditForm({
      questionText: question.questionText,
      options: [...question.options],
      correctOption: question.correctOption,
      explanation: question.explanation || ""
    });
  };

  const handleSaveEdit = async () => {
    if (!editingQuestion) return;
    setSaving(true);
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch(`${API_BASE_URL}/questions/admin/${editingQuestion.id}`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) throw new Error("Update failed");

      setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? { ...q, ...editForm } : q));
      toast.success("Question updated!");
      setEditingQuestion(null);
    } catch (error) {
      toast.error("Failed to update question");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (questionId: string) => { setConfirmDialog({ isOpen: true, questionId, isBulk: false }); };
  const handleBulkDeleteClick = () => { setConfirmDialog({ isOpen: true, questionId: null, isBulk: true }); };

  const handleConfirmDelete = async () => {
    if (confirmDialog.isBulk) await handleBulkDelete();
    else {
      const questionId = confirmDialog.questionId;
      if (!questionId) return;
      const token = localStorage.getItem('auth_token');
      try {
        await fetch(`${API_BASE_URL}/questions/admin/${questionId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setQuestions(prev => prev.filter(q => q.id !== questionId));
        toast.success("Question deleted");
      } catch (error) {
        toast.error("Failed to delete");
      }
    }
    setConfirmDialog({ isOpen: false, questionId: null, isBulk: false });
  };

  const handleBulkDelete = async () => {
    if (selectedQuestions.size === 0) return;
    setBulkDeleteLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch(`${API_BASE_URL}/questions/admin/bulk-delete`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ids: Array.from(selectedQuestions) })
      });

      if (!response.ok) throw new Error("Bulk delete failed");

      setQuestions(prev => prev.filter(q => !selectedQuestions.has(q.id)));
      toast.success(`${selectedQuestions.size} questions deleted`);
      setSelectedQuestions(new Set());
    } catch (error) {
      toast.error("Failed to delete questions");
    } finally {
      setBulkDeleteLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Loader2 className="text-emerald-600" size={48} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div className="flex items-center justify-between" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Question Bank</h1>
          <p className="text-slate-500">View and manage all questions in the database.</p>
        </div>
        <motion.div className="bg-slate-100 px-4 py-2 rounded-lg" key={filteredQuestions.length} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <p className="text-sm text-slate-600">Total: <strong className="text-slate-900">{questions.length}</strong> questions</p>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {selectedQuestions.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -20, height: 0 }} className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><CheckSquare className="text-white" size={20} /><span className="text-white font-semibold">{selectedQuestions.size} selected</span></div>
              <div className="flex items-center gap-2">
                <button onClick={clearSelection} className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium">Clear</button>
                <button onClick={handleBulkDeleteClick} disabled={bulkDeleteLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium flex items-center gap-2">
                  {bulkDeleteLoading ? <Loader2 className="animate-spin" size={18} /> : <Trash size={18} />} Delete Selected
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input type="text" placeholder="Search questions..." className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
        <div className="relative"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <select className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl outline-none appearance-none bg-white" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
            <option value="all">All Subjects</option>
            {subjects.map(sub => <option key={sub.id || sub._id} value={sub.id || sub._id}>{sub.name}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {paginatedQuestions.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center"><BookOpen className="mx-auto text-slate-300 mb-4" size={48} /><p className="text-slate-500">No questions found.</p></div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm font-medium text-slate-700">{allCurrentPageSelected ? <CheckSquare className="text-emerald-600" size={20} /> : <Square className="text-slate-400" size={20} />} <span>{allCurrentPageSelected ? 'Deselect' : 'Select'} all on page</span></button>
            </div>
            <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="show">
              {paginatedQuestions.map((q, idx) => (
                <motion.div key={q.id} variants={cardVariants} className={`bg-white p-6 rounded-2xl border shadow-sm transition-all ${selectedQuestions.has(q.id) ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <button onClick={() => toggleSelectQuestion(q.id)} className="mt-1 flex-shrink-0">{selectedQuestions.has(q.id) ? <CheckSquare className="text-emerald-600" size={22} /> : <Square className="text-slate-400" size={22} />}</button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2"><span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded uppercase">{q.subject?.name}</span>{q.imageURL && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded flex items-center gap-1"><ImageIcon size={12} /> Image</span>}</div>
                        <MathText text={q.questionText} className="text-lg font-medium text-slate-900" />
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => handleEdit(q)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                      <button onClick={() => handleDeleteClick(q.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  {q.imageURL && <div className="mb-4 ml-9"><img src={q.imageURL} alt="Diagram" className="max-w-md w-full rounded-lg border-2 border-slate-200" /></div>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 ml-9">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${optIdx === q.correctOption ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${optIdx === q.correctOption ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-300'}`}>{String.fromCharCode(65 + optIdx)}</span>
                        <MathText text={opt} className="flex-1" />
                        {optIdx === q.correctOption && <CheckCircle size={14} className="ml-auto text-emerald-600" />}
                      </div>
                    ))}
                  </div>
                  {q.explanation && <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg ml-9"><p className="text-xs font-bold text-blue-900 mb-1">Explanation:</p><MathText text={q.explanation} className="text-sm text-blue-800" /></div>}
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </div>

      {filteredQuestions.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>Show</span>
            <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="border border-slate-300 rounded-lg px-2 py-1.5 outline-none bg-white font-medium">
              {ITEMS_PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>per page | Showing {startIdx + 1}–{Math.min(startIdx + itemsPerPage, filteredQuestions.length)} of {filteredQuestions.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => goToPage(1)} disabled={safeCurrentPage === 1} className="p-2 disabled:opacity-30"><ChevronsLeft size={18} /></button>
            <button onClick={() => goToPage(safeCurrentPage - 1)} disabled={safeCurrentPage === 1} className="p-2 disabled:opacity-30"><ChevronLeft size={18} /></button>
            {getPageNumbers().map((page, i) => page === "..." ? <span key={i} className="px-1.5 text-slate-400">…</span> : <button key={page} onClick={() => goToPage(page as number)} className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-semibold ${safeCurrentPage === page ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{page}</button>)}
            <button onClick={() => goToPage(safeCurrentPage + 1)} disabled={safeCurrentPage === totalPages} className="p-2 disabled:opacity-30"><ChevronRight size={18} /></button>
            <button onClick={() => goToPage(totalPages)} disabled={safeCurrentPage === totalPages} className="p-2 disabled:opacity-30"><ChevronsRight size={18} /></button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {editingQuestion && (
          <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8" variants={modalVariants} initial="hidden" animate="show" exit="exit">
              <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold text-slate-900">Edit Question</h2><button onClick={() => setEditingQuestion(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={24} /></button></div>
              <div className="space-y-6">
                <div><label className="block text-sm font-medium text-slate-700 mb-2">Subject</label><input type="text" value={editingQuestion.subject?.name ?? ""} disabled className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-500" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-2">Question</label><textarea rows={3} className="w-full p-3 border border-slate-300 rounded-xl outline-none font-mono text-sm" value={editForm.questionText} onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })} /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {editForm.options.map((opt, idx) => (
                    <div key={idx} className="relative"><span className="absolute left-3 top-3 text-slate-400 font-bold text-xs">{String.fromCharCode(65 + idx)}</span><input type="text" className={`w-full pl-8 p-3 border rounded-xl outline-none font-mono text-sm ${editForm.correctOption === idx ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300'}`} value={opt} onChange={(e) => { const newOpts = [...editForm.options]; newOpts[idx] = e.target.value; setEditForm({ ...editForm, options: newOpts }); }} /></div>
                  ))}
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-2">Correct Answer</label><div className="flex gap-2">{editForm.options.map((_, idx) => <button key={idx} onClick={() => setEditForm({ ...editForm, correctOption: idx })} className={`flex-1 py-2 rounded-lg font-bold border transition ${editForm.correctOption === idx ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500'}`}>{String.fromCharCode(65 + idx)}</button>)}</div></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-2">Explanation</label><input type="text" className="w-full p-3 border border-slate-300 rounded-xl outline-none font-mono text-sm" value={editForm.explanation} onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })} /></div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setEditingQuestion(null)} className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-bold">Cancel</button>
                  <button onClick={handleSaveEdit} disabled={saving} className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">{saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Save</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.isBulk ? "Delete Multiple?" : "Delete Question?"} message={confirmDialog.isBulk ? `Delete ${selectedQuestions.size} questions?` : "Delete this question? This cannot be undone."} confirmText="Delete" cancelText="Cancel" isDangerous onConfirm={handleConfirmDelete} onCancel={() => setConfirmDialog({ isOpen: false, questionId: null, isBulk: false })} />
    </div>
  );
}