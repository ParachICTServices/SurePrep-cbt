"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/app/lib/firebase";
import { collection, addDoc, setDoc, doc, serverTimestamp, getDocs, query, writeBatch } from "firebase/firestore";
import { PlusCircle, Save, FileText, LayoutGrid, Loader2, Upload, FileUp, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ContentManager() {
  const { user } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState<'subject' | 'question' | 'bulk'>('question');
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [subName, setSubName] = useState("");
  const [subColor, setSubColor] = useState("bg-blue-100 text-blue-600");

  const [selectedSubject, setSelectedSubject] = useState("");
  const [qText, setQText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOpt, setCorrectOpt] = useState(0);
  const [explanation, setExplanation] = useState("");

  const [bulkText, setBulkText] = useState("");
  const [bulkSubject, setBulkSubject] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const q = query(collection(db, "subjects"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => doc.data());
        setSubjects(data);
        if (data.length > 0) {
          setSelectedSubject(data[0].id);
          setBulkSubject(data[0].id);
        }
      } catch (e) {
        console.error("Error loading subjects", e);
      }
    };
    fetchSubjects();
  }, []);

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
      toast.success(`Subject "${subName}" created!`);
      setSubName("");
      setSubjects(prev => [...prev, { id, name: subName, color: subColor }]);
      setSelectedSubject(id);
      setBulkSubject(id);
    } catch (e) {
      console.error(e);
      toast.error("Error creating subject");
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

      toast.success("Question Added!");
      setQText("");
      setOptions(["", "", "", ""]);
      setExplanation("");
      setCorrectOpt(0);
    } catch (e) {
      console.error(e);
      toast.error("Error adding question");
    } finally {
      setLoading(false);
    }
  };

  const handleParseBulk = () => {
    setBulkErrors([]);
    setParsedQuestions([]);

    if (!bulkText.trim()) {
      setBulkErrors(["Please paste your questions first."]);
      return;
    }

    const lines = bulkText.trim().split('\n').filter(line => line.trim());
    const questions: any[] = [];
    const errors: string[] = [];
    
    let currentQuestion: any = null;
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;
      const trimmed = line.trim();

      if (/^\d+[\.)]\s/.test(trimmed)) {
        if (currentQuestion) {
          const validation = validateQuestion(currentQuestion, lineNumber - 1);
          if (validation.valid) {
            questions.push(currentQuestion);
          } else {
            errors.push(...validation.errors);
          }
        }

        currentQuestion = {
          questionText: trimmed.replace(/^\d+[\.)]\s/, '').trim(),
          options: [],
          correctOption: -1,
          explanation: ""
        };
      }
      else if (/^[A-D][\.)]\s/i.test(trimmed)) {
        if (!currentQuestion) {
          errors.push(`Line ${lineNumber}: Option found without a question.`);
          continue;
        }
        currentQuestion.options.push(trimmed.replace(/^[A-D][\.)]\s/i, '').trim());
      }
      else if (/^(ANSWER|ANS):\s*[A-D]$/i.test(trimmed)) {
        if (!currentQuestion) {
          errors.push(`Line ${lineNumber}: Answer found without a question.`);
          continue;
        }
        const answerLetter = trimmed.match(/[A-D]$/i)?.[0].toUpperCase();
        currentQuestion.correctOption = answerLetter ? answerLetter.charCodeAt(0) - 65 : -1;
      }
      else if (/^(EXPLANATION|EXP):/i.test(trimmed)) {
        if (!currentQuestion) {
          errors.push(`Line ${lineNumber}: Explanation found without a question.`);
          continue;
        }
        currentQuestion.explanation = trimmed.replace(/^(EXPLANATION|EXP):\s*/i, '').trim();
      }
    }

    // Don't forget the last question
    if (currentQuestion) {
      const validation = validateQuestion(currentQuestion, lineNumber);
      if (validation.valid) {
        questions.push(currentQuestion);
      } else {
        errors.push(...validation.errors);
      }
    }

    setParsedQuestions(questions);
    setBulkErrors(errors);
  };

  const validateQuestion = (q: any, lineNum: number) => {
    const errors: string[] = [];
    
    if (!q.questionText) {
      errors.push(`Question ${lineNum}: Missing question text.`);
    }
    if (q.options.length !== 4) {
      errors.push(`Question ${lineNum}: Must have exactly 4 options (A, B, C, D). Found ${q.options.length}.`);
    }
    if (q.correctOption === -1) {
      errors.push(`Question ${lineNum}: Missing answer or invalid answer format.`);
    }

    return { valid: errors.length === 0, errors };
  };

  const handleBulkUpload = async () => {
    if (parsedQuestions.length === 0) {
      toast.error("No valid questions to upload. Please parse your text first.");
      return;
    }

    if (!bulkSubject) {
      toast.error("Please select a subject.");
      return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      parsedQuestions.forEach((q) => {
        const docRef = doc(collection(db, "questions"));
        batch.set(docRef, {
          subject: bulkSubject,
          questionText: q.questionText,
          options: q.options,
          correctOption: q.correctOption,
          explanation: q.explanation || "",
          createdAt: serverTimestamp(),
          createdBy: user?.email
        });
      });

      await batch.commit();

      toast.success(`Success! ${parsedQuestions.length} questions uploaded.`);
      setBulkText("");
      setParsedQuestions([]);
      setBulkErrors([]);
    } catch (e) {
      console.error(e);
      toast.error("Error uploading questions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
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
          <button 
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center gap-2 ${activeTab === 'bulk' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Upload size={16} />
            Bulk Upload
          </button>
        </div>
      </div>

      {/* --- FORM AREA --- */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        
        {/* CREATE SUBJECT */}
        {activeTab === 'subject' && (
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
        )}

        {/* ADD SINGLE QUESTION */}
        {activeTab === 'question' && (
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

        {/* BULK UPLOAD */}
        {activeTab === 'bulk' && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileUp className="text-emerald-600"/> Bulk Question Upload
                </h2>
                <p className="text-sm text-slate-500 mt-1">Paste multiple questions in the correct format below.</p>
              </div>
            </div>

            {/* Format Instructions */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
              <p className="text-sm font-bold text-blue-900 mb-2">📋 Required Format:</p>
              <pre className="text-xs text-blue-800 font-mono bg-white p-3 rounded border border-blue-200 overflow-x-auto">
{`1) What is the capital of Nigeria?
A) Lagos
B) Abuja
C) Kano
D) Port Harcourt
ANSWER: B
EXPLANATION: Abuja has been the capital since 1991

2) Which year did Nigeria gain independence?
A) 1960
B) 1963
C) 1970
D) 1976
ANSWER: A`}
              </pre>
              <p className="text-xs text-blue-700 mt-2">
                ✓ Start each question with a number<br/>
                ✓ Options must be A, B, C, D<br/>
                ✓ ANSWER: must be uppercase (A, B, C, or D)<br/>
                ✓ EXPLANATION: is optional
              </p>
            </div>

            {/* Subject Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Subject</label>
              <select 
                className="w-full p-3 border border-slate-300 rounded-xl outline-none capitalize focus:ring-2 focus:ring-emerald-500"
                value={bulkSubject} onChange={e => setBulkSubject(e.target.value)}
              >
                {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
              </select>
            </div>

            {/* Text Area */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Paste Questions</label>
              <textarea 
                rows={15}
                className="w-full p-4 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                placeholder="Paste your questions here in the format shown above..."
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
              />
            </div>

            {/* Parse Button */}
            <button 
              onClick={handleParseBulk}
              className="w-full px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition"
            >
              Parse & Validate Questions
            </button>

            {/* Errors */}
            {bulkErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                <p className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {bulkErrors.length} Error(s) Found:
                </p>
                <ul className="text-sm text-red-800 space-y-1">
                  {bulkErrors.map((err, idx) => (
                    <li key={idx}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Parsed Questions Preview */}
            {parsedQuestions.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                <p className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                  <CheckCircle size={16} />
                  {parsedQuestions.length} Valid Question(s) Ready
                </p>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {parsedQuestions.map((q, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-emerald-200">
                      <p className="font-bold text-slate-900 mb-2">{idx + 1}. {q.questionText}</p>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {q.options.map((opt: string, optIdx: number) => (
                          <p key={optIdx} className={`text-sm p-2 rounded ${optIdx === q.correctOption ? 'bg-emerald-100 text-emerald-900 font-bold' : 'text-slate-600'}`}>
                            {String.fromCharCode(65 + optIdx)}) {opt}
                          </p>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded mt-2">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleBulkUpload}
                  disabled={loading}
                  className="w-full px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition mt-4 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin"/> : <Upload size={20} />}
                  {loading ? "Uploading..." : `Upload ${parsedQuestions.length} Questions`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
