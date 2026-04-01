"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { uploadToCloudinary } from "@/app/lib/imageUpload";
import { PlusCircle, FileText, LayoutGrid, Loader2, Upload, FileUp, CheckCircle, AlertCircle, Beaker, Palette, Calculator, Globe, Image as ImageIcon, X, Tag } from "lucide-react";
import { toast } from "sonner";
import { MathText } from "@/app/components/MathText"; 
import { fullClean } from "@/app/lib/bulkTextCleaner";

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

export default function ContentManager() {
  const { user } = useAuth();

  const [showCleaned, setShowCleaned] = useState(false);
  const [cleanedPreview, setCleanedPreview] = useState("");
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

  const [bulkText, setBulkText] = useState("");
  const [bulkSubject, setBulkSubject] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  
  const [bulkImages, setBulkImages] = useState<{[key: number]: File}>({});
  const [bulkImagePreviews, setBulkImagePreviews] = useState<{[key: number]: string}>({});

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

  const handleBulkImageSelect = (questionIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return; }
      setBulkImages(prev => ({...prev, [questionIndex]: file}));
      const reader = new FileReader();
      reader.onloadend = () => setBulkImagePreviews(prev => ({...prev, [questionIndex]: reader.result as string}));
      reader.readAsDataURL(file);
    }
  };

  const removeBulkImage = (questionIndex: number) => {
    const newImages = {...bulkImages};
    const newPreviews = {...bulkImagePreviews};
    delete newImages[questionIndex];
    delete newPreviews[questionIndex];
    setBulkImages(newImages);
    setBulkImagePreviews(newPreviews);
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

  const handleParseBulk = () => {
    setBulkErrors([]);
    setParsedQuestions([]);
    setShowCleaned(false);
    setCleanedPreview("");

    if (!bulkText.trim()) {
      setBulkErrors(["Please paste your questions first."]);
      return;
    }

    const cleaned = fullClean(bulkText);
    setCleanedPreview(cleaned);

    const lines = cleaned.split("\n");
    const questions: any[] = [];
    const errors: string[] = [];

    let currentQuestion: any = null;
    let questionCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const trimmed = raw.trim();
      if (!trimmed) continue;
      if (/^CHAPTER\s+\d+:/i.test(trimmed)) continue;

      if (/^\d{1,3}[\).]\s*\S/.test(trimmed)) {
        if (currentQuestion) {
          const v = validateQuestion(currentQuestion, questionCount);
          if (v.valid) questions.push(currentQuestion);
          else errors.push(...v.errors);
        }
        questionCount++;
        currentQuestion = {
          questionText: trimmed.replace(/^\d{1,3}[\).]\s*/, "").trim(),
          options: [],
          correctOption: -1,
          explanation: "",
        };
        continue;
      }

      if (/^[A-D][).]\s*.+/i.test(trimmed)) {
        if (!currentQuestion) continue;
        const optText = trimmed.replace(/^[A-D][).]\s*/i, "").trim();
        currentQuestion.options.push(optText);
        continue;
      }

      if (/^ANSWER\s*:\s*[A-D]/i.test(trimmed)) {
        if (!currentQuestion) continue;
        const letter = trimmed.match(/[A-D]/i)?.[0].toUpperCase();
        currentQuestion.correctOption = letter ? letter.charCodeAt(0) - 65 : -1;
        continue;
      }

      if (/^EXPLANATION\s*:\s*/i.test(trimmed)) {
        if (!currentQuestion) continue;
        currentQuestion.explanation = trimmed.replace(/^EXPLANATION\s*:\s*/i, "").trim();
        continue;
      }

      if (currentQuestion) {
        if (currentQuestion.correctOption === -1 && currentQuestion.options.length === 0) {
          currentQuestion.questionText += " " + trimmed;
        } else if (currentQuestion.correctOption !== -1) {
          currentQuestion.explanation += " " + trimmed;
        }
      }
    }

    if (currentQuestion) {
      const v = validateQuestion(currentQuestion, questionCount);
      if (v.valid) questions.push(currentQuestion);
      else errors.push(...v.errors);
    }

    setParsedQuestions(questions);
    setBulkErrors(errors);
    if (cleaned !== bulkText) setShowCleaned(true);
  };

  const validateQuestion = (q: any, lineNum: number) => {
    const errors: string[] = [];
    if (!q.questionText) errors.push(`Question ${lineNum}: Missing question text.`);
    if (q.options.length !== 4) errors.push(`Question ${lineNum}: Must have 4 options.`);
    if (q.correctOption === -1) errors.push(`Question ${lineNum}: Missing answer.`);
    return { valid: errors.length === 0, errors };
  };

  const handleBulkUpload = async () => {
    if (parsedQuestions.length === 0) { toast.error("No valid questions to upload."); return; }
    if (!bulkSubject) { toast.error("Please select a subject."); return; }

    setLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const imageCount = Object.keys(bulkImages).length;
      if (imageCount > 0) toast.info(`Uploading ${imageCount} image(s)...`);

      const imageResults = await Promise.all(
        parsedQuestions.map(async (_, idx) => {
          if (bulkImages[idx]) {
            try {
              const url = await uploadImage(bulkImages[idx]);
              return { index: idx, url };
            } catch {
              return { index: idx, url: null };
            }
          }
          return { index: idx, url: null };
        })
      );

      const imageURLs: {[key: number]: string | null} = {};
      imageResults.forEach(r => { imageURLs[r.index] = r.url; });

      const payload = parsedQuestions.map((q, idx) => ({
        subjectId: bulkSubject,
        questionText: q.questionText,
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation || "",
        imageURL: imageURLs[idx] || null,
        difficulty: 'medium',
        topics: []
      }));

      const response = await fetch(`${API_BASE_URL}/questions/admin/upload`, {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json', 
              'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ questions: payload })
      });

      if (!response.ok) throw new Error("Bulk upload failed");

      toast.success(`Success! ${parsedQuestions.length} questions uploaded.`);
      setBulkText(""); setParsedQuestions([]); setBulkImages({}); setBulkImagePreviews({});
    } catch (e: any) {
      toast.error(e.message || "Error uploading questions");
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
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><FileUp className="text-emerald-600" /> Bulk Question Upload</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Subject</label>
              <select className="w-full p-3 border border-slate-300 rounded-xl outline-none capitalize focus:ring-2 focus:ring-emerald-500" value={bulkSubject} onChange={(e) => {
                const subjectId = e.target.value;
                const subject = subjects.find((sub) => sub.id === subjectId);
                setBulkSubject(subjectId);
                setSelectedSubjectSlug(subject?.slug || '');
              }}>
                {subjects.map((sub) => <option key={sub.id} value={sub.id}>{sub.name} {sub.category && `(${sub.category})`}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Paste Questions</label>
              <textarea rows={15} className="w-full p-4 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm" placeholder="Paste your questions here..." value={bulkText} onChange={(e) => { setBulkText(e.target.value); setShowCleaned(false); }}/>
            </div>
            <button onClick={handleParseBulk} className="w-full px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition">Clean & Parse Questions</button>

            {showCleaned && (
              <details className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <summary className="text-sm font-bold text-amber-900 cursor-pointer">✨ Formatting cleaned. View result</summary>
                <pre className="text-xs text-amber-800 font-mono bg-white p-3 rounded mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap">{cleanedPreview}</pre>
              </details>
            )}

            {bulkErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                <p className="text-sm font-bold text-red-900 flex items-center gap-2"><AlertCircle size={16} />{bulkErrors.length} Error(s) Found:</p>
                <ul className="text-sm text-red-800 space-y-1 mt-2">{bulkErrors.map((err, idx) => (<li key={idx}>• {err}</li>))}</ul>
              </div>
            )}

            {parsedQuestions.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                <p className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2"><CheckCircle size={16} />{parsedQuestions.length} Questions Ready</p>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {parsedQuestions.map((q, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-emerald-200">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-bold text-slate-900 flex-1">{idx + 1}. {q.questionText}</p>
                        <div className="ml-4">
                          <input type="file" accept="image/*" onChange={(e) => handleBulkImageSelect(idx, e)} className="hidden" id={`bulk-image-${idx}`} />
                          <label htmlFor={`bulk-image-${idx}`} className="cursor-pointer px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition flex items-center gap-1"><ImageIcon size={14} />{bulkImages[idx] ? "Change" : "Add"} Image</label>
                        </div>
                      </div>
                      {bulkImagePreviews[idx] && (
                        <div className="mb-3 relative inline-block">
                          <img src={bulkImagePreviews[idx]} alt="Preview" className="w-40 h-40 object-cover rounded-lg border-2 border-blue-200" />
                          <button type="button" onClick={() => removeBulkImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={14} /></button>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt: string, optIdx: number) => (
                          <p key={optIdx} className={`text-sm p-2 rounded ${optIdx === q.correctOption ? "bg-emerald-100 text-emerald-900 font-bold" : "text-slate-600"}`}>{String.fromCharCode(65 + optIdx)}) {opt}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={handleBulkUpload} disabled={loading} className="w-full px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition mt-4 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                  Upload {parsedQuestions.length} Questions
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}