"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { uploadToCloudinary } from "@/app/lib/imageUpload";
import { PlusCircle, FileText, LayoutGrid, Loader2, Upload, FileUp, CheckCircle, AlertCircle, Beaker, Palette, Calculator, Globe, Image as ImageIcon, X, Tag, Download } from "lucide-react";
import { toast } from "sonner";
import { MathText } from "@/app/components/MathText"; 
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

const SUBJECT_TOPICS: Record<string, string[]> = {
  mathematics: ['Algebra', 'Calculus', 'Trigonometry', 'Statistics & Probability', 'Geometry', 'Vectors & Mechanics', 'Number Theory', 'Logarithms'],
  physics: ['Mechanics', 'Electricity & Magnetism', 'Waves & Sound', 'Light & Optics', 'Heat & Thermodynamics', 'Modern Physics', 'Atomic Structure'],
  chemistry: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Chemical Bonding', 'Acids & Bases', 'Electrochemistry', 'Periodic Table', 'Stoichiometry'],
  biology: ['Cell Biology', 'Genetics & Evolution', 'Ecology', 'Human Anatomy', 'Plant Biology', 'Microbiology', 'Reproduction'],
  english: ['Oral English', 'Comprehension', 'Grammar', 'Vocabulary', 'Literature', 'Essay Writing', 'Lexis & Structure'],
  literature: ['Poetry', 'Drama', 'Prose', 'African Literature', 'Literary Devices'],
  government: ['Nigerian Government', 'International Relations', 'Political Systems', 'Democracy', 'Federalism'],
  economics: ['Microeconomics', 'Macroeconomics', 'International Trade', 'Money & Banking', 'Development Economics'],
  accounting: ['Book Keeping', 'Financial Accounting', 'Cost Accounting', 'Partnership Accounts'],
  commerce: ['Trade', 'Banking', 'Insurance', 'Business Organization'],
};

function formatTopicId(topic: string): string { return topic.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'); }
function getTopicsForSubject(subjectId: string): string[] { return SUBJECT_TOPICS[subjectId.toLowerCase()] || []; }

function normalizeInlineMath(raw: string): string {
  return raw
    .replace(/\bsqrt\(([^)]+)\)/g, (_m, inner) => `\\sqrt{${inner}}`)
    .replace(/\bfrac\(([^,)]+),([^)]+)\)/g, (_m, a, b) => `\\frac{${a}}{${b}}`)
    .replace(/\^(\d{2,})/g, (_m, exp) => `^{${exp}}`)
    .replace(/(\d+)deg\b/gi, (_m, n) => `${n}^{\\circ}`)
    .replace(/\b>=/g, "\\geq")
    .replace(/\b<=/g, "\\leq")
    .replace(/\binfinity\b/gi, "\\infty")
    .replace(/\bpi\b/g, "\\pi")
    .replace(/\balpha\b/g, "\\alpha")
    .replace(/\bbeta\b/g, "\\beta")
    .replace(/\bgamma\b/g, "\\gamma")
    .replace(/\btheta\b/g, "\\theta")
    .replace(/\bomega\b/g, "\\omega")
    .replace(/\blambda\b/g, "\\lambda")
    .replace(/\bsigma\b/g, "\\sigma")
    .replace(/\bdelta\b/g, "\\delta")
    .replace(/\btimes\b/g, "\\times")
    .replace(/\bdiv\b/g, "\\div");
}

function processMathInString(text: string): string {
  return text.replace(/\$([^$]+)\$/g, (_match, inner) => `$${normalizeInlineMath(inner)}$`);
}

/** Example payload for bulk JSON upload (replace subjectId and topic IDs with real values from your API). */
const BULK_QUESTIONS_SAMPLE_JSON = `{
  "subjectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "questions": [
    {
      "questionText": "What is 2 + 2?",
      "options": ["1", "2", "3", "4"],
      "correctOption": 3,
      "explanation": "2 + 2 equals 4.",
      "imageURL": null,
      "topics": ["Arithmetic"],
      "difficulty": "easy"
    },
    {
      "questionText": "The capital of Nigeria is:",
      "options": ["Lagos", "Abuja", "Kano", "Port Harcourt"],
      "correctOption": 1,
      "explanation": "Abuja is the federal capital.",
      "imageURL": null,
      "topicIds": ["548b1d13-25e3-4986-ba9e-ea9da236ee6e"],
      "difficulty": "medium"
    },
    {
      "questionText": "Solve for x: 3x = 12",
      "options": ["2", "3", "4", "6"],
      "correctOption": 2,
      "explanation": "x = 4",
      "topics": ["Algebra", "Linear Equations"],
      "difficulty": "easy"
    }
  ]
}`;

function downloadBulkQuestionsSample() {
  const blob = new Blob([BULK_QUESTIONS_SAMPLE_JSON], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bulk-questions-sample.json";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ContentManager() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'subject' | 'question' | 'bulk'>('question');
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [subName, setSubName] = useState("");
  const [subColor, setSubColor] = useState("bg-blue-100 text-blue-600");
  const [subCategory, setSubCategory] = useState<"sciences" | "arts" | "commercial" | "general">("general");

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSubjectSlug, setSelectedSubjectSlug] = useState("");
  const [qText, setQText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOpt, setCorrectOpt] = useState(0);
  const [explanation, setExplanation] = useState("");
  
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [questionImagePreview, setQuestionImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkJsonFile, setBulkJsonFile] = useState<File | null>(null);
  const [bulkJsonError, setBulkJsonError] = useState<string | null>(null);
  const bulkJsonInputRef = useRef<HTMLInputElement>(null);

  const selectedSubjectData = subjects.find(sub => sub.id === selectedSubject);
  const availableTopics: string[] = selectedSubjectData?.topics?.length
    ? selectedSubjectData.topics
        .map((t: string | { name?: string }) => (typeof t === 'string' ? t : t.name || ""))
        .filter((t: any): t is string => Boolean(t))
    : getTopicsForSubject(selectedSubjectData?.slug || selectedSubjectSlug || selectedSubject);

  useEffect(() => {
    const fetchSubjects = async () => {
      const token = localStorage.getItem('auth_token');
      try {
        const response = await fetch(`${API_BASE_URL}/subjects`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const subjectsArray = Array.isArray(data) ? data : (data.data || []);
        
        const formatted = subjectsArray.map((s: any) => {
            const slug = s.slug || (s.name ? s.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and') : '');
            return {
              id: s.id || s._id,
              name: s.name,
              color: s.color,
              category: s.category,
              slug,
              topics: Array.isArray(s.topics) ? s.topics : [],
              questionCount: s.questionCount ?? 0,
              createdAt: s.createdAt
            };
        });

        setSubjects(formatted);
        if (formatted.length > 0) {
          setSelectedSubject(formatted[0].id);
          setSelectedSubjectSlug(formatted[0].slug || '');
          setBulkSubject(formatted[0].id);
        }
      } catch (e) {
        console.error("Error loading subjects", e);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    setSelectedTopics([]);
  }, [selectedSubject]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return; }
      setQuestionImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setQuestionImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      return await uploadToCloudinary(file, 'questions');
    } catch (error: any) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload image.');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch(`${API_BASE_URL}/subjects/admin`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: subName,
          color: subColor,
          category: subCategory
        })
      });

      if (!response.ok) throw new Error("Failed to create subject");
      const newSub = await response.json();

      toast.success(`Subject "${subName}" created!`);
      setSubName("");
      setSubjects(prev => [...prev, { id: newSub.id || newSub._id, name: subName, color: subColor, category: subCategory }]);
    } catch (e) {
      toast.error("Error creating subject");
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      if (!selectedSubject) throw new Error("Please select a subject");

      let imageURL = "";
      if (questionImage) {
        toast.info("Uploading image...");
        imageURL = await uploadImage(questionImage);
      }

      const topicIds = selectedTopics.map(formatTopicId);

      const response = await fetch(`${API_BASE_URL}/questions/admin`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          subjectId: selectedSubject,
          questionText: processMathInString(qText),
          options: options.map(processMathInString),
          correctOption: Number(correctOpt),
          explanation: processMathInString(explanation),
          imageURL: imageURL || null,
          topics: topicIds,
          difficulty: selectedDifficulty
        })
      });

      if (!response.ok) throw new Error("Failed to add question");

      toast.success("Question Added!");
      setQText(""); setOptions(["", "", "", ""]); setExplanation("");
      setCorrectOpt(0); setQuestionImage(null); setQuestionImagePreview("");
      setSelectedTopics([]);
    } catch (e: any) {
      toast.error(e.message || "Error adding question");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setBulkJsonError(null);
    setBulkJsonFile(null);
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".json")) {
      toast.error("Only .json files are accepted.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        JSON.parse(reader.result as string);
        setBulkJsonFile(file);
      } catch {
        setBulkJsonError("This file is not valid JSON. Fix the file and try again.");
        e.target.value = "";
      }
    };
    reader.onerror = () => {
      setBulkJsonError("Could not read the file.");
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const clearBulkJsonFile = () => {
    setBulkJsonFile(null);
    setBulkJsonError(null);
    if (bulkJsonInputRef.current) bulkJsonInputRef.current.value = "";
  };

  const handleJsonBulkUpload = async () => {
    if (!bulkSubject) {
      toast.error("Please select a subject.");
      return;
    }
    if (!bulkJsonFile) {
      toast.error("Choose a JSON file to upload.");
      return;
    }
    if (bulkJsonError) return;
    if (!API_BASE_URL) {
      toast.error("API is not configured.");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("auth_token");
    try {
      const formData = new FormData();
      formData.append("file", bulkJsonFile);
      formData.append("subjectId", bulkSubject);

      const response = await fetch(`${API_BASE_URL}/admin/upload-file`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const text = await response.text();
      let data: Record<string, unknown> = {};
      if (text) {
        try {
          data = JSON.parse(text) as Record<string, unknown>;
        } catch {
          if (!response.ok) throw new Error(text.slice(0, 200) || `Upload failed (${response.status})`);
        }
      }
      if (!response.ok) {
        const msg =
          typeof data?.message === "string"
            ? data.message
            : `Upload failed (${response.status})`;
        throw new Error(msg);
      }

      const count =
        typeof data?.count === "number"
          ? data.count
          : typeof data?.imported === "number"
            ? data.imported
            : null;
      toast.success(
        count != null ? `Uploaded successfully (${count} questions).` : "Upload completed successfully."
      );
      clearBulkJsonFile();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error uploading file");
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
        <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200">
          <button onClick={() => setActiveTab('subject')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'subject' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Create Subject</button>
          <button onClick={() => setActiveTab('question')} className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'question' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Add Question</button>
          <button onClick={() => setActiveTab('bulk')} className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center gap-2 ${activeTab === 'bulk' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}><Upload size={16}/>Bulk Upload</button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">

        {activeTab === 'subject' && (
          <form onSubmit={handleCreateSubject} className="space-y-6 max-w-2xl">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><LayoutGrid className="text-emerald-600"/> New Exam Subject</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject Name</label>
                <input type="text" placeholder="e.g. Economics" required className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" value={subName} onChange={e => setSubName(e.target.value)}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Color Theme</label>
                <select className="w-full p-3 border border-slate-300 rounded-xl outline-none" value={subColor} onChange={e => setSubColor(e.target.value)}>
                  <option value="bg-blue-100 text-blue-600">Blue</option>
                  <option value="bg-emerald-100 text-emerald-600">Green</option>
                  <option value="bg-orange-100 text-orange-600">Orange</option>
                  <option value="bg-purple-100 text-purple-600">Purple</option>
                  <option value="bg-red-100 text-red-600">Red</option>
                  <option value="bg-indigo-100 text-indigo-600">Indigo</option>
                  <option value="bg-teal-100 text-teal-600">Teal</option>
                  <option value="bg-pink-100 text-pink-600">Pink</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Subject Category <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(["sciences","arts","commercial","general"] as const).map((cat) => {
                  const Icon = cat === 'sciences' ? Beaker : cat === 'arts' ? Palette : cat === 'commercial' ? Calculator : Globe;
                  const colors = { sciences:'blue', arts:'purple', commercial:'green', general:'slate' };
                  const c = colors[cat];
                  return (
                    <button key={cat} type="button" onClick={() => setSubCategory(cat)}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${subCategory === cat ? `border-${c}-500 bg-${c}-50 shadow-lg` : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                      <Icon className={`mx-auto mb-2 ${subCategory === cat ? `text-${c}-600` : 'text-slate-400'}`} size={24}/>
                      <p className={`text-sm font-bold ${subCategory === cat ? `text-${c}-900` : 'text-slate-600'}`}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</p>
                      {subCategory === cat && <CheckCircle className={`mx-auto mt-2 text-${c}-600`} size={16}/>}
                    </button>
                  );
                })}
              </div>
            </div>
            <button disabled={loading} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition w-full flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="animate-spin" size={18}/>Creating...</> : <><PlusCircle size={18}/>Create Subject</>}
            </button>
          </form>
        )}

        {activeTab === 'question' && (
          <form onSubmit={handleAddQuestion} className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><FileText className="text-emerald-600"/> Add New Question</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Subject</label>
              <select className="w-full p-3 border border-slate-300 rounded-xl outline-none capitalize focus:ring-2 focus:ring-emerald-500" value={selectedSubject} onChange={e => {
                const subjectId = e.target.value;
                const subject = subjects.find(sub => sub.id === subjectId);
                setSelectedSubject(subjectId);
                setSelectedSubjectSlug(subject?.slug || '');
              }}>
                {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name} {sub.category && `(${sub.category})`}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Question Text</label>
              <textarea rows={3} required className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm" value={qText} onChange={e => setQText(e.target.value)}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Question Image <span className="text-slate-500 text-xs">(Optional)</span></label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden"/>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-emerald-500 transition flex items-center justify-center gap-2 text-slate-600 hover:text-emerald-600">
                    <ImageIcon size={20}/>{questionImage ? "Change Image" : "Upload Image"}
                  </button>
                </div>
                {questionImagePreview && (
                  <div className="relative">
                    <img src={questionImagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-xl border-2 border-slate-200"/>
                    <button type="button" onClick={() => { setQuestionImage(null); setQuestionImagePreview(""); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                      <X size={16}/>
                    </button>
                  </div>
                )}
              </div>
            </div>
            {availableTopics.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Tag size={16}/>Topics
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTopics.map((topic) => {
                    const isSelected = selectedTopics.includes(topic);
                    return (
                      <button key={topic} type="button" onClick={() => setSelectedTopics(prev => isSelected ? prev.filter(t => t !== topic) : [...prev, topic])}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${isSelected ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        {topic}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.map((opt, idx) => (
                <div key={idx} className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-bold text-xs">{String.fromCharCode(65 + idx)}</span>
                  <input type="text" required
                    className={`w-full pl-8 p-3 border rounded-xl outline-none focus:border-emerald-500 font-mono text-sm ${correctOpt === idx ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300'}`}
                    value={opt} onChange={(e) => { const n = [...options]; n[idx] = e.target.value; setOptions(n); }}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Correct Answer</label>
                <div className="flex gap-2">
                  {options.map((_, idx) => (
                    <button key={idx} type="button" onClick={() => setCorrectOpt(idx)}
                      className={`flex-1 py-2 rounded-lg font-bold border transition ${correctOpt === idx ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                      {String.fromCharCode(65 + idx)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Explanation</label>
                <input type="text" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none font-mono text-sm" value={explanation} onChange={e => setExplanation(e.target.value)}/>
              </div>
            </div>
            <button disabled={loading} className="w-full px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin"/> : "Save to Database"}
            </button>
          </form>
        )}

        {activeTab === "bulk" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileUp className="text-emerald-600" /> Bulk question upload (JSON)
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Select a subject, then upload a single <code className="text-xs bg-slate-100 px-1 rounded">.json</code> file. The file is sent to the server for import. Questions may use{" "}
              </p>
              <button
                type="button"
                onClick={downloadBulkQuestionsSample}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <Download size={18} />
                Download sample JSON
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
              <select
                className="w-full p-3 border border-slate-300 rounded-xl outline-none capitalize focus:ring-2 focus:ring-emerald-500"
                value={bulkSubject}
                onChange={(e) => {
                  const subjectId = e.target.value;
                  const subject = subjects.find((sub) => sub.id === subjectId);
                  setBulkSubject(subjectId);
                  setSelectedSubjectSlug(subject?.slug || "");
                }}
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} {sub.category && `(${sub.category})`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">JSON file</label>
              <input
                ref={bulkJsonInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleBulkJsonFileChange}
              />
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => bulkJsonInputRef.current?.click()}
                  className="px-6 py-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-emerald-500 transition flex items-center justify-center gap-2 text-slate-600 hover:text-emerald-700 font-medium"
                >
                  <FileUp size={20} />
                  {bulkJsonFile ? "Change file" : "Choose JSON file"}
                </button>
                {bulkJsonFile && (
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="font-mono truncate max-w-[220px]" title={bulkJsonFile.name}>
                      {bulkJsonFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={clearBulkJsonFile}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      aria-label="Remove file"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
              {bulkJsonError && (
                <div className="mt-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <span>{bulkJsonError}</span>
                </div>
              )}
              {bulkJsonFile && !bulkJsonError && (
                <p className="mt-2 text-xs text-emerald-700 flex items-center gap-1">
                  <CheckCircle size={14} /> Valid JSON — ready to upload.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleJsonBulkUpload}
              disabled={loading || !bulkJsonFile || !!bulkJsonError || !bulkSubject}
              className="w-full px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
              {loading ? "Uploading…" : "Upload to subject"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}