"use client";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, AlertCircle, Play } from "lucide-react";

export default function MockSetup() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. Fetch available subjects
  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const snap = await getDocs(collection(db, "subjects"));
        const data = snap.docs.map(doc => doc.data());
        setSubjects(data);
        
        // Auto-select English if it exists
        const eng = data.find(s => s.id.includes("english"));
        if (eng) setSelected([eng.id]);
        
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubs();
  }, []);

  // 2. Handle Selection
  const toggleSubject = (id: string) => {
    // English is usually compulsory, prevent deselecting if you want strict JAMB rules
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id));
    } else {
      if (selected.length >= 4) return; // Max 4
      setSelected([...selected, id]);
    }
  };

  const startMock = () => {
    if (selected.length !== 4) return;
    // Encode subjects into URL: /dashboard/mock/play?subs=english,maths,physics,chem
    const query = selected.join(",");
    router.push(`/dashboard/mock/play?subs=${query}`);
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-emerald-600"/></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">JAMB Mock Setup</h1>
        <p className="text-slate-500">Select your 4 subject combination.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-lg text-slate-800">Available Subjects</h2>
          <span className={`text-sm font-bold ${selected.length === 4 ? 'text-emerald-600' : 'text-slate-400'}`}>
            {selected.length}/4 Selected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {subjects.map((sub) => {
            const isSelected = selected.includes(sub.id);
            return (
              <button
                key={sub.id}
                onClick={() => toggleSubject(sub.id)}
                className={`p-4 rounded-xl border-2 text-left flex items-center justify-between transition-all
                  ${isSelected 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900' 
                    : 'border-slate-100 hover:border-slate-300 text-slate-600'
                  }
                `}
              >
                <span className="font-bold capitalize">{sub.name}</span>
                {isSelected && <CheckCircle size={20} className="text-emerald-600"/>}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <AlertCircle size={16} />
            <span>Standard Time: 2 Hours (120 Mins)</span>
          </div>
          
          <button 
            onClick={startMock}
            disabled={selected.length !== 4}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            Start Exam <Play size={18} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}