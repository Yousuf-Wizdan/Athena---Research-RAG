"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";
import ThemeToggle from "@/components/ui/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin ? { email, password } : { email, password, name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw {
          message: data.error || "Authentication failed.",
          isExpected: true,
          status: res.status,
        };
      }

      router.push("/workspace");
      router.refresh();
    } catch (err: any) {
      if (err.isExpected) {
        console.warn(`Auth warning (${err.status}): ${err.message}`);
      } else {
        console.error("Unexpected auth error:", err);
      }
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-background text-foreground flex relative overflow-hidden font-sans">
      {/* Ambient glow orbs behind left panel */}
      <div className="absolute top-1/4 left-[15%] w-[40rem] h-[40rem] bg-amber/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 left-[40%] w-[32rem] h-[32rem] bg-gold/8 rounded-full blur-3xl -z-10" />

      {/* Left Panel: Brand statement */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 xl:p-16 relative">
        <div className="flex items-center gap-2.5">
          <span className="font-display text-gold text-2xl leading-none">Ω</span>
          <span className="text-sm font-bold tracking-tight font-display text-foreground">
            Athena
          </span>
        </div>

        <div className="space-y-8 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/25 flex items-center justify-center">
            <span className="font-display text-gold text-3xl">Ω</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-display font-bold tracking-tighter leading-none text-foreground">
            Your literature.
            <br />
            Synthesized.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[42ch]">
            Upload research papers, search across your entire library, and
            chat with an AI that cites real sources. Athena turns your
            reading list into a thinking partner.
          </p>

          <div className="flex gap-6 pt-4">
            <div className="space-y-1">
              <span className="text-2xl font-display font-bold text-amber">
                Semantic
              </span>
              <span className="text-[11px] text-muted-foreground block">
                Vector search
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-display font-bold text-amber">
                Synthesis
              </span>
              <span className="text-[11px] text-muted-foreground block">
                Cross-paper matrix
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-display font-bold text-amber">
                Cited
              </span>
              <span className="text-[11px] text-muted-foreground block">
                Every answer sourced
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground/50">
            Agentic RAG platform for academic research
          </p>
          <ThemeToggle />
        </div>
      </div>

      {/* Right Panel: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-background lg:bg-card/30">
        {/* Mobile-only brand header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 px-4 py-3 flex items-center justify-between bg-background/80 backdrop-blur-md border-b border-border z-10">
          <div className="flex items-center gap-2">
            <span className="font-display text-gold text-lg">Ω</span>
            <span className="text-xs font-bold font-display text-foreground">
              Athena
            </span>
          </div>
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm mt-16 lg:mt-0">
          {/* Mobile branding header */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center mx-auto mb-3">
              <span className="font-display text-gold text-xl">Ω</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight font-display text-foreground mb-1">
              Athena
            </h1>
            <p className="text-xs text-muted-foreground">
              {isLogin
                ? "Access your literature library and agentic RAG canvas"
                : "Create an account to start analyzing research literature"}
            </p>
          </div>

          {/* Desktop: card-wrapped auth -- hidden on mobile */}
          <div className="hidden lg:block bg-card border border-border rounded-3xl p-8 shadow-xl">
            <div className="space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold tracking-tight font-display text-foreground">
                  {isLogin ? "Welcome back" : "Join Athena"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isLogin
                    ? "Sign in to continue your research"
                    : "Start building your research library"}
                </p>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-3.5 text-xs text-center font-medium animate-fade-in">
                  {error}
                </div>
              )}

              <LoginForm
                isLogin={isLogin}
                loading={loading}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                name={name}
                setName={setName}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                onSubmit={handleSubmit}
                error={error}
              />

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                  }}
                  className="text-[11px] text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer"
                >
                  {isLogin
                    ? "New researcher? Create an account"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile auth form -- hidden on desktop */}
          <div className="lg:hidden">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-3.5 text-xs text-center font-medium animate-fade-in mb-6">
                {error}
              </div>
            )}

            <LoginForm
              isLogin={isLogin}
              loading={loading}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              name={name}
              setName={setName}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              onSubmit={handleSubmit}
              error={error}
            />

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-[11px] text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer"
              >
                {isLogin
                  ? "New researcher? Create an account"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function LoginForm({
  isLogin,
  loading,
  email,
  setEmail,
  password,
  setPassword,
  name,
  setName,
  showPassword,
  setShowPassword,
  onSubmit,
}: {
  isLogin: boolean;
  loading: boolean;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  error: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!isLogin && (
        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            required={!isLogin}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="researcher@institute.edu"
          className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="········"
            className="w-full px-4 py-2.5 pr-10 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md shadow-primary/20 cursor-pointer"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Processing...
          </span>
        ) : isLogin ? (
          "Sign In"
        ) : (
          "Create Account"
        )}
      </button>
    </form>
  );
}
