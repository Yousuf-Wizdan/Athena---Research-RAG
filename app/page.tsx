import { ArrowRight, Search, MessageSquare, Layers, BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";
import ThemeToggle from "@/components/ui/theme-toggle";

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground font-sans">
      {/* Navigation */}
      <Nav />

      {/* Hero */}
      <Hero />

      {/* Features - 2x2 Bento */}
      <Features />

      {/* Quote */}
      <Quote />

      {/* CTA */}
      <CTA />

      {/* Footer */}
      <Footer />
    </div>
  );
}

/* ─── Navigation ────────────────────────────────────────────────── */

function Nav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-40 h-[64px] border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto h-full px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="font-display text-gold text-2xl leading-none">Ω</span>
          <span className="text-sm font-bold tracking-tight font-display text-foreground">
            Athena
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl transition-all active:scale-95 shadow-md shadow-primary/20"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─── Hero ──────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="min-h-[100dvh] pt-[64px] flex flex-col lg:flex-row">
      {/* Left: Copy */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-16 xl:px-24 py-16 lg:py-24">
        <div className="max-w-xl space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tighter leading-[1.05]">
            Understand every paper
            <br />
            <span className="text-primary">at a glance.</span>
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-[50ch]">
            Upload your research library, search across every paper, and chat
            with an AI assistant that cites real sources. Athena turns reading
            lists into structured insight.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/login"
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-xl transition-all active:scale-95 shadow-md shadow-primary/20 inline-flex items-center gap-2"
            >
              Start researching
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Right: Visual */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-muted/20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] bg-amber/8 rounded-full blur-3xl" />
        <div className="relative w-full max-w-md space-y-4">
          <img
            src="https://picsum.photos/seed/athena-library/800/600"
            alt="Research library interface showing paper catalog and AI chat"
            className="w-full rounded-2xl border border-border shadow-2xl"
          />
          <div className="absolute -bottom-6 -right-6 w-48 h-32 bg-card border border-border rounded-xl shadow-xl p-3 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] text-muted-foreground font-medium">AI Assistant active</span>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 bg-muted rounded-full w-full" />
              <div className="h-1.5 bg-muted rounded-full w-3/4" />
              <div className="h-1.5 bg-primary/60 rounded-full w-1/2" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Features - 2x2 Bento ──────────────────────────────────────── */

const features = [
  {
    icon: Search,
    title: "Semantic search",
    body: "Find relevant papers by meaning, not keywords. Vector embeddings understand your research questions.",
    bg: "bg-card",
  },
  {
    icon: MessageSquare,
    title: "Cited answers",
    body: "Every AI response comes with inline citations back to the source papers. No hallucinated references.",
    bg: "bg-primary/5 border-primary/20",
  },
  {
    icon: Layers,
    title: "Cross-paper synthesis",
    body: "Select multiple papers and generate a comparative matrix of methods, findings, and limitations in one pass.",
    bg: "bg-gold/5 border-gold/20",
  },
  {
    icon: BookOpen,
    title: "Full library management",
    body: "Upload PDFs, organize by topic, and build a personal research corpus that grows with you.",
    bg: "bg-muted/30",
  },
];

function Features() {
  return (
    <section className="py-24 lg:py-32 px-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="space-y-3 mb-16">
          <h2 className="text-3xl lg:text-4xl font-display font-bold tracking-tighter leading-tight">
            Built for researchers,
            <br />
            designed for speed.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[55ch]">
            Every feature is engineered for academic workflows. No bloat, no
            generic AI wrappers — just tools that understand how research works.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className={`rounded-2xl border border-border p-8 flex flex-col gap-4 ${f.bg}`}
            >
              <div className="w-10 h-10 rounded-xl bg-foreground/5 border border-border flex items-center justify-center">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-foreground">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[42ch]">
                  {f.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Quote ─────────────────────────────────────────────────────── */

function Quote() {
  return (
    <section className="py-24 lg:py-32 px-6 bg-muted/20 border-y border-border">
      <div className="max-w-[1400px] mx-auto flex justify-center">
        <blockquote className="max-w-2xl text-center space-y-6">
          <Sparkles className="w-6 h-6 text-gold mx-auto" />
          <p className="text-xl lg:text-2xl font-display font-bold leading-relaxed">
            &ldquo;Athena cut my literature review time in half. I can upload a
            stack of papers, ask one question, and get a cited synthesis across
            all of them in seconds.&rdquo;
          </p>
          <footer className="space-y-1">
            <cite className="text-sm font-semibold text-foreground block not-italic">
              Dr. Priya Venkatesh
            </cite>
            <span className="text-xs text-muted-foreground block">
              Computational Linguistics, University of Helsinki
            </span>
          </footer>
        </blockquote>
      </div>
    </section>
  );
}

/* ─── CTA ───────────────────────────────────────────────────────── */

function CTA() {
  return (
    <section className="py-24 lg:py-32 px-6">
      <div className="max-w-[1400px] mx-auto flex justify-center">
        <div className="text-center space-y-6 max-w-lg">
          <h2 className="text-3xl lg:text-4xl font-display font-bold tracking-tighter leading-tight">
            Your research deserves
            <br />
            better tools.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Start building your literature library today. Free to use, no credit
            card required.
          </p>
          <Link
            href="/login"
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-xl transition-all active:scale-95 shadow-md shadow-primary/20 inline-flex items-center gap-2"
          >
            Start researching
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-border bg-muted/20 px-6 py-16">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Brand */}
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="font-display text-gold text-xl">Ω</span>
            <span className="text-xs font-bold font-display text-foreground">Athena</span>
          </Link>
          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[32ch]">
            Agentic RAG platform for academic research. Upload, search, chat,
            and synthesize across your entire literature library.
          </p>
        </div>

        {/* Links */}
        <div className="space-y-3">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
            Product
          </span>
          <div className="space-y-2">
            <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors block">
              Get Started
            </Link>
            <Link href="/workspace" className="text-xs text-muted-foreground hover:text-foreground transition-colors block">
              Workspace
            </Link>
          </div>
        </div>

        {/* Tech */}
        <div className="space-y-3">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
            Built with
          </span>
          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[32ch]">
            Next.js, Qdrant vector search, OpenAI embeddings, LangChain
            orchestration, and Prisma.
          </p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto mt-12 pt-6 border-t border-border/50 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground/50">
          &copy; {new Date().getFullYear()} Athena. All rights reserved.
        </p>
        <p className="text-[10px] text-muted-foreground/50">
          Made by Md Yousuf Wizdan
        </p>
      </div>
    </footer>
  );
}
