"use client";

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Plus, Minus, ArrowRight, Mail } from 'lucide-react';
import { ThemeToggle } from '@/app/components/theme-toggle';

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "Is Sure Prep free to use?",
        a: "Creating an account is free. To take tests, you purchase credits — each test costs a set amount of credits depending on the exam type. You only pay for what you actually use, and credits never expire, so there's no subscription pressure."
      },
      {
        q: "What exams does Sure Prep cover?",
        a: "Currently we cover JAMB CBT, WAEC (OBJ sections), NECO, and Post-UTME prep. We're actively adding more. If there's a specific exam you need, shoot us a message — we prioritise based on demand."
      },
      {
        q: "Do I need to download anything?",
        a: "Nothing. Sure Prep runs entirely in your browser — on your phone, tablet, or laptop. Open it, log in, and start practising. No app store, no installs."
      },
    ]
  },
  {
    category: "Practice & Features",
    questions: [
      {
        q: "How does the timed mock exam work?",
        a: "It mirrors the actual JAMB CBT experience — same time pressure, same question format, same interface feel. When the timer runs out, it stops. We then show you your score, how long you spent per question, and which topics cost you the most time."
      },
      {
        q: "Can I practise just one topic instead of a full exam?",
        a: "Absolutely — this is one of our most used features. Pick a subject, then filter down to a specific topic like 'Quadratic Equations' or 'Cell Biology'. You'll only get questions from that topic until you say otherwise."
      },
      {
        q: "What's the Speed Analytics feature exactly?",
        a: "Every question has an ideal time budget based on the real exam's overall timer. As you practise, we track whether you're spending too long on certain question types. Over time you'll see exactly where you're slow — and can drill those spots specifically."
      },
      {
        q: "How many questions are in the bank?",
        a: "We're building the bank actively. Right now there are thousands of questions sourced from official past papers. We add new ones regularly and every question is reviewed for accuracy before it goes live."
      },
    ]
  },
  {
    category: "Account & Credits",
    questions: [
      {
        q: "How does the credit system work?",
        a: "Credits are what you use to take tests on Sure Prep. Each exam or mock test costs a set number of credits. You buy credits in bundles, use them when you're ready, and they don't expire — so there's no pressure to rush through them."
      },
      {
        q: "How do I buy credits?",
        a: "Go to your dashboard and tap 'Buy Credits'. We support payment via card and bank transfer. Credits are added to your account instantly once payment is confirmed — no waiting, no manual approval."
      },
      {
        q: "How many credits does a test cost?",
        a: "It depends on the exam type. A standard subject practice session costs fewer credits than a full timed mock exam. You'll always see the credit cost before you start — no surprises."
      },
      {
        q: "Do credits expire?",
        a: "No. Credits you've purchased stay in your account until you use them. Take your time."
      },
      {
        q: "Can I share my credits with someone else?",
        a: "Credits are tied to your account and can't be transferred. Your progress and analytics are personal too — the whole point is tracking your own improvement. Your friend can create their own account and buy their own credits."
      },
    ]
  },
  {
    category: "Technical",
    questions: [
      {
        q: "Does it work on my phone?",
        a: "Yes — fully. We built mobile-first because that's what most Nigerian students are using. Everything works on a standard Android or iPhone browser without needing to install anything."
      },
      {
        q: "What if I lose internet mid-exam?",
        a: "We auto-save your progress as you go. If you drop connection and come back, you'll pick up where you left off. The timer pauses while you're disconnected."
      },
    ]
  }
];

const FAQItem = ({ q, a, index }: { q: string; a: string; index: number }) => {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="border-b border-slate-100 dark:border-slate-800 last:border-0"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-6 py-6 text-left group"
      >
        <span className={`font-semibold text-base leading-snug transition-colors ${open ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'}`}>
          {q}
        </span>
        <span className={`shrink-0 mt-0.5 h-6 w-6 rounded-full flex items-center justify-center transition-all ${open ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'}`}>
          {open ? <Minus size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-slate-500 dark:text-slate-400 leading-relaxed text-sm pr-10">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("Getting Started");

  const currentFAQs = faqs.find(f => f.category === activeCategory)?.questions || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col overflow-x-hidden">

      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed w-full z-50 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-emerald-100/50 dark:border-emerald-900/30"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight flex items-center gap-2">
            <ShieldCheck size={24} /> Sure Prep
          </Link>
          <div className="flex items-center gap-3 md:gap-4">
            <ThemeToggle />
            <Link href="/login" className="hidden md:block px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Login</Link>
            <Link href="/register" className="px-5 py-2.5 text-sm font-bold bg-emerald-600 text-white rounded-full hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 transition-all active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

      <main className="flex-grow pt-28 pb-24">

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-20 relative">
          {/* Background blob */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-300/10 rounded-full blur-3xl -z-10" />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-emerald-600 font-mono text-sm uppercase tracking-[0.2em] mb-5">— Help & FAQ</p>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-6">
              Questions?<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                We've got answers.
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl leading-relaxed">
              Everything you need to know about how Sure Prep works, what's free, and what happens when things go sideways.
            </p>
          </motion.div>
        </section>

        {/* FAQ Content */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">

            {/* Category Sidebar */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="md:col-span-3"
            >
              <div className="sticky top-28">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Categories</p>
                <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                  {faqs.map((section) => (
                    <button
                      key={section.category}
                      onClick={() => setActiveCategory(section.category)}
                      className={`shrink-0 text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        activeCategory === section.category
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100'
                      }`}
                    >
                      {section.category}
                    </button>
                  ))}
                </nav>

                {/* Contact nudge */}
                <div className="hidden md:block mt-12 p-6 bg-slate-900 text-white rounded-2xl">
                  <div className="h-10 w-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mb-4">
                    <Mail size={20} />
                  </div>
                  <p className="font-bold mb-2 text-sm">Still stuck?</p>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4">We're a small team and we actually respond. Usually within a few hours.</p>
                  <a href="mailto:help@Sure Prep.ng" className="text-emerald-400 text-xs font-bold hover:text-emerald-300 transition-colors">
                    help@Sure Prep.ng →
                  </a>
                </div>
              </div>
            </motion.aside>

            {/* Questions Panel */}
            <div className="md:col-span-9">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm px-8 md:px-12 py-4"
                >
                  <div className="pt-6 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{activeCategory}</h2>
                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{currentFAQs.length} questions</p>
                  </div>

                  {currentFAQs.map((item, i) => (
                    <FAQItem key={item.q} q={item.q} a={item.a} index={i} />
                  ))}
                </motion.div>
              </AnimatePresence>

              {/* Mobile contact */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="md:hidden mt-6 p-6 bg-slate-900 text-white rounded-2xl"
              >
                <p className="font-bold mb-1 text-sm">Still stuck?</p>
                <p className="text-slate-400 text-xs leading-relaxed mb-3">We actually respond. Usually within a few hours.</p>
                <a href="mailto:help@Sure Prep.ng" className="text-emerald-400 text-xs font-bold">help@Sure Prep.ng →</a>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="max-w-7xl mx-auto px-6 mt-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-emerald-600 rounded-[2rem] p-10 md:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden"
          >
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full" />
            <div className="absolute -bottom-16 right-32 w-48 h-48 bg-white/5 rounded-full" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">Ready to start?</h2>
              <p className="text-emerald-100/80 max-w-md">
                No payment needed to begin. Create an account and you're practising in under two minutes.
              </p>
            </div>
            <Link href="/register" className="relative z-10 shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 font-bold rounded-2xl hover:bg-emerald-50 transition-colors shadow-xl"
              >
                Create Free Account <ArrowRight size={18} />
              </motion.button>
            </Link>
          </motion.div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-8 mt-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
          <Link href="/" className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck size={16} /> Sure Prep
          </Link>
          <p>&copy; {new Date().getFullYear()} Sure Prep. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-slate-600 dark:hover:text-slate-300">Privacy Policy</Link>
            <Link href="#" className="hover:text-slate-600 dark:hover:text-slate-300">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}