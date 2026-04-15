"use client";

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { ThemeToggle } from '@/app/components/theme-toggle';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission
    await new Promise(res => setTimeout(res, 1500));
    setLoading(false);
    setSubmitted(true);
  };

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
              <span className="text-emerald-400 font-mono text-xs uppercase tracking-[0.25em]">Get in Touch</span>
              <span className="h-px w-8 bg-emerald-500/60" />
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
              We actually<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                reply.
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
              Got a question, bug report, or just want to say your score improved? We want to hear it. Real humans read every message.
            </motion.p>
          </motion.div>
        </section>

        {/* Contact Section */}
        <section className="py-24 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

              {/* Left — Info */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <p className="text-emerald-600 font-mono text-sm uppercase tracking-[0.2em] mb-6">— Contact Info</p>
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-8 leading-tight">
                  Let's talk.
                </h2>

                <div className="space-y-6 mb-12">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shrink-0">
                      <Mail size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white mb-1">Email us</p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">sureprepcbt@gmail.com</p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">We typically respond within 24 hours.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shrink-0">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white mb-1">Common questions</p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Check our <Link href="/faq" className="text-emerald-600 hover:underline">FAQ page</Link> first — your answer might already be there.</p>
                    </div>
                  </div>
                </div>

                {/* Topics */}
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700 rounded-2xl p-6">
                  <p className="font-bold text-slate-900 dark:text-white mb-4 text-sm">We can help with:</p>
                  <div className="flex flex-wrap gap-2">
                    {["Account issues", "Billing questions", "Technical bugs", "Feature requests", "Partnership", "Press inquiries", "Just saying hi 👋"].map((tag, i) => (
                      <span key={i} className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Right — Form */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-12 text-center"
                  >
                    <div className="h-20 w-20 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={36} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Message sent!</h3>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                      Thanks for reaching out. We'll get back to you at <span className="font-semibold text-slate-700 dark:text-slate-300">{form.email}</span> within 24 hours.
                    </p>
                  </motion.div>
                ) : (
                  <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-sm">
                    <div className="space-y-5">

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Your name</label>
                          <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Chukwuemeka A."
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email address</label>
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@email.com"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Subject</label>
                        <select
                          name="subject"
                          value={form.subject}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                        >
                          <option value="">Select a topic...</option>
                          <option value="account">Account issues</option>
                          <option value="billing">Billing questions</option>
                          <option value="bug">Technical bug</option>
                          <option value="feature">Feature request</option>
                          <option value="partnership">Partnership</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Message</label>
                        <textarea
                          name="message"
                          value={form.message}
                          onChange={handleChange}
                          rows={5}
                          placeholder="Tell us what's on your mind..."
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
                        />
                      </div>

                      <motion.button
                        onClick={handleSubmit}
                        disabled={loading || !form.name || !form.email || !form.message}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {loading ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            Send Message <Send size={16} />
                          </>
                        )}
                      </motion.button>

                    </div>
                  </div>
                )}
              </motion.div>
            </div>
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