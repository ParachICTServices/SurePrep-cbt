"use client";
import { useState } from "react";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import { Save, PlusCircle, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { addDoc, collection, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { toast } from "sonner"; 

export default function AdminPanel() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(0); // 0 = A, 1 = B...
  const [explanation, setExplanation] = useState("");
  
  
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map(email => email.trim().toLowerCase());

  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || "")) {
    return (
      <div className="p-10 text-center text-red-600 bg-red-50 rounded-xl border border-red-100">
        <AlertCircle className="mx-auto mb-2" size={40} />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

   try {

      if (!subject || !questionText || options.some(opt => opt === "")) {
        toast.error("Please fill in all fields");
        setLoading(false);
        return;
      }

      const subjectId = subject.toLowerCase().replace(/\s+/g, '-'); 

    
      await addDoc(collection(db, "questions"), {
        subject: subjectId, 
        subjectTitle: subject, 
        questionText,
        options,
        correctOption: Number(correctOption),
        explanation,
        createdAt: serverTimestamp(),
      });

   
      await setDoc(doc(db, "subjects", subjectId), {
        id: subjectId,
        name: subject,
        icon: "BookOpen", 
        color: "bg-emerald-100 text-emerald-600" 
      });

   
      setQuestionText("");
      setOptions(["", "", "", ""]);
      setExplanation("");
      
      toast.success(`Saved! '${subject}' is now live.`);
    }
      catch (error) {
      console.error("Error adding question:", error);
      toast.error("Error saving question.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold text-slate-900">Question Manager</h1>
        <p className="text-slate-500">Add questions for any exam type.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* 1. Exam Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <PlusCircle size={20} className="text-emerald-600"/> Exam Details
          </h3>
          
          <label className="block text-sm font-medium text-slate-700 mb-2">Subject / Exam Name</label>
          <input 
            type="text" 
            placeholder="e.g. Nursing Anatomy 101, WAEC Chemistry, General Paper" 
            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <p className="text-xs text-slate-400 mt-2">
            This will create a unique ID like <strong>{subject ? subject.toLowerCase().replace(/\s+/g, '-') : '...'}</strong> in the database.
          </p>
        </div>

        {/* 2. The Question */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <label className="block text-sm font-medium text-slate-700 mb-2">Question Text</label>
          <textarea 
            rows={3}
            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="Type the question here..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            required
          />
        </div>

        {/* 3. Options & Answer */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Answer Options</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {options.map((opt, idx) => (
              <div key={idx} className="relative">
                <span className="absolute left-3 top-3 text-slate-400 font-bold text-xs">
                  {String.fromCharCode(65 + idx)}
                </span>
                <input 
                  type="text"
                  className={`w-full pl-8 p-3 border rounded-xl outline-none focus:border-emerald-500 ${correctOption === idx ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-slate-300'}`}
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  required
                />
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Correct Answer</label>
            <div className="flex gap-4">
              {options.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCorrectOption(idx)}
                  className={`px-4 py-2 rounded-lg font-bold border transition-colors ${
                    correctOption === idx 
                      ? "bg-emerald-600 text-white border-emerald-600" 
                      : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  Option {String.fromCharCode(65 + idx)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Explanation (Premium Feature) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <label className="block text-sm font-medium text-slate-700 mb-2">Explanation (Optional)</label>
          <textarea 
            rows={2}
            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="Why is this the correct answer? (Shown to Premium users)"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center gap-2 shadow-lg shadow-emerald-200"
          >
            {loading ? <Loader2 className="animate-spin"/> : <Save size={20} />}
            Save to Database
          </button>
        </div>
      </form>
    </div>
  );
}