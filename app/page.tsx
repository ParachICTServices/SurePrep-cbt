"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, Lock, Zap, Star, MapPin, Mail, Phone, Twitter, Instagram, Facebook, ShieldCheck, BookOpen, Clock, TrendingUp, Quote } from 'lucide-react'; 

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const Typewriter = () => {
  const words = ["CBT for JAMB ", "WAEC", "NECO", "Post-UTME", "Any Exam"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 md:gap-4 min-w-[300px] justify-center">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
      
      <motion.div
        key={`icon-${index}`}
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <CheckCircle className="text-emerald-500 w-8 h-8 md:w-12 md:h-12" strokeWidth={3} />
      </motion.div>
    </div>
  );
};

const Counter = ({ target, suffix = "" }: { target: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    const step = target / 60;
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 20);
    return () => clearInterval(timer);
  }, [started, target]);

  return (
    <motion.span
      onViewportEnter={() => setStarted(true)}
    >
      {count.toLocaleString()}{suffix}
    </motion.span>
  );
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-x-hidden">
      
      {/* 🌟 Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-emerald-400 tracking-tight flex items-center gap-2">
            <ShieldCheck size={24} />Sure Prep
          </span>
          <div className="flex gap-4">
            <Link href="/login" className="hidden md:block px-4 py-2 text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors">Login</Link>
            <Link href="/register" className="px-5 py-2.5 text-sm font-bold bg-emerald-500 text-white rounded-full hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

      <main className="flex-grow">
        
        {/*Hero Section */}
        <section className="relative bg-slate-950 text-white overflow-hidden min-h-screen flex items-center">

          {/* Diagonal dot-grid texture */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
            backgroundSize: '20px 20px'
          }} />

          {/* Emerald glow blobs */}
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-600/5 rounded-full blur-3xl" />

          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 63px, #10b981 63px, #10b981 64px)',
            backgroundSize: '100% 64px'
          }} />

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-28 text-center w-full"
          >
            {/* Mono label */}
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2.5 mb-10">
              <span className="h-px w-8 bg-emerald-500/60" />
              <span className="text-emerald-400 font-mono text-xs uppercase tracking-[0.25em]">
              JAMB CBT PRACTICE MADE EASY
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="h-px w-8 bg-emerald-500/60" />
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-8xl font-extrabold tracking-tight mb-8 leading-tight text-white"
            >
              Master <br className="md:hidden" />
              <Typewriter />
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
            >
                Get the best JAMB CBT practice experience with the SurePrep app . Access over 10,000 past questions. Start your exams CBT online practice today.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-emerald-500/20 hover:bg-emerald-400 transition-colors"
                >
                  Start Practice <ArrowRight size={20} />
                </motion.button>
              </Link>
              <Link href="/demo">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white/20 transition-colors backdrop-blur-sm"
                >
                  Try Demo
                </motion.button>
              </Link>
            </motion.div>

            {/* Bottom detail strip */}
            <motion.div
              variants={fadeInUp}
              className="mt-16 flex flex-wrap justify-center gap-6 text-xs text-slate-500 font-mono uppercase tracking-widest"
            >
              {["JAMB CBT", "WAEC OBJ", "NECO", "Post-UTME"].map((tag, i) => (
                <span key={i} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-emerald-500/60" />
                  {tag}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* 🌟 Features Bento Grid */}
        <section className="py-24 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Everything you need to score 300+</h2>
              <p className="text-slate-500 mt-4 max-w-xl mx-auto">SurePrep is designed for students who want to pass JAMB in one attempt. Our platform combines technology and proven learning methods to deliver the best jamb cbt practice test experience.</p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <motion.div 
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="md:col-span-2 p-10 rounded-[2rem] bg-slate-50 border border-slate-100 relative overflow-hidden group"
              >
                <div className="relative z-10">
                  <div className="h-14 w-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 shadow-sm">
                    <Zap size={28} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-900">Real-Time Speed Analytics</h3>
                  <p className="text-slate-500 text-lg leading-relaxed max-w-md">We track exactly how fast you answer questions compared to the official CBT Exam timer, helping you build speed.</p>
                </div>
                <div className="absolute top-1/2 right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition duration-500" />
                <motion.div 
                  className="absolute bottom-0 right-0 w-64 h-32 bg-white rounded-tl-[2rem] border-t border-l border-slate-100 p-6 shadow-sm"
                  initial={{ y: 50 }}
                  whileInView={{ y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-emerald-500" 
                        initial={{ width: "0%" }}
                        whileInView={{ width: "80%" }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                    <span className="font-bold text-emerald-600 text-sm">80%</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-mono">Speed Score</p>
                </motion.div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-10 rounded-[2rem] bg-emerald-900 text-white relative overflow-hidden group"
              >
                <div className="relative z-10">
                  <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-300 mb-6 backdrop-blur-md">
                    <Lock size={28} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Premium Solutions</h3>
                  <p className="text-emerald-100/80 leading-relaxed">Unlock detailed step-by-step explanations for Math, Physics & Chem.</p>
                </div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition duration-500"></div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="p-10 rounded-[2rem] bg-white border border-slate-200 hover:border-emerald-200 transition-colors shadow-sm hover:shadow-lg hover:shadow-emerald-100/50"
              >
                <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 border border-emerald-100">
                  <CheckCircle size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Topic Filtering</h3>
                <p className="text-slate-500">Don't just practice random questions. Filter by "Calculus", "Oral English", or "Organic Chemistry".</p>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="md:col-span-2 p-10 rounded-[2rem] bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
                      <Star size={24} fill="currentColor" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-900">Trusted by Top Tutors</h3>
                </div>
                <p className="text-amber-900/70 leading-relaxed">Backed by Nigeria's leading home tutoring agency. We use the same curriculum that has helped students gain admission into UNILAG, UI, and ABU.</p>
              </motion.div>
            </div>
          </div>
        </section>
        <section className="py-28 bg-slate-950 text-white relative overflow-hidden">
          {/* Diagonal stripe decoration */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
            backgroundSize: '20px 20px'
          }} />
          {/* Emerald blob */}
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-3xl" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-20"
            >
              <p className="text-emerald-400 font-mono text-sm uppercase tracking-[0.2em] mb-4">— The Process</p>
              <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                Three steps.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                  One goal: admission.
                </span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/10">
              
              {[
                {
                  step: "01",
                  icon: <BookOpen size={28} />,
                  title: "Pick your exam & subject",
                  desc: "Choose JAMB, WAEC, NECO or Post-UTME. Then drill into the exact subject and topic giving you headaches. No noise, no guessing.",
                  color: "from-emerald-500/20 to-transparent",
                },
                {
                  step: "02",
                  icon: <Clock size={28} />,
                  title: "Practice under real exam pressure",
                  desc: "Our timer mirrors the exact pace of JAMB's CBT. You'll feel the pressure here first — not on exam day when it matters.",
                  color: "from-teal-500/20 to-transparent",
                },
                {
                  step: "03",
                  icon: <TrendingUp size={28} />,
                  title: "Track what's working",
                  desc: "Your dashboard shows the topics where you lose points. Fix those. Watch your score climb. It's not complicated — just consistent.",
                  color: "from-cyan-500/20 to-transparent",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="bg-slate-900 p-10 md:p-12 relative group hover:bg-slate-800 transition-colors duration-300"
                >
                  {/* Step number — big faded behind */}
                  <div className="absolute top-6 right-8 text-[80px] font-black text-white/[0.04] leading-none select-none group-hover:text-white/[0.07] transition-colors">
                    {item.step}
                  </div>

                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className="relative z-10">
                    <div className="h-14 w-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-8 group-hover:bg-emerald-500/20 transition-colors">
                      {item.icon}
                    </div>
                    <div className="text-emerald-500 font-mono text-xs font-bold tracking-widest mb-3">{item.step}</div>
                    <h3 className="text-xl font-bold mb-4 text-white">{item.title}</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
            >
              {[
                { value: 12000, suffix: "+", label: "Questions in the bank" },
                { value: 8, suffix: " subjects", label: "Covered end-to-end" },
                { value: 94, suffix: "%", label: "Students improved their score" },
                { value: 3200, suffix: "+", label: "Active students this month" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                  <div className="text-3xl font-black text-emerald-400 mb-1">
                    <Counter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-slate-400 text-xs">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

               <section className="py-28 bg-white relative overflow-hidden">
          {/* Faint ruled-paper lines in background */}
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #065f46 31px, #065f46 32px)',
            backgroundSize: '100% 32px'
          }} />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
            >
              <div>
                <p className="text-emerald-600 font-mono text-sm uppercase tracking-[0.2em] mb-4">— From the students</p>
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                  Real results.<br />No cap.
                </h2>
              </div>
              <p className="text-slate-400 max-w-xs text-sm leading-relaxed">These are actual students who used . We didn't ask them to be nice about it.</p>
            </motion.div>

               <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-5">
              
              {/* Big card — left */}
              <motion.div
                initial={{ opacity: 0, x: -20, rotate: -0.5 }}
                whileInView={{ opacity: 1, x: 0, rotate: -0.5 }}
                viewport={{ once: true }}
                whileHover={{ rotate: 0, scale: 1.01 }}
                transition={{ duration: 0.5 }}
                className="md:col-span-5 bg-emerald-600 text-white rounded-[2rem] p-10 relative overflow-hidden"
                style={{ transform: 'rotate(-0.5deg)' }}
              >
                <Quote size={48} className="text-white/20 mb-6" fill="currentColor" />
                <p className="text-xl font-semibold leading-relaxed mb-8">
                  "I failed JAMB twice. Tried Sure Prep for two months before my third attempt. 
                  Scored 289. My mum cried. I cried. We all cried."
                </p>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center font-black text-lg">C</div>
                  <div>
                    <p className="font-bold">Chukwuemeka A.</p>
                    <p className="text-emerald-100/70 text-sm">Lagos — JAMB candidate</p>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
              </motion.div>

              {/* Stacked right column */}
              <div className="md:col-span-7 flex flex-col gap-5">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <motion.div
                    initial={{ opacity: 0, y: 20, rotate: 0.4 }}
                    whileInView={{ opacity: 1, y: 0, rotate: 0.4 }}
                    viewport={{ once: true }}
                    whileHover={{ rotate: 0, scale: 1.01 }}
                    className="bg-amber-50 border border-amber-100 rounded-[1.5rem] p-7 relative"
                    style={{ transform: 'rotate(0.4deg)' }}
                  >
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className="text-amber-400" fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed mb-6">
                      "The topic filter is insane. I spent two weeks just on Surds and Indices and went from 40% to 85% on that topic alone."
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-amber-200 flex items-center justify-center font-bold text-amber-800 text-sm">F</div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Fatimah K.</p>
                        <p className="text-slate-400 text-xs">Kano — WAEC candidate</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20, rotate: -0.3 }}
                    whileInView={{ opacity: 1, y: 0, rotate: -0.3 }}
                    viewport={{ once: true }}
                    whileHover={{ rotate: 0, scale: 1.01 }}
                    className="bg-slate-900 text-white rounded-[1.5rem] p-7 relative"
                    style={{ transform: 'rotate(-0.3deg)' }}
                  >
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className="text-emerald-400" fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed mb-6">
                      "My friend recommended this and honestly I thought it was a scam. Then I tried it. UI Post-UTME prep — finished top 12%."
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-sm">T</div>
                      <div>
                        <p className="font-bold text-sm">Tobiloba O.</p>
                        <p className="text-slate-400 text-xs">Ibadan — Post-UTME candidate</p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-7 flex flex-col md:flex-row items-start md:items-center gap-6"
                >
                  <div className="h-14 w-14 shrink-0 rounded-2xl bg-emerald-100 flex items-center justify-center font-black text-emerald-600 text-lg">A</div>
                  <div>
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={13} className="text-amber-400" fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      "The speed analytics genuinely scared me at first. Then I fixed it. JAMB gave me 2 minutes per question — I was doing mine in 1:20 by the time I sat the real thing."
                    </p>
                    <p className="text-slate-400 text-xs mt-3 font-medium">Adaobi E. — Enugu · JAMB candidate · <span className="text-emerald-600 font-bold">Early access tester</span></p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Bottom CTA nudge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-14 text-center"
            >
              <p className="text-slate-400 text-sm mb-6">You could be next. Seriously.</p>
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-base shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-colors"
                >
                   Start Now <ArrowRight size={18} />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </section>

      </main>

      {/* 🌟 Footer */}
      <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            
            <div className="col-span-1 md:col-span-1 space-y-4">
              <span className="text-2xl font-bold text-emerald-600 tracking-tight flex items-center gap-2"><ShieldCheck size={24}/> Sure Prep</span>
              <p className="text-slate-500 text-sm leading-relaxed">
                Empowering Nigerian students to smash Computer based test or Exam with confidence. 
              </p>
              <div className="flex gap-4 pt-2">
                <Link href="#" className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all"><Twitter size={18} /></Link>
                <Link href="#" className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all"><Facebook size={18} /></Link>
                <Link href="#" className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all"><Instagram size={18} /></Link>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Platform</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><Link href="/login" className="hover:text-emerald-600 transition-colors">Login</Link></li>
                <li><Link href="/register" className="hover:text-emerald-600 transition-colors">Create Account</Link></li>
                <li><Link href="/demo" className="hover:text-emerald-600 transition-colors">Try Demo</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Resources</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><Link href="/faq" className="hover:text-emerald-600 transition-colors">FAQs</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Contact</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                
                <li className="flex items-center gap-3">
                  <Phone size={18} className="text-emerald-600 shrink-0" />
                  <span>+234 800 123 4567</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={18} className="text-emerald-600 shrink-0" />
                  <span>help@Sure Prep.ng</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>&copy; {new Date().getFullYear()} Sure Prep. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-slate-600">Privacy Policy</Link>
              <Link href="#" className="hover:text-slate-600">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
