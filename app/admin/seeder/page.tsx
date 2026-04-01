"use client";
import { useState } from "react";
import { Loader2, ListTree, Tag, CheckCircle, Search, Wand2, Trash2, Download, Database, FileJson, FileText, Archive } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

const SUBJECT_TOPICS: Record<string, string[]> = {
  mathematics: ['Numbers & Arithmetic', 'Ratio & Proportion', 'Indices, Logs & Surds', 'Sets', 'Algebraic Expressions', 'Factorization', 'Quadratic Equations', 'Simultaneous Equations', 'Graphs', 'Rational Expressions', 'Inequalities', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics', 'Probability', 'Vectors'],
  physics: ['Measurement & Units', 'Motion', 'Equilibrium of Forces', 'Work, Energy & Power', 'Simple Machines', 'Elasticity', 'Hydrostatics', 'Temperature & Thermal Expansion', 'Heat & Vapours', 'Molecular Theory', 'Waves & Sound', 'Light (Reflection/Refraction)', 'Electrostatics', 'Current Electricity', 'Magnetism', 'Electromagnetism', 'Atomic Physics'],
  chemistry: ['Particulate Nature of Matter', 'Stoichiometry', 'Gas Laws', 'Atomic Structure', 'Periodic Table', 'Chemical Bonding', 'Thermodynamics', 'Chemical Kinetics', 'Equilibrium', 'Acids, Bases & Salts', 'Electrochemistry', 'Organic Chemistry', 'Metals & Non-Metals', 'Nuclear Chemistry'],
  biology: ['Living Organisms', 'Cell Biology', 'Nutrition', 'Transport System', 'Respiration', 'Excretion', 'Regulation & Homeostasis', 'Reproduction', 'Genetics', 'Ecology', 'Evolution'],
  english: ['Oral English', 'Comprehension', 'Summary', 'Lexis & Structure', 'Essay Writing'],
  literature: ['Drama', 'Prose', 'Poetry', 'Shakespeare', 'Literary Appreciation', 'African Literature', 'Non-African Literature'],
  economics: ['Basic Concepts', 'Economic Systems', 'Production', 'Market Structures', 'Money & Inflation', 'Financial Institutions', 'Public Finance', 'International Trade', 'Economic Development'],
  government: ['Concepts of Government', 'Political Parties', 'Electoral Process', 'Public Administration', 'Pre-Colonial Administration', 'Colonial Administration', 'Constitutional Development', 'International Organizations'],
  accounting: ['Book Keeping', 'Final Accounts', 'Partnership', 'Company Accounts', 'Public Sector Accounting', 'Manufacturing Accounts'],
  commerce: ['Occupation', 'Trade', 'Business Organization', 'Banking & Finance', 'Transportation', 'Communication', 'Insurance', 'Advertising', 'Marketing']
};

const TOPIC_KEYWORDS: Record<string, Record<string, string[]>> = {
  mathematics: {
    'quadratic-equations':      ['quadratic', 'x²', 'x^2', 'discriminant', 'completing the square'],
    'simultaneous-equations':   ['simultaneous', 'solve the equations', 'find x and y'],
    'indices,-logs-&-surds':    ['logarithm', 'log ', 'ln ', 'indices', 'surd', 'index', 'exponent', 'laws of indices'],
    'ratio-&-proportion':       ['ratio', 'proportion', 'direct variation', 'inverse variation', 'shared in ratio'],
    'numbers-&-arithmetic':     ['lcm', 'hcf', 'prime', 'integer', 'decimal', 'place value', 'divisib', 'number line', 'base ten'],
    'sets':                     ['union', 'intersection', 'complement', 'subset', 'venn', 'universal set'],
    'algebraic-expressions':    ['expand', 'simplify', 'expression', 'polynomial', 'binomial', 'algebraic'],
    'factorization':            ['factoris', 'factori', 'common factor', 'difference of two squares'],
    'graphs':                   ['graph', 'gradient', 'slope', 'intercept', 'plot', 'sketch', 'coordinate'],
    'rational-expressions':     ['rational', 'partial fraction', 'numerator', 'denominator'],
    'inequalities':             ['inequality', 'inequalities', 'greater than', 'less than', 'range of values'],
    'geometry':                 ['angle', 'triangle', 'circle', 'polygon', 'perimeter', 'area', 'volume', 'rectangle', 'square', 'parallel', 'perpendicular', 'chord', 'tangent', 'arc', 'sector', 'diameter', 'radius', 'circumference', 'cube', 'cylinder', 'cone', 'sphere', 'prism', 'bearing', 'locus'],
    'trigonometry':             ['sin', 'cos', 'tan', 'trigon', 'angle of elevation', 'angle of depression', 'cosine rule', 'sine rule', 'pythagoras'],
    'calculus':                 ['differentiat', 'integrat', 'dy/dx', 'derivative', 'rate of change', 'd/dx', 'turning point'],
    'statistics':               ['mean', 'median', 'mode', 'average', 'frequency', 'histogram', 'variance', 'standard deviation', 'ogive', 'class interval'],
    'probability':              ['probability', 'likely', 'chance', 'random', 'sample space', 'dice', 'coin', 'draw a ball'],
    'vectors':                  ['vector', 'magnitude', 'position vector', 'resultant'],
  },
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function assignTopics(subject: string, questionText: string, explanation: string = ""): string[] {
  const keywordMap = TOPIC_KEYWORDS[subject];
  if (!keywordMap) return [];
  const text = (questionText + " " + explanation).toLowerCase();
  const matched: string[] = [];
  for (const [topicId, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(kw => text.includes(kw.toLowerCase()))) matched.push(topicId);
  }
  return matched;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function toCSV(rows: Record<string, any>[]): string {
  if (rows.length === 0) return "";
  const allKeys = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const escape = (v: any) => {
    const s = typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
    return `"${s.replace(/"/g, '""')}"`;
  };
  return allKeys.map(escape).join(",") + "\n" + rows.map(r => allKeys.map(k => escape(r[k])).join(",")).join("\n");
}

export default function TopicSeeder() {
  const [loading, setLoading] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [tagging, setTagging] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("mathematics");

  const [exportTab, setExportTab] = useState<"collection" | "full">("collection");
  const [exportCollectionName, setExportCollectionName] = useState("questions");
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
  const [exportSubjectFilter, setExportSubjectFilter] = useState<string>("all");

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev]);
  const isBusy = loading || auditing || tagging || clearing || clearingAll || exporting;

  const apiRequest = async (path: string, method = 'GET', body?: any) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const auditTopics = async () => {
    setAuditing(true); setLogs([]);
    addLog(`🔍 Auditing questions for: ${selectedSubject}...`);
    try {
      const data: any = await apiRequest(`/questions/admin?subjectId=${selectedSubject}&limit=1000`);
      const questions = data.data || data.results || data;
      
      addLog(`📦 ${questions.length} questions fetched`);
      let noTopics = 0;
      const topicCounts: Record<string, number> = {};
      
      questions.forEach((q: any) => {
        if (!q.topics || q.topics.length === 0) noTopics++;
        else q.topics.forEach((t: string) => { topicCounts[t] = (topicCounts[t] || 0) + 1; });
      });

      if (noTopics > 0) addLog(`⚠️  ${noTopics} questions have NO topics`);
      Object.entries(topicCounts).sort((a,b) => b[1]-a[1]).forEach(([t,c]) => addLog(`  "${t}"  →  ${c}`));
    } catch (e: any) {
      addLog(`❌ Error: ${e.message}`);
    } finally { setAuditing(false); }
  };

  const processBatchTagging = async (subject: string, mode: 'clear-gen' | 'clear-all' | 'auto') => {
    setLogs([]);
    addLog(`🤖 Starting ${mode} for: ${subject}...`);
    try {
      const data: any = await apiRequest(`/questions/admin?subjectId=${subject}&limit=2000`);
      const questions = data.data || data.results || data;
      
      let count = 0;
      for (const q of questions) {
        let newTopics = q.topics || [];
        
        if (mode === 'clear-all') newTopics = [];
        else if (mode === 'clear-gen' && newTopics.length === 1 && newTopics[0] === 'general') newTopics = [];
        else if (mode === 'auto' && newTopics.length === 0) {
            newTopics = assignTopics(subject, q.questionText, q.explanation);
            if (newTopics.length === 0) newTopics = ['general'];
} else continue;

        await apiRequest(`/questions/admin/${q.id || q._id}`, 'PATCH', { topics: newTopics });
        count++;
        if (count % 10 === 0) addLog(`⏳ Processed ${count}/${questions.length}...`);
await sleep(100);
      }
      addLog(`✅ Successfully updated ${count} questions.`);
    } catch (e: any) {
      addLog(`❌ Error: ${e.message}`);
    }
  };

  const syncTopicsToSubjects = async () => {
    setLoading(true); setLogs([]);
    addLog("🚀 Syncing topic arrays to subjects collection...");
    try {
      for (const [id, list] of Object.entries(SUBJECT_TOPICS)) {
        await apiRequest(`/subjects/admin/${id}`, 'PATCH', { topics: list });
        addLog(`✅ ${id} synced.`);
      }
      toast.success("Topics synced successfully!");
    } catch (e: any) {
      addLog(`❌ Error: ${e.message}`);
    } finally { setLoading(false); }
  };

  const handleExport = async (isFull: boolean) => {
    setExporting(true); setLogs([]);
    addLog(isFull ? "🗄️  Starting FULL export..." : `📤 Exporting: ${exportCollectionName}`);
    
    const routeMap: Record<string, string> = {
      questions: '/questions/admin?limit=2000',
      subjects: '/subjects',
      users: '/users/admin?limit=2000',
      results: '/test-results/admin?limit=2000',
      sessions: '/credit-usage/admin?limit=2000'
    };

    try {
      if (isFull) {
        const fullData: any = { _meta: { exportedAt: new Date().toISOString() } };
        for (const key of Object.keys(routeMap)) {
          addLog(`Fetching ${key}...`);
          const res = await apiRequest(routeMap[key]);
          fullData[key] = res.data || res.results || res;
        }
        downloadFile(JSON.stringify(fullData, null, 2), `full_backup_${Date.now()}.json`, 'application/json');
      } else {
        let path = routeMap[exportCollectionName];
        if (exportCollectionName === 'questions' && exportSubjectFilter !== 'all') path += `&subjectId=${exportSubjectFilter}`;
        const res = await apiRequest(path);
        const data = res.data || res.results || res;
        const content = exportFormat === 'json' ? JSON.stringify(data, null, 2) : toCSV(data);
        downloadFile(content, `${exportCollectionName}.${exportFormat}`, exportFormat === 'json' ? 'application/json' : 'text/csv');
      }
      addLog("🎉 Export Successful!");
    } catch (e: any) {
      addLog(`❌ Export failed: ${e.message}`);
    } finally { setExporting(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Topic Manager Card ── */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
          <div className="text-center mb-8">
            <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ListTree size={32} className="text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Topic Manager</h1>
            <p className="text-slate-500 text-sm">Audit, auto-tag, and sync topics across your bank.</p>
          </div>

          <div className="mb-6">
            <label className="text-sm font-bold text-slate-700 block mb-2">Select Subject</label>
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} disabled={isBusy} className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-emerald-500">
              {Object.keys(SUBJECT_TOPICS).map(sub => (<option key={sub} value={sub}>{sub}</option>))}
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
             <button onClick={auditTopics} disabled={isBusy} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md">
                {auditing ? <Loader2 className="animate-spin" size={16}/> : <Search size={16}/>} Audit
             </button>
             <button onClick={() => processBatchTagging(selectedSubject, 'clear-gen')} disabled={isBusy} className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md">
                {clearing ? <Loader2 className="animate-spin" size={16}/> : <Trash2 size={16}/>} Clear Gen
             </button>
             <button onClick={() => processBatchTagging(selectedSubject, 'clear-all')} disabled={isBusy} className="bg-red-800 hover:bg-red-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md">
                {clearingAll ? <Loader2 className="animate-spin" size={16}/> : <Trash2 size={16}/>} Clear All
             </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
             <button onClick={() => processBatchTagging(selectedSubject, 'auto')} disabled={isBusy} className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md">
                {tagging ? <Loader2 className="animate-spin" size={16}/> : <Wand2 size={16}/>} Auto-Tag
             </button>
             <button onClick={syncTopicsToSubjects} disabled={isBusy} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md">
                {loading ? <Loader2 className="animate-spin" size={16}/> : <Tag size={16}/>} Sync
             </button>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 h-80 overflow-y-auto font-mono text-xs border border-slate-700 shadow-inner">
            {logs.length === 0 ? <p className="text-slate-500 text-center mt-28">Ready for audit...</p> : 
              logs.map((log, i) => (<p key={i} className={`mb-1 ${log.includes("❌") ? "text-red-400" : log.includes("✅") ? "text-emerald-400" : "text-slate-300"}`}>{log}</p>))
            }
          </div>
        </div>

        {/* ── Export Card ── */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
          <div className="text-center mb-8">
            <div className="bg-amber-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"><Database size={32} className="text-amber-600" /></div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Database Export</h2>
            <p className="text-slate-500 text-sm">Download your API data for backup.</p>
          </div>

          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            <button onClick={() => setExportTab("collection")} className={`flex-1 py-2.5 text-sm font-bold rounded-lg ${exportTab === "collection" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Collection</button>
            <button onClick={() => setExportTab("full")} className={`flex-1 py-2.5 text-sm font-bold rounded-lg ${exportTab === "full" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Full DB</button>
          </div>

          {exportTab === "collection" ? (
            <div className="space-y-4">
              <select value={exportCollectionName} onChange={(e) => setExportCollectionName(e.target.value)} disabled={isBusy} className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white outline-none">
                <option value="questions">Questions</option>
                <option value="subjects">Subjects</option>
                <option value="users">Users</option>
                <option value="results">Test Results</option>
                <option value="sessions">Credit Usage</option>
              </select>
              
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setExportFormat("json")} className={`py-3 rounded-xl border-2 font-bold text-sm ${exportFormat === "json" ? "border-amber-500 bg-amber-50" : "border-slate-200"}`}>JSON</button>
                <button onClick={() => setExportFormat("csv")} className={`py-3 rounded-xl border-2 font-bold text-sm ${exportFormat === "csv" ? "border-amber-500 bg-amber-50" : "border-slate-200"}`}>CSV</button>
              </div>

              <button onClick={() => handleExport(false)} disabled={isBusy} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md">
                {exporting ? <Loader2 className="animate-spin" size={16}/> : <Download size={16}/>} Download
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-sm text-slate-500 px-10">Exports all collections into a single JSON file including metadata.</p>
              <button onClick={() => handleExport(true)} disabled={isBusy} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md">
                {exporting ? <Loader2 className="animate-spin" size={16}/> : <Archive size={16}/>} Export Full Database
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}