"use client";

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, Clock, Search, BookOpen } from 'lucide-react';
import { ThemeToggle } from '@/app/components/theme-toggle';

interface Article {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  readTime: number;
  featured: boolean;
  publishedAt: string;
}

const CATEGORIES = ["All", "Exam Strategy", "Subject Tips", "Study Skills", "News & Updates"];

const categoryColors: Record<string, string> = {
  "Exam Strategy":  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Subject Tips":   "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "Study Skills":   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "News & Updates": "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const categoryDot: Record<string, string> = {
  "Exam Strategy":  "bg-emerald-400",
  "Subject Tips":   "bg-teal-400",
  "Study Skills":   "bg-amber-400",
  "News & Updates": "bg-blue-400",
};

const ArticleCard = ({ article, index }: { article: Article; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.07 }}
  >
    <Link href={`/blog/${article.slug}`} className="group block h-full">
      <div className="h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[1.5rem] p-7 flex flex-col gap-5 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-300 relative overflow-hidden shadow-sm dark:shadow-none">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/[0.06] dark:group-hover:from-emerald-500/5 group-hover:to-teal-500/[0.06] dark:group-hover:to-teal-500/5 transition-all duration-500 rounded-[1.5rem]" />
        <div className="relative z-10 flex flex-col gap-4 flex-grow">
          <span className={`self-start text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${categoryColors[article.category] ?? 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'}`}>
            {article.category}
          </span>
          <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
            {article.title}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed flex-grow">{article.excerpt}</p>
        </div>
        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-500 text-xs">
            <span className="flex items-center gap-1.5"><Clock size={12} />{article.readTime} min read</span>
            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span>{new Date(article.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <ArrowRight size={16} className="text-slate-400 dark:text-slate-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  </motion.div>
);

const FeaturedCard = ({ article }: { article: Article }) => (
  <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
    <Link href={`/blog/${article.slug}`} className="group block">
      <div className="relative bg-emerald-600 rounded-[2rem] p-10 md:p-14 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 right-40 w-48 h-48 bg-teal-400/20 rounded-full blur-2xl" />
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/20 text-white border border-white/20">Featured</span>
            <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 text-emerald-100 border border-white/10">{article.category}</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight mb-4 group-hover:text-emerald-100 transition-colors">{article.title}</h2>
          <p className="text-emerald-100/80 leading-relaxed mb-8 text-base">{article.excerpt}</p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 font-bold rounded-xl text-sm group-hover:bg-emerald-50 transition-colors">
            Read Article <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
);

export default function BlogClient({ articles }: { articles: Article[] }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const featured = articles.find(a => a.featured);
  const filtered = articles.filter(a => {
    const matchCat = activeCategory === "All" || a.category === activeCategory;
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
                        a.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch && !a.featured;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans flex flex-col overflow-x-hidden">

      {/* Navbar */}
      <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.8 }} className="fixed w-full z-50 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight flex items-center gap-2">
            <ShieldCheck size={24} /> Sure Prep
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="hidden md:block px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Login</Link>
            <Link href="/register" className="px-5 py-2.5 text-sm font-bold bg-emerald-600 dark:bg-emerald-500 text-white rounded-full hover:bg-emerald-700 dark:hover:bg-emerald-400 transition-all active:scale-95">Get Started</Link>
          </div>
        </div>
      </motion.nav>

      <main className="flex-grow pt-28 pb-24">

        {/* Header */}
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-16 relative">
          <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl" />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-emerald-600 dark:text-emerald-400 font-mono text-sm uppercase tracking-[0.2em] mb-5">— Study Resources</p>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
                Tips, guides &<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">exam playbooks.</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400 max-w-xs text-sm leading-relaxed">Written for Nigerian students. No fluff — just things that actually help you score higher.</p>
            </div>
          </motion.div>
        </section>

        {/* Search + Filter */}
        <section className="max-w-7xl mx-auto px-6 mb-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input type="text" placeholder="Search articles..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeCategory === cat ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white'}`}>
                  {cat !== "All" && <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${categoryDot[cat]}`} />}
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Featured */}
        {featured && activeCategory === "All" && !search && (
          <section className="max-w-7xl mx-auto px-6"><FeaturedCard article={featured} /></section>
        )}

        {/* Grid */}
        <section className="max-w-7xl mx-auto px-6">
          {articles.length === 0 ? (
            <div className="text-center py-24 text-slate-500 dark:text-slate-500">
              <BookOpen size={40} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">No articles published yet.</p>
              <p className="text-xs">Check back soon — content is on the way.</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((article, i) => <ArticleCard key={article._id} article={article} index={i} />)}
            </div>
          ) : (
            <div className="text-center py-24 text-slate-500 dark:text-slate-500">
              <BookOpen size={40} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm text-slate-700 dark:text-slate-300">No articles found. Try a different search or category.</p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-white/5 py-8 bg-white dark:bg-transparent">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-500">
          <Link href="/" className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><ShieldCheck size={16} /> Sure Prep</Link>
          <p>&copy; {new Date().getFullYear()} Sure Prep. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/faq" className="hover:text-slate-800 dark:hover:text-slate-300">FAQ</Link>
            <Link href="#" className="hover:text-slate-800 dark:hover:text-slate-300">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}