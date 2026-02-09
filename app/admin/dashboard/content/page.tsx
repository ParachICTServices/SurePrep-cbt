"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/app/lib/firebase";
import { collection, addDoc, setDoc, doc, serverTimestamp, getDocs, query } from "firebase/firestore";
import { PlusCircle, Save, FileText, LayoutGrid, Loader2 } from "lucide-react";

export default function ContentManager() {
  const { user } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState<'subject' | 'question'>('question');
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Subject Form State
  const [subName, setSubName] = useState("");
  const [subColor, setSubColor] = useState("bg-blue-100 text-blue-600");

  // Question Form State
  const [selectedSubject, setSelectedSubject] = useState("");
  const [qText, setQText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOpt, setCorrectOpt] = useState(0);
  const [explanation, setExplanation] = useState("");

  // Fetch Subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const q = query(collection(db, "subjects"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => doc.data());
        setSubjects(data);
        if (data.length > 0) setSelectedSubject(data[0].id); 
      } catch (e) {
        console.error("Error loading subjects", e);
      }
    };
    fetchSubjects();
  }, []);

  // Handlers (Same as before)
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const id = subName.toLowerCase().replace(/\s+/g, '-');
      await setDoc(doc(db, "subjects", id), {
        id: id,
        name: subName,
        color: subColor, 
        createdAt: serverTimestamp()
      });
      alert(`Subject "${subName}" created!`);
      setSubName("");
      setSubjects(prev => [...prev, { id, name: subName, color: subColor }]);
      setSelectedSubject(id); 
    } catch (e) {
      console.error(e);
      alert("Error creating subject");
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!selectedSubject) throw new Error("Please select a subject");

      await addDoc(collection(db, "questions"), {
        subject: selectedSubject,
        questionText: qText,
        options: options,
        correctOption: Number(correctOpt),
        explanation: explanation,
        createdAt: serverTimestamp(),
        createdBy: user?.email
      });

      alert("Question Added!");
      setQText("");
      setOptions(["", "", "", ""]);
      setExplanation("");
      setCorrectOpt(0);
    } catch (e) {
      console.error(e);
      alert("Error adding question");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Manager</h1>
          <p className="text-slate-500">Add subjects and questions to the database.</p>
        </div>
        
        {/* Toggle Buttons */}
        <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200">
          <button 
            onClick={() => setActiveTab('subject')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'subject' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Create Subject
          </button>
          <button 
            onClick={() => setActiveTab('question')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'question' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Add Question
          </button>
        </div>
      </div>

      {/* --- FORM AREA --- */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        
        {activeTab === 'subject' ? (
          <form onSubmit={handleCreateSubject} className="space-y-6 max-w-lg">
             <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <LayoutGrid className="text-emerald-600"/> New Exam Subject
             </h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Subject Name</label>
              <input 
                type="text" placeholder="e.g. Economics" required
                className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                value={subName} onChange={e => setSubName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Color Theme</label>
              <select 
                className="w-full p-3 border border-slate-300 rounded-xl outline-none"
                value={subColor} onChange={e => setSubColor(e.target.value)}
              >
                <option value="bg-blue-100 text-blue-600">Blue</option>
                <option value="bg-emerald-100 text-emerald-600">Green</option>
                <option value="bg-orange-100 text-orange-600">Orange</option>
                <option value="bg-purple-100 text-purple-600">Purple</option>
              </select>
            </div>
            <button disabled={loading} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition w-full">
              {loading ? "Saving..." : "Create Subject"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAddQuestion} className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <FileText className="text-emerald-600"/> Add New Question
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Subject</label>
              <select 
                className="w-full p-3 border border-slate-300 rounded-xl outline-none capitalize focus:ring-2 focus:ring-emerald-500"
                value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
              >
                {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Question Text</label>
              <textarea 
                rows={3} required
                className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                value={qText} onChange={e => setQText(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.map((opt, idx) => (
                <div key={idx} className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-bold text-xs">{String.fromCharCode(65 + idx)}</span>
                  <input 
                    type="text" required
                    className={`w-full pl-8 p-3 border rounded-xl outline-none focus:border-emerald-500 ${correctOpt === idx ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300'}`}
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...options];
                      newOpts[idx] = e.target.value;
                      setOptions(newOpts);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Correct Answer</label>
                <div className="flex gap-2">
                  {options.map((_, idx) => (
                    <button
                      key={idx} type="button"
                      onClick={() => setCorrectOpt(idx)}
                      className={`flex-1 py-2 rounded-lg font-bold border transition ${correctOpt === idx ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Explanation</label>
                <input 
                  type="text"
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                  value={explanation} onChange={e => setExplanation(e.target.value)}
                />
              </div>
            </div>

            <button disabled={loading} className="w-full px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin"/> : "Save to Database"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}