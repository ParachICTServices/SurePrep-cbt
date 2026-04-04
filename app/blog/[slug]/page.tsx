import { client } from '@/sanity/lib/client'
import { ARTICLE_BY_SLUG_QUERY, RELATED_ARTICLES_QUERY, LATEST_ARTICLES_QUERY } from '@/sanity/lib/queries'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, ArrowLeft, Clock, Calendar, ArrowRight, BookOpen } from 'lucide-react'
import { PortableText } from '@portabletext/react'
import { ThemeToggle } from '@/app/components/theme-toggle'

export const dynamic = 'force-dynamic'

interface SidebarArticle {
  _id: string
  title: string
  slug: string
  category: string
  readTime: number
  publishedAt: string
  excerpt?: string
}

const ptComponents = {
  block: {
    normal: ({ children }: any) => (
      <p className="text-slate-700 dark:text-slate-300 leading-[1.85] mb-6 text-[15px]">{children}</p>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-14 mb-5 pb-3 border-b border-slate-200 dark:border-white/5">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-10 mb-4">{children}</h3>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="relative border-l-4 border-emerald-500 pl-6 pr-4 py-2 my-8 bg-emerald-500/[0.06] dark:bg-emerald-500/5 rounded-r-xl">
        <p className="text-slate-600 dark:text-slate-300 italic leading-relaxed">{children}</p>
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: any) => <ul className="space-y-3 mb-6 ml-1">{children}</ul>,
    number: ({ children }: any) => <ol className="space-y-3 mb-6 ml-4 list-decimal">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }: any) => (
      <li className="text-slate-700 dark:text-slate-300 flex items-start gap-3 text-[15px]">
        <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0" />
        <span className="leading-relaxed">{children}</span>
      </li>
    ),
    number: ({ children }: any) => (
      <li className="text-slate-700 dark:text-slate-300 leading-relaxed text-[15px]">{children}</li>
    ),
  },
  marks: {
    strong: ({ children }: any) => <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>,
    em: ({ children }: any) => <em className="italic text-slate-800 dark:text-slate-200">{children}</em>,
    code: ({ children }: any) => (
      <code className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded text-emerald-700 dark:text-emerald-300 text-sm font-mono">
        {children}
      </code>
    ),
  },
}

const categoryColors: Record<string, string> = {
  "Exam Strategy":  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Subject Tips":   "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "Study Skills":   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "News & Updates": "bg-blue-500/10 text-blue-400 border-blue-500/20",
}

const categoryDot: Record<string, string> = {
  "Exam Strategy":  "bg-emerald-400",
  "Subject Tips":   "bg-teal-400",
  "Study Skills":   "bg-amber-400",
  "News & Updates": "bg-blue-400",
}

const SidebarCard = ({ article }: { article: SidebarArticle }) => (
  <Link href={`/blog/${article.slug}`} className="group block">
    <div className="flex gap-4 py-4 border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] rounded-xl px-3 -mx-3 transition-colors">
      <div className="shrink-0 mt-1.5">
        <span className={`h-2 w-2 rounded-full block ${categoryDot[article.category] ?? 'bg-slate-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug mb-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors line-clamp-2">
          {article.title}
        </p>
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-600 text-xs">
          <Clock size={10} />
          <span>{article.readTime} min</span>
          <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
          <span>{new Date(article.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>
      <ArrowRight size={14} className="shrink-0 text-slate-400 dark:text-slate-700 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 mt-1 group-hover:translate-x-0.5 transition-all" />
    </div>
  </Link>
)

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const article = await client.fetch(ARTICLE_BY_SLUG_QUERY, { slug })
  if (!article) notFound()

  const [related, latest] = await Promise.all([
    client.fetch(RELATED_ARTICLES_QUERY, { slug, category: article.category }),
    client.fetch(LATEST_ARTICLES_QUERY, { slug }),
  ])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans">

      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight flex items-center gap-2">
            <ShieldCheck size={24} /> Sure Prep
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="hidden md:block px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Login</Link>
            <Link href="/register" className="px-5 py-2.5 text-sm font-bold bg-emerald-600 dark:bg-emerald-500 text-white rounded-full hover:bg-emerald-700 dark:hover:bg-emerald-400 transition-all active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-24">
        <div className="max-w-7xl mx-auto px-6">

          {/* Back link */}
          <div className="py-6">
            <Link href="/blog" className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm font-medium">
              <ArrowLeft size={15} /> Back to Blog
            </Link>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 xl:gap-16 items-start">

            {/* ── LEFT: Article ── */}
            <div className="min-w-0">

              {/* Header */}
              <header className="mb-10">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${categoryColors[article.category] ?? 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'}`}>
                    {article.category}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-500 text-xs">
                    <Clock size={12} /> {article.readTime} min read
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-500 text-xs">
                    <Calendar size={12} />
                    {new Date(article.publishedAt).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-6">
                  {article.title}
                </h1>

                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed border-l-4 border-emerald-500/40 pl-5 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.03] py-3 rounded-r-xl">
                  {article.excerpt}
                </p>

                <div className="mt-10 h-px bg-gradient-to-r from-emerald-500/30 via-slate-200 dark:via-white/5 to-transparent" />
              </header>

              {/* Body */}
              <article>
                {article.body ? (
                  <PortableText value={article.body} components={ptComponents} />
                ) : (
                  <div className="flex items-center gap-3 py-12 text-slate-500 dark:text-slate-500">
                    <BookOpen size={20} className="opacity-40" />
                    <p className="text-sm italic">Article body coming soon.</p>
                  </div>
                )}
              </article>

              {/* Mobile sidebar — shown below article on small screens */}
              <div className="lg:hidden mt-12 space-y-6">
                {related?.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`h-2 w-2 rounded-full ${categoryDot[article.category] ?? 'bg-slate-500'}`} />
                      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">More in {article.category}</h2>
                    </div>
                    {related.map((a: SidebarArticle) => <SidebarCard key={a._id} article={a} />)}
                  </div>
                )}
                {latest?.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-none">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">Latest Articles</h2>
                    {latest.map((a: SidebarArticle) => <SidebarCard key={a._id} article={a} />)}
                  </div>
                )}
              </div>

              {/* Bottom CTA */}
              <div className="mt-16 pt-10 border-t border-slate-200 dark:border-white/5">
                <div className="bg-emerald-600 rounded-[1.5rem] p-8 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.06]" style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
                    backgroundSize: '20px 20px'
                  }} />
                  <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <h3 className="text-xl font-extrabold text-white mb-2">Ready to put this into practice?</h3>
                    <p className="text-emerald-100/80 text-sm mb-6 max-w-sm">Start practising with real past questions on Sure Prep</p>
                    <Link href="/register">
                      <button className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 font-bold rounded-xl text-sm hover:bg-emerald-50 transition-colors">
                        Start Practising Now <ArrowRight size={15} />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Sticky Sidebar (desktop only) ── */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-5">

                {/* Related */}
                {related?.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`h-2 w-2 rounded-full ${categoryDot[article.category] ?? 'bg-slate-500'}`} />
                      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        More in {article.category}
                      </h2>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-600 mb-4 pl-4">Similar articles you might find useful</p>
                    {related.map((a: SidebarArticle) => <SidebarCard key={a._id} article={a} />)}
                    <Link
                      href={`/blog`}
                      className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold transition-colors"
                    >
                      See all {article.category} articles <ArrowRight size={12} />
                    </Link>
                  </div>
                )}

                {/* Latest */}
                {latest?.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-none">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Latest Articles</h2>
                    <p className="text-[10px] text-slate-500 dark:text-slate-600 mb-4">What's been published recently</p>
                    {latest.map((a: SidebarArticle) => <SidebarCard key={a._id} article={a} />)}
                    <Link
                      href="/blog"
                      className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold transition-colors"
                    >
                      View all articles <ArrowRight size={12} />
                    </Link>
                  </div>
                )}

                {/* Mini CTA */}
                <div className="bg-white dark:bg-slate-900 border border-emerald-500/20 dark:border-emerald-500/10 rounded-2xl p-6 shadow-sm dark:shadow-none">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-3">Sure Prep CBT</p>
                  <p className="text-sm text-slate-800 dark:text-slate-200 font-semibold leading-snug mb-2">
                    Practice makes the difference.
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-500 leading-relaxed mb-5">
                    Thousands of past questions. Real exam timer. See exactly where you're losing marks.
                  </p>
                  <Link href="/register">
                    <button className="w-full py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-400 transition-colors">
                      Start Now →
                    </button>
                  </Link>
                </div>

              </div>
            </aside>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-white/5 py-8 mt-4 bg-white dark:bg-transparent">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-500">
          <Link href="/" className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck size={16} /> Sure Prep
          </Link>
          <p>&copy; {new Date().getFullYear()} Sure Prep. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/blog" className="hover:text-slate-800 dark:hover:text-slate-300">Blog</Link>
            <Link href="/faq" className="hover:text-slate-800 dark:hover:text-slate-300">FAQ</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}