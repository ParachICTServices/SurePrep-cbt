"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/app/lib/firebase";
import { collection, addDoc, setDoc, doc, serverTimestamp, getDocs, query, writeBatch } from "firebase/firestore";
import { uploadToCloudinary } from "@/app/lib/imageUpload";
import { PlusCircle, FileText, LayoutGrid, Loader2, Upload, FileUp, CheckCircle, AlertCircle, Beaker, Palette, Calculator, Globe, Image as ImageIcon, X, Tag } from "lucide-react";
import { toast } from "sonner";
import { MathText } from "@/app/components/MathText"; 
import { fullClean } from "@/app/lib/bulkTextCleaner";



// TOPIC CONFIGURATION
const SUBJECT_TOPICS: Record<string, string[]> = {
  mathematics: [
    'Algebra', 'Calculus', 'Trigonometry', 'Statistics & Probability',
    'Geometry', 'Vectors & Mechanics', 'Number Theory', 'Logarithms'
  ],
  physics: [
    'Mechanics', 'Electricity & Magnetism', 'Waves & Sound', 'Light & Optics',
    'Heat & Thermodynamics', 'Modern Physics', 'Atomic Structure'
  ],
  chemistry: [
    'Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Chemical Bonding',
    'Acids & Bases', 'Electrochemistry', 'Periodic Table', 'Stoichiometry'
  ],
  biology: [
    'Cell Biology', 'Genetics & Evolution', 'Ecology', 'Human Anatomy',
    'Plant Biology', 'Microbiology', 'Reproduction'
  ],
  english: [
    'Oral English', 'Comprehension', 'Grammar', 'Vocabulary',
    'Literature', 'Essay Writing', 'Lexis & Structure'
  ],
  literature: [
    'Poetry', 'Drama', 'Prose', 'African Literature', 'Literary Devices'
  ],
  government: [
    'Nigerian Government', 'International Relations', 'Political Systems',
    'Democracy', 'Federalism'
  ],
  economics: [
    'Microeconomics', 'Macroeconomics', 'International Trade',
    'Money & Banking', 'Development Economics'
  ],
  accounting: [
    'Book Keeping', 'Financial Accounting', 'Cost Accounting', 'Partnership Accounts'
  ],
  commerce: [
    'Trade', 'Banking', 'Insurance', 'Business Organization'
  ],
};




function formatTopicId(topic: string): string {
  return topic.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');
}

function getTopicsForSubject(subjectId: string): string[] {
  return SUBJECT_TOPICS[subjectId.toLowerCase()] || [];
}

function normalizeInlineMath(raw: string): string {
  return raw
    // sqrt(x)  →  \sqrt{x}
    .replace(/\bsqrt\(([^)]+)\)/g, (_m, inner) => `\\sqrt{${inner}}`)
    // frac(a,b) →  \frac{a}{b}
    .replace(/\bfrac\(([^,)]+),([^)]+)\)/g, (_m, a, b) => `\\frac{${a}}{${b}}`)
    // x^2  →  x^{2}   (only when exponent is >1 char, e.g. x^10 → x^{10})
    .replace(/\^(\d{2,})/g, (_m, exp) => `^{${exp}}`)
    // plain degree symbol workaround: 90deg → 90°
    .replace(/(\d+)deg\b/gi, (_m, n) => `${n}^{\\circ}`)
    // >=  →  \geq ,  <=  →  \leq
    .replace(/\b>=/g, "\\geq")
    .replace(/\b<=/g, "\\leq")
    // infinity  →  \infty
    .replace(/\binfinity\b/gi, "\\infty")
    // pi  →  \pi  (only as standalone word, not inside another word)
    .replace(/\bpi\b/g, "\\pi")
    // alpha, beta, gamma, theta, omega
    .replace(/\balpha\b/g, "\\alpha")
    .replace(/\bbeta\b/g, "\\beta")
    .replace(/\bgamma\b/g, "\\gamma")
    .replace(/\btheta\b/g, "\\theta")
    .replace(/\bomega\b/g, "\\omega")
    .replace(/\blambda\b/g, "\\lambda")
    .replace(/\bsigma\b/g, "\\sigma")
    .replace(/\bdelta\b/g, "\\delta")
    // times / multiply sign
    .replace(/\btimes\b/g, "\\times")
    .replace(/\bdiv\b/g, "\\div");
}


function processMathInString(text: string): string {
  return text.replace(/\$([^$]+)\$/g, (_match, inner) => {
    return `$${normalizeInlineMath(inner)}$`;
  });
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
  const [qText, setQText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOpt, setCorrectOpt] = useState(0);
  const [explanation, setExplanation] = useState("");
  
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  
  // Image states for single question
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [questionImagePreview, setQuestionImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bulkText, setBulkText] = useState("");
  const [bulkSubject, setBulkSubject] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  
  // Bulk image upload states
  const [bulkImages, setBulkImages] = useState<{[key: number]: File}>({});
  const [bulkImagePreviews, setBulkImagePreviews] = useState<{[key: number]: string}>({});

  const availableTopics = getTopicsForSubject(selectedSubject);

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

  const uploadImage = async (file: File, questionId: string): Promise<string> => {
    try {
      return await uploadToCloudinary(file, 'questions');
    } catch (error: any) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const id = subName.toLowerCase().replace(/\s+/g, '-');
      await setDoc(doc(db, "subjects", id), {
        id, name: subName, color: subColor, category: subCategory,
        createdAt: serverTimestamp()
      });
      toast.success(`Subject "${subName}" created in ${subCategory} category!`);
      setSubName("");
      setSubjects(prev => [...prev, { id, name: subName, color: subColor, category: subCategory }]);
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

      let imageURL = "";
      if (questionImage) {
        toast.info("Uploading image...");
        imageURL = await uploadImage(questionImage, `question_${Date.now()}`);
        toast.success("Image uploaded!");
      }

      const topicIds = selectedTopics.map(formatTopicId);

      // Process math notation before saving
      await addDoc(collection(db, "questions"), {
        subject: selectedSubject,
        questionText: processMathInString(qText),
        options: options.map(processMathInString),
        correctOption: Number(correctOpt),
        explanation: processMathInString(explanation),
        imageURL: imageURL || null,
        topics: topicIds,
        difficulty: selectedDifficulty,
        createdAt: serverTimestamp(),
        createdBy: user?.email
      });

      toast.success("Question Added!");
      setQText(""); setOptions(["", "", "", ""]); setExplanation("");
      setCorrectOpt(0); setQuestionImage(null); setQuestionImagePreview("");
      setSelectedTopics([]); setSelectedDifficulty('medium');
    } catch (e: any) {
      console.error(e);
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

    // Skip blank lines and chapter headers
    if (!trimmed) continue;
    if (/^CHAPTER\s+\d+:/i.test(trimmed)) continue;

    // ── New question: starts with "1)" or "1." ──────────────────────────
    if (/^\d{1,3}[\).]\s*\S/.test(trimmed)) {
      // Save the previous question first
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

    // ── Option line: A) / A. / A) (with or without space) ───────────────
    if (/^[A-D][).]\s*.+/i.test(trimmed)) {
      if (!currentQuestion) {
        errors.push(`Line ${i + 1}: Option found without a question — "${trimmed.slice(0, 40)}"`);
        continue;
      }
      const optText = trimmed.replace(/^[A-D][).]\s*/i, "").trim();
      currentQuestion.options.push(optText);
      continue;
    }

    // ── Answer line ───────────────────────────────────────────────────────
    if (/^ANSWER\s*:\s*[A-D]/i.test(trimmed)) {
      if (!currentQuestion) {
        errors.push(`Line ${i + 1}: ANSWER found without a question.`);
        continue;
      }
      const letter = trimmed.match(/[A-D]/i)?.[0].toUpperCase();
      currentQuestion.correctOption = letter ? letter.charCodeAt(0) - 65 : -1;
      continue;
    }

    // ── Explanation line ──────────────────────────────────────────────────
    if (/^EXPLANATION\s*:\s*/i.test(trimmed)) {
      if (!currentQuestion) continue;
      currentQuestion.explanation = trimmed.replace(/^EXPLANATION\s*:\s*/i, "").trim();
      continue;
    }

    // ── Continuation line: append to last field ───────────────────────────
    // (handles multi-line question text or explanation)
    if (currentQuestion) {
      if (currentQuestion.correctOption === -1 && currentQuestion.options.length === 0) {
        // Still in question text
        currentQuestion.questionText += " " + trimmed;
      } else if (currentQuestion.correctOption !== -1) {
        // After answer — append to explanation
        currentQuestion.explanation += " " + trimmed;
      }
      // Lines between options and answer are ignored (usually subscript noise)
    }
  }

  // Don't forget the last question
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
    if (q.options.length !== 4) errors.push(`Question ${lineNum}: Must have exactly 4 options (A, B, C, D). Found ${q.options.length}.`);
    if (q.correctOption === -1) errors.push(`Question ${lineNum}: Missing answer or invalid answer format.`);
    return { valid: errors.length === 0, errors };
  };

  const handleBulkUpload = async () => {
    if (parsedQuestions.length === 0) { toast.error("No valid questions to upload. Please parse your text first."); return; }
    if (!bulkSubject) { toast.error("Please select a subject."); return; }

    setLoading(true);
    try {
      const imageCount = Object.keys(bulkImages).length;
      if (imageCount > 0) toast.info(`Uploading ${imageCount} image(s)...`);

      const imageResults = await Promise.all(
        parsedQuestions.map(async (_, idx) => {
          if (bulkImages[idx]) {
            try {
              const url = await uploadImage(bulkImages[idx], `bulk_${Date.now()}_${idx}`);
              return { index: idx, url };
            } catch {
              toast.error(`Failed to upload image for question ${idx + 1}`);
              return { index: idx, url: null };
            }
          }
          return { index: idx, url: null };
        })
      );

      const imageURLs: {[key: number]: string | null} = {};
      imageResults.forEach(r => { imageURLs[r.index] = r.url; });
      if (imageCount > 0) toast.success("Images uploaded!");

      const batch = writeBatch(db);
      parsedQuestions.forEach((q, idx) => {
        const docRef = doc(collection(db, "questions"));
        batch.set(docRef, {
          subject: bulkSubject,
          questionText: q.questionText,   // already processed by handleParseBulk
          options: q.options,             // already processed
          correctOption: q.correctOption,
          explanation: q.explanation || "",
          imageURL: imageURLs[idx] || null,
          topics: [],
          difficulty: 'medium',
          createdAt: serverTimestamp(),
          createdBy: user?.email
        });
      });

      await batch.commit();
      toast.success(`Success! ${parsedQuestions.length} questions uploaded.`);
      setBulkText(""); setParsedQuestions([]); setBulkErrors([]);
      setBulkImages({}); setBulkImagePreviews({});
    } catch (e: any) {
      console.error(e);
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

        {/* ── CREATE SUBJECT (unchanged) ── */}
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

        {/* ── ADD SINGLE QUESTION (unchanged structure, math now processed on save) ── */}
        {activeTab === 'question' && (
          <form onSubmit={handleAddQuestion} className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><FileText className="text-emerald-600"/> Add New Question</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Subject</label>
              <select className="w-full p-3 border border-slate-300 rounded-xl outline-none capitalize focus:ring-2 focus:ring-emerald-500" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name} {sub.category && `(${sub.category})`}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Question Text
                <span className="ml-2 text-xs font-normal text-slate-500">Wrap formulas in $…$ e.g. <code className="bg-slate-100 px-1 rounded">$x^2 + 2x$</code></span>
              </label>
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
                  <Tag size={16}/>Topics <span className="text-slate-500 text-xs font-normal">(Select all that apply)</span>
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

        {/* ── BULK UPLOAD ── */}
       
{activeTab === "bulk" && (
  <div className="space-y-6">
    <div className="flex items-start justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <FileUp className="text-emerald-600" /> Bulk Question Upload
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Paste questions directly — even from PDFs. The cleaner fixes formatting
          artifacts automatically before parsing.
        </p>
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
EXPLANATION: Abuja has been the capital since 1991`}
      </pre>
      <p className="text-xs text-blue-700 mt-2">
        ✓ Paste directly from PDFs — duplicated variables, frac() notation, and
        subscript bleed are fixed automatically
        <br />
        ✓ Multiple chapters in one paste are supported
        <br />
        ✓ ANSWER: must include the letter (A, B, C, or D)
        <br />
        ✓ EXPLANATION: is optional
      </p>
    </div>

    {/* Subject Selection */}
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Select Subject
      </label>
      <select
        className="w-full p-3 border border-slate-300 rounded-xl outline-none capitalize focus:ring-2 focus:ring-emerald-500"
        value={bulkSubject}
        onChange={(e) => setBulkSubject(e.target.value)}
      >
        {subjects.map((sub) => (
          <option key={sub.id} value={sub.id}>
            {sub.name} {sub.category && `(${sub.category})`}
          </option>
        ))}
      </select>
    </div>

    {/* Paste Questions */}
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Paste Questions
      </label>
      <textarea
        rows={15}
        className="w-full p-4 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
        placeholder="Paste your questions here — PDF copy-paste is fine, the cleaner will fix formatting artifacts..."
        value={bulkText}
        onChange={(e) => {
          setBulkText(e.target.value);
          setShowCleaned(false); // reset cleaned notice on new paste
        }}
      />
    </div>

    <button
      onClick={handleParseBulk}
      className="w-full px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition"
    >
      Clean & Parse Questions
    </button>


    {showCleaned && (
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-amber-900 flex items-center gap-2">
            ✨ Formatting artifacts were automatically cleaned before parsing
          </p>
          <button
            onClick={() => setShowCleaned((v) => !v)}
            className="text-xs text-amber-700 underline"
          >
            {showCleaned ? "Hide cleaned text" : "Show cleaned text"}
          </button>
        </div>
        <details>
          <summary className="text-xs text-amber-700 cursor-pointer">
            View cleaned text used for parsing
          </summary>
          <pre className="text-xs text-amber-800 font-mono bg-white p-3 rounded border border-amber-200 mt-2 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
            {cleanedPreview}
          </pre>
        </details>
      </div>
    )}

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
        <p className="text-xs text-red-700 mt-3 border-t border-red-200 pt-2">
          💡 Tip: Check the "View cleaned text" above to see what the parser
          actually received. The most common remaining issue is options that
          didn't get a blank line between them.
        </p>
      </div>
    )}

    {/* Preview with Image Upload */}
    {parsedQuestions.length > 0 && (
      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
        <p className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
          <CheckCircle size={16} />
          {parsedQuestions.length} Valid Question(s) Ready
        </p>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {parsedQuestions.map((q, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-lg border border-emerald-200"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="font-bold text-slate-900 flex-1">
                  {idx + 1}. {q.questionText}
                </p>

                {/* Image Upload for this question */}
                <div className="ml-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleBulkImageSelect(idx, e)}
                    className="hidden"
                    id={`bulk-image-${idx}`}
                  />
                  <label
                    htmlFor={`bulk-image-${idx}`}
                    className="cursor-pointer px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition flex items-center gap-1"
                  >
                    <ImageIcon size={14} />
                    {bulkImages[idx] ? "Change" : "Add"} Image
                  </label>
                </div>
              </div>

              {/* Image Preview */}
              {bulkImagePreviews[idx] && (
                <div className="mb-3 relative inline-block">
                  <img
                    src={bulkImagePreviews[idx]}
                    alt={`Question ${idx + 1}`}
                    className="w-40 h-40 object-cover rounded-lg border-2 border-blue-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeBulkImage(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mb-2">
                {q.options.map((opt: string, optIdx: number) => (
                  <p
                    key={optIdx}
                    className={`text-sm p-2 rounded ${
                      optIdx === q.correctOption
                        ? "bg-emerald-100 text-emerald-900 font-bold"
                        : "text-slate-600"
                    }`}
                  >
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
          {loading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
          {loading
            ? "Uploading..."
            : `Upload ${parsedQuestions.length} Questions ${
                Object.keys(bulkImages).length > 0
                  ? `(${Object.keys(bulkImages).length} with images)`
                  : ""
              }`}
        </button>
      </div>
    )}
  </div>
)}
      </div>
    </div>
  );
}