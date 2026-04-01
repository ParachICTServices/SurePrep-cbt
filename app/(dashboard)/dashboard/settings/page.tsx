"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { GraduationCap, School, Briefcase, Save, CheckCircle, Loader2, Beaker, Palette, Calculator, Globe } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

const EXAM_CATEGORIES = [
  {
    id: "senior" as const,
    label: "Senior Secondary (SS1-SS3)",
    description: "JAMB, WAEC, NECO - University & College Entry",
    icon: GraduationCap,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    exams: ["JAMB/UTME", "WAEC/SSCE", "NECO"],
    hasSpecialization: true,
    comingSoon: false
  },
  {
    id: "junior" as const,
    label: "Junior Secondary (JSS1-JSS3)",
    description: "Common Entrance, BECE, Junior WAEC",
    icon: School,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    exams: ["Common Entrance", "BECE", "Junior WAEC"],
    hasSpecialization: false,
    comingSoon: true
  },
  {
    id: "professional" as const,
    label: "Job Interview & Career",
    description: "Aptitude Tests, General Knowledge, Interview Prep",
    icon: Briefcase,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    exams: ["Job Aptitude", "Interview Prep", "General Knowledge"],
    hasSpecialization: false,
    comingSoon: true
  }
];

const SPECIALIZATIONS = [
  {
    id: "sciences" as const,
    label: "Sciences",
    description: "Physics, Chemistry, Biology, Mathematics",
    icon: Beaker,
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    id: "arts" as const,
    label: "Arts",
    description: "Literature, Government, CRS, History",
    icon: Palette,
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  {
    id: "commercial" as const,
    label: "Commercial",
    description: "Accounting, Commerce, Economics",
    icon: Calculator,
    color: "bg-green-100 text-green-700 border-green-200",
  },
  {
    id: "general" as const,
    label: "General / All Subjects",
    description: "Access all subjects across all fields",
    icon: Globe,
    color: "bg-slate-100 text-slate-700 border-slate-200",
  }
];

type ExamCategory = "senior" | "junior" | "professional";
type Specialization = "sciences" | "arts" | "commercial" | "general";

export default function SettingsPage() {
  const { user, refreshUser, loading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<ExamCategory>("senior");
  const [selectedSpecialization, setSelectedSpecialization] = useState<Specialization>("general");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setSelectedCategory(user.examCategory as ExamCategory || "senior");
      setSelectedSpecialization(user.specialization as Specialization || "general");
    }
  }, [user]);

  const selectedCategoryData = EXAM_CATEGORIES.find(cat => cat.id === selectedCategory);
  const showSpecialization = selectedCategoryData?.hasSpecialization;

  const hasChanges = 
    selectedCategory !== user?.examCategory || 
    selectedSpecialization !== user?.specialization;

  const handleSave = async () => {
    if (!user) {
      toast.error("User session not found");
      return;
    }
    
    setSaving(true);
    setSaveSuccess(false);

    try {
      const token = localStorage.getItem('auth_token');
      
      const payload: any = {
        examCategory: selectedCategory,
        specialization: selectedCategory === 'senior' ? selectedSpecialization : 'general'
      };

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      if (refreshUser) {
        await refreshUser();
      }

      setSaveSuccess(true);
      toast.success("Settings saved successfully!");
      
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to update settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryChange = (categoryId: ExamCategory) => {
    setSelectedCategory(categoryId);
    const category = EXAM_CATEGORIES.find(cat => cat.id === categoryId);
    if (!category?.hasSpecialization) {
      setSelectedSpecialization('general');
    }
  };

  const handleSpecializationChange = (specId: Specialization) => {
    setSelectedSpecialization(specId);
  };

  if (loading) return <div className="p-10 text-center">Loading Settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Account Settings</h1>
        <p className="text-slate-500">Manage your account preferences and exam category</p>
      </div>

      {/* Profile Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Profile Information</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-600 text-sm">Name</span>
            <span className="font-semibold text-slate-900">{user?.displayName || "Not set"}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-600 text-sm">Email</span>
            <span className="font-semibold text-slate-900">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-600 text-sm">Exam Category</span>
            <span className="font-semibold text-slate-900 capitalize">
              {user?.examCategory || "Not set"}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-600 text-sm">Specialization</span>
            <span className="font-semibold text-slate-900 capitalize">
              {user?.specialization || "Not set"}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-600 text-sm">Credits Available</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
              {user?.credits || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Exam Category Selection */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Exam Category</h2>
          <p className="text-slate-600 text-sm">Choose the type of exams you're preparing for.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {EXAM_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            const isDisabled = category.comingSoon;

            return (
              <button
                key={category.id}
                onClick={() => !isDisabled && handleCategoryChange(category.id)}
                disabled={isDisabled}
                className={`p-5 rounded-xl border-2 transition-all text-left group hover:shadow-lg relative overflow-hidden ${
                  isDisabled
                    ? "opacity-60 cursor-not-allowed border-slate-200 bg-slate-50"
                    : isSelected
                    ? "border-emerald-500 bg-emerald-50 shadow-md"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                {isDisabled && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                      COMING SOON
                    </span>
                  </div>
                )}
                <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center mb-4 ${isDisabled ? 'opacity-50' : ''}`}>
                  <Icon size={24} />
                </div>
                <h3 className={`font-bold text-slate-900 mb-1 ${isDisabled ? 'opacity-70' : ''}`}>{category.label}</h3>
                <p className={`text-xs text-slate-500 leading-relaxed mb-3 ${isDisabled ? 'opacity-70' : ''}`}>{category.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {category.exams.map((exam, idx) => (
                    <span key={idx} className={`text-[9px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full ${isDisabled ? 'opacity-50' : ''}`}>
                      {exam}
                    </span>
                  ))}
                </div>
                {isSelected && !isDisabled && (
                  <div className="flex items-center gap-1 text-emerald-600 text-sm font-bold">
                    <CheckCircle size={16} /> Currently Selected
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Specialization Selection */}
      {showSpecialization && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Subject Specialization</h2>
            <p className="text-slate-600 text-sm">Choose your subject track to filter subjects. Click a card to select.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SPECIALIZATIONS.map((spec) => {
              const Icon = spec.icon;
              const isSelected = selectedSpecialization === spec.id;
              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => handleSpecializationChange(spec.id)}
                  className={`p-5 rounded-xl border-2 transition-all text-left hover:shadow-lg ${
                    isSelected ? "border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-200" : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg ${spec.color} flex items-center justify-center flex-shrink-0`}><Icon size={24} /></div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1">{spec.label}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{spec.description}</p>
                      {isSelected && <div className="flex items-center gap-1 text-emerald-600 text-sm font-bold mt-2"><CheckCircle size={14} /> SELECTED</div>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Save Changes Banner */}
      {hasChanges && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900 mb-1">⚠️ You have unsaved changes</p>
              <p className="text-xs text-amber-700">Category: <strong>{selectedCategory}</strong> | Specialization: <strong>{selectedSpecialization}</strong></p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition disabled:bg-emerald-400 flex items-center gap-2 shadow-lg shadow-emerald-200 whitespace-nowrap"
            >
              {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><Save size={18} /> Save Changes</>}
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-emerald-600" size={24} />
            <div>
              <p className="text-sm font-bold text-emerald-900">Settings saved successfully!</p>
              <p className="text-xs text-emerald-700">Your preferences have been updated.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}