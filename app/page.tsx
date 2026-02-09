"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, Lock, Zap, Star, MapPin, Mail, Phone, Twitter, Instagram, Facebook, ShieldCheck } from 'lucide-react'; 

// 🌟 Animation Variants for "Top End" Feel
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
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

// 🌟 Typewriter Component
const Typewriter = () => {
  const words = ["JAMB CBT", "WAEC OBJ", "NECO", "Post-UTME", "Any Exam"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500); // Change every 2.5 seconds
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
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
      
      {/* The "Tick" SVG that pops */}
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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-x-hidden">
      
      {/* 🌟 Navbar with Entrance Animation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className="fixed w-full z-50 bg-white/80 backdrop-blur-xl border-b border-emerald-100/50"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-emerald-600 tracking-tight flex items-center gap-2">
            <ShieldCheck size={24} /> PARACH
          </span>
          <div className="flex gap-4">
            <Link href="/login" className="hidden md:block px-4 py-2 text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Login</Link>
            <Link href="/register" className="px-5 py-2.5 text-sm font-bold bg-emerald-600 text-white rounded-full hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 transition-all active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Main Content Wrapper */}
      <main className="flex-grow">
        
        {/* 🌟 Hero Section */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="pt-40 pb-24 px-6 max-w-7xl mx-auto text-center relative"
        >
          {/* Background Decorative Blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-300/10 rounded-full blur-3xl -z-10" />

          {/* Badge */}
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wide mb-8 border border-emerald-100 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            JAMB 2026 Ready
          </motion.div>
          
          {/* Main Headline with Typewriter */}
          <motion.h1 variants={fadeInUp} className="text-5xl md:text-8xl font-extrabold tracking-tight text-slate-900 mb-8 leading-tight">
            Master <br className="md:hidden" />
            <Typewriter />
          </motion.h1>
          
          <motion.p variants={fadeInUp} className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Access thousands of past questions, timed mock exams, and real-time analytics. 
            Join students across Nigeria acing their exams.
          </motion.p>

          {/* Call to Action Buttons */}
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-200/50 hover:bg-emerald-700 transition-colors"
              >
                Start Practice <ArrowRight size={20} />
              </motion.button>
            </Link>
            <Link href="/demo">
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: "#f8fafc" }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold text-lg hover:border-emerald-200 transition-colors"
              >
                View Demo
              </motion.button>
            </Link>
          </motion.div>
        </motion.section>

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
              <p className="text-slate-500 mt-4 max-w-xl mx-auto">We have packed every tool you need into one simple dashboard.</p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Feature 1: Analytics */}
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
                  <p className="text-slate-500 text-lg leading-relaxed max-w-md">We track exactly how fast you answer questions compared to the official JAMB timer, helping you build speed.</p>
                </div>
                {/* Decorative Elements */}
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

              {/* Feature 2: Premium */}
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

              {/* Feature 3: Topics */}
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
              
              {/* Feature 4: Trusted By */}
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
                  <h3 className="text-xl font-bold text-amber-900">Trusted by So Effective Tutors</h3>
                </div>
                <p className="text-amber-900/70 leading-relaxed">Backed by 's leading home tutoring agency. We use the same curriculum that has helped students gain admission into UNILAG, UI, and ABU.</p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* 🌟 Footer (Clean Version) */}
      <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            
            <div className="col-span-1 md:col-span-1 space-y-4">
              <span className="text-2xl font-bold text-emerald-600 tracking-tight flex items-center gap-2"><ShieldCheck size={24}/> PARACH</span>
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
                <li><Link href="/dashboard/upgrade" className="hover:text-emerald-600 transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Resources</h4>
              <ul className="space-y-3 text-sm text-slate-500">

                <li><Link href="#" className="hover:text-emerald-600 transition-colors">FAQs</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Contact</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>Parach</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={18} className="text-emerald-600 shrink-0" />
                  <span>+234 800 123 4567</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={18} className="text-emerald-600 shrink-0" />
                  <span>help@parach.ng</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>&copy; {new Date().getFullYear()} Parach  All rights reserved.</p>
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