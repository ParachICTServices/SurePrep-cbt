"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Users, Target, Heart, BookOpen } from 'lucide-react';
import { ThemeToggle } from '@/app/components/theme-toggle';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

const team = [
  {
    initial: "N",
    name: "Nosa Dr",
    role: "Founder & CEO",
    bio: "Former JAMB candidate who scored 312. Built SurePrep after struggling to find quality CBT practice resources.",
    color: "bg-emerald-500",
  },
  {
    initial: "A",
    name: "Amaka O.",
    role: "Head of Curriculum",
    bio: "10+ years teaching JAMB & WAEC subjects. Curates every question in the SurePrep database.",
    color: "bg-teal-500",
  },
  {
    initial: "D",
    name: "Dayo F.",
    role: "Lead Engineer",
    bio: "Built the real-time speed analytics engine that tracks your CBT pace question by question.",
    color: "bg-cyan-600",
  },
];

const values = [
  {
    icon: <Target size={24} />,
    title: "Student-first, always",
    desc: "Every feature we build starts with one question: does this help a Nigerian student pass their exam?",
  },
  {
    icon: <BookOpen size={24} />,
    title: "Quality over quantity",
    desc: "We'd rather have 12,000 well-curated questions than 100,000 random ones. Every question is reviewed.",
  },
  {
    icon: <Heart size={24} />,
    title: "Accessible education",
    desc: "We believe exam success shouldn't depend on how expensive your tutorial center is.",
  },
  {
    icon: <Users size={24} />,
    title: "Community-driven",
    desc: "Our students' scores, feedback, and struggles shape what we build next — always.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-x-hidden">

      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed w-full z-50 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight flex items-center gap-2">
            <ShieldCheck size={24} />Sure Prep
          </Link>
          <div className="flex items-center gap-3 md:gap-4">
            <ThemeToggle />
            <Link href="/login" className="hidden md:block px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Login</Link>
            <Link href="/register" className="px-5 py-2.5 text-sm font-bold bg-emerald-500 text-white rounded-full hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

      <main>

        {/* Hero */}
        <section className="relative bg-slate-950 text-white overflow-hidden pt-40 pb-28">
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
            backgroundSize: '20px 20px'
          }} />
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl" />

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="relative z-10 max-w-7xl mx-auto px-6 text-center"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2.5 mb-10">
              <span className="h-px w-8 bg-emerald-500/60" />
              <span className="text-emerald-400 font-mono text-xs uppercase tracking-[0.25em]">Our Story</span>
              <span className="h-px w-8 bg-emerald-500/60" />
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
              Built by students,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                for students.
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
              SurePrep started with one failed JAMB result and a determination to make sure no Nigerian student felt alone in their exam prep journey again.
            </motion.p>
          </motion.div>
        </section>

        {/* Mission */}
        <section className="py-24 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <p className="text-emerald-600 font-mono text-sm uppercase tracking-[0.2em] mb-4">— Why we exist</p>
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
                  Every student deserves a fair shot at their dream school.
                </h2>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                  Too many Nigerian students walk into JAMB underprepared — not because they didn't study, but because they couldn't afford the right resources. Private tutorials cost money. Good textbooks cost money. But a phone and data? Almost everyone has that.
                </p>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  SurePrep was built to level that playing field. We combine 10,000+ past questions, real-time speed analytics, and topic-level filtering to give every student — whether in Lagos or Adamawa — the same quality of preparation that used to cost a fortune.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="grid grid-cols-2 gap-4"
              >
                {[
                  { number: "2022", label: "Year founded" },
                  { number: "3,200+", label: "Active students" },
                  { number: "12,000+", label: "Questions in bank" },
                  { number: "94%", label: "Score improvement rate" },
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">{stat.number}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-sm">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
            backgroundSize: '20px 20px'
          }} />
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <p className="text-emerald-400 font-mono text-sm uppercase tracking-[0.2em] mb-4">— What we stand for</p>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Our values</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map((value, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-slate-900 border border-white/10 rounded-2xl p-8 hover:border-emerald-500/30 transition-colors group"
                >
                  <div className="h-12 w-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mb-6 group-hover:bg-emerald-500/20 transition-colors">
                    {value.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-3">{value.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">{value.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
       

        {/* CTA */}
        <section className="py-20 bg-emerald-600 text-white text-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="relative z-10 max-w-2xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to start preparing?</h2>
            <p className="text-emerald-100/80 mb-8 leading-relaxed">Join thousands of students already using SurePrep to crush their exams.</p>
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 rounded-2xl font-bold text-base shadow-xl hover:bg-emerald-50 transition-colors"
              >
                Get Started Free <ArrowRight size={18} />
              </motion.button>
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>&copy; {new Date().getFullYear()} Sure Prep. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-emerald-600 transition-colors">About Us</Link>
            <Link href="/contact" className="hover:text-emerald-600 transition-colors">Contact Us</Link>
            <Link href="/faq" className="hover:text-emerald-600 transition-colors">FAQs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}