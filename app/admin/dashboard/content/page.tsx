"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/app/lib/firebase";
import { collection, addDoc, setDoc, doc, serverTimestamp, getDocs, query, writeBatch } from "firebase/firestore";
import { uploadToCloudinary } from "@/app/lib/imageUpload";
import { PlusCircle, Save, FileText, LayoutGrid, Loader2, Upload, FileUp, CheckCircle, AlertCircle, Beaker, Palette, Calculator, Globe, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";

export default function ContentManager() {
  const { user } = useAuth();
  // REMOVED: const storage = getStorage(); ← This was causing the error
  
  // State
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Image must be less than 5MB");
        return;
      }
      setQuestionImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQuestionImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBulkImageSelect = (questionIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      
      setBulkImages(prev => ({...prev, [questionIndex]: file}));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setBulkImagePreviews(prev => ({...prev, [questionIndex]: reader.result as string}));
      };
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

  // FIXED: Now uses Cloudinary instead of Firebase Storage
  const uploadImage = async (file: File, questionId: string): Promise<string> => {
    try {
      // Upload to Cloudinary
      const imageURL = await uploadToCloudinary(file, 'questions');
      return imageURL;
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
        id: id,
        name: subName,
        color: subColor,
        category: subCategory,
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
      
      // If there's an image, upload it to Cloudinary
      if (questionImage) {
        toast.info("Uploading image...");
        const tempId = `question_${Date.now()}`;
        imageURL = await uploadImage(questionImage, tempId);
        toast.success("Image uploaded!");
      }

      await addDoc(collection(db, "questions"), {
        subject: selectedSubject,
        questionText: qText,
        options: options,
        correctOption: Number(correctOpt),
        explanation: explanation,
        imageURL: imageURL || null,
        createdAt: serverTimestamp(),
        createdBy: user?.email
      });

      toast.success("Question Added!");
      setQText("");
      setOptions(["", "", "", ""]);
      setExplanation("");
      setCorrectOpt(0);
      setQuestionImage(null);
      setQuestionImagePreview("");
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
      // Upload images first and get URLs
      const imageCount = Object.keys(bulkImages).length;
      if (imageCount > 0) {
        toast.info(`Uploading ${imageCount} image(s)...`);
      }

      const imageUploadPromises = parsedQuestions.map(async (q, idx) => {
        if (bulkImages[idx]) {
          try {
            const tempId = `bulk_${Date.now()}_${idx}`;
            const url = await uploadImage(bulkImages[idx], tempId);
            return { index: idx, url };
          } catch (error) {
            console.error(`Failed to upload image for question ${idx + 1}:`, error);
            toast.error(`Failed to upload image for question ${idx + 1}`);
            return { index: idx, url: null };
          }
        }
        return { index: idx, url: null };
      });
      
      const imageResults = await Promise.all(imageUploadPromises);
      const imageURLs: {[key: number]: string | null} = {};
      imageResults.forEach(result => {
        imageURLs[result.index] = result.url;
      });
      
      if (imageCount > 0) {
        toast.success("Images uploaded!");
      }

      // Add questions to Firestore batch
      const batch = writeBatch(db);
      
      parsedQuestions.forEach((q, idx) => {
        const docRef = doc(collection(db, "questions"));
        batch.set(docRef, {
          subject: bulkSubject,
          questionText: q.questionText,
          options: q.options,
          correctOption: q.correctOption,
          explanation: q.explanation || "",
          imageURL: imageURLs[idx] || null,
          createdAt: serverTimestamp(),
          createdBy: user?.email
        });
      });

      await batch.commit();

      toast.success(`Success! ${parsedQuestions.length} questions uploaded.`);
      setBulkText("");
      setParsedQuestions([]);
      setBulkErrors([]);
      setBulkImages({});
      setBulkImagePreviews({});
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

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        
        {/* CREATE SUBJECT */}
        {activeTab === 'subject' && (
          <form onSubmit={handleCreateSubject} className="space-y-6 max-w-2xl">
             <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <LayoutGrid className="text-emerald-600"/> New Exam Subject
             </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <option value="bg-red-100 text-red-600">Red</option>
                  <option value="bg-indigo-100 text-indigo-600">Indigo</option>
                  <option value="bg-teal-100 text-teal-600">Teal</option>
                  <option value="bg-pink-100 text-pink-600">Pink</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Subject Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setSubCategory('sciences')}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    subCategory === 'sciences'
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <Beaker className={`mx-auto mb-2 ${subCategory === 'sciences' ? 'text-blue-600' : 'text-slate-400'}`} size={24} />
                  <p className={`text-sm font-bold ${subCategory === 'sciences' ? 'text-blue-900' : 'text-slate-600'}`}>Sciences</p>
                  {subCategory === 'sciences' && (
                    <CheckCircle className="mx-auto mt-2 text-blue-600" size={16} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSubCategory('arts')}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    subCategory === 'arts'
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <Palette className={`mx-auto mb-2 ${subCategory === 'arts' ? 'text-purple-600' : 'text-slate-400'}`} size={24} />
                  <p className={`text-sm font-bold ${subCategory === 'arts' ? 'text-purple-900' : 'text-slate-600'}`}>Arts</p>
                  {subCategory === 'arts' && (
                    <CheckCircle className="mx-auto mt-2 text-purple-600" size={16} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSubCategory('commercial')}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    subCategory === 'commercial'
                      ? 'border-green-500 bg-green-50 shadow-lg'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <Calculator className={`mx-auto mb-2 ${subCategory === 'commercial' ? 'text-green-600' : 'text-slate-400'}`} size={24} />
                  <p className={`text-sm font-bold ${subCategory === 'commercial' ? 'text-green-900' : 'text-slate-600'}`}>Commercial</p>
                  {subCategory === 'commercial' && (
                    <CheckCircle className="mx-auto mt-2 text-green-600" size={16} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSubCategory('general')}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    subCategory === 'general'
                      ? 'border-slate-500 bg-slate-50 shadow-lg'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <Globe className={`mx-auto mb-2 ${subCategory === 'general' ? 'text-slate-600' : 'text-slate-400'}`} size={24} />
                  <p className={`text-sm font-bold ${subCategory === 'general' ? 'text-slate-900' : 'text-slate-600'}`}>General</p>
                  {subCategory === 'general' && (
                    <CheckCircle className="mx-auto mt-2 text-slate-600" size={16} />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {subCategory === 'sciences' && '📚 Science subjects: Physics, Chemistry, Biology, Mathematics'}
                {subCategory === 'arts' && '🎨 Arts subjects: Literature, Government, History, CRS/IRS'}
                {subCategory === 'commercial' && '💼 Commercial subjects: Accounting, Economics, Commerce'}
                {subCategory === 'general' && '🌍 General subjects: Available to all students (English, Languages, Computer Studies)'}
              </p>
            </div>

            <button disabled={loading} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition w-full flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Creating...
                </>
              ) : (
                <>
                  <PlusCircle size={18} />
                  Create Subject
                </>
              )}
            </button>
          </form>
        )}

        {/* ADD SINGLE QUESTION WITH IMAGE SUPPORT */}
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
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} {sub.category && `(${sub.category})`}
                  </option>
                ))}
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

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Question Image <span className="text-slate-500 text-xs">(Optional - for diagrams, graphs, etc.)</span>
              </label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-emerald-500 transition flex items-center justify-center gap-2 text-slate-600 hover:text-emerald-600"
                  >
                    <ImageIcon size={20} />
                    {questionImage ? "Change Image" : "Upload Image"}
                  </button>
                </div>
                {questionImagePreview && (
                  <div className="relative">
                    <img src={questionImagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-xl border-2 border-slate-200" />
                    <button
                      type="button"
                      onClick={() => {
                        setQuestionImage(null);
                        setQuestionImagePreview("");
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
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

        {/* BULK UPLOAD WITH IMAGE SUPPORT */}
        {activeTab === 'bulk' && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileUp className="text-emerald-600"/> Bulk Question Upload
                </h2>
                <p className="text-sm text-slate-500 mt-1">Paste questions, then optionally add images.</p>
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
                ✓ EXPLANATION: is optional<br/>
                ✓ After parsing, you can add images to specific questions
              </p>
            </div>

            {/* Subject Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Subject</label>
              <select 
                className="w-full p-3 border border-slate-300 rounded-xl outline-none capitalize focus:ring-2 focus:ring-emerald-500"
                value={bulkSubject} onChange={e => setBulkSubject(e.target.value)}
              >
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} {sub.category && `(${sub.category})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Paste Questions */}
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

            {/* Preview with Image Upload */}
            {parsedQuestions.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                <p className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                  <CheckCircle size={16} />
                  {parsedQuestions.length} Valid Question(s) Ready
                </p>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {parsedQuestions.map((q, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-emerald-200">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-bold text-slate-900 flex-1">{idx + 1}. {q.questionText}</p>
                        
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
                  {loading ? "Uploading..." : `Upload ${parsedQuestions.length} Questions ${Object.keys(bulkImages).length > 0 ? `(${Object.keys(bulkImages).length} with images)` : ''}`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}