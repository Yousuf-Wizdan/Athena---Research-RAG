"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

      router.push("/");
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
    <main className="min-h-screen bg-[#141210] text-[#E6DCC3] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Warm ambient glow orbs — candlelight in a study */}
      <div className="absolute top-1/3 left-1/4 w-[32rem] h-[32rem] bg-[#D4783C]/8 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/3 right-1/4 w-[28rem] h-[28rem] bg-[#B8943C]/8 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md bg-[#1E1B18] border border-[#36302A] rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Branding header — illuminated initial treatment */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-full bg-[#B8943C]/10 border border-[#B8943C]/25 items-center justify-center mb-2">
            <span className="font-display text-[#B8943C] text-2xl">Ω</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight font-display text-[#E6DCC3]">
            Athena
          </h1>
          <p className="text-xs text-[#9F907E]">
            {isLogin
              ? "Access your literature library and agentic RAG canvas"
              : "Create an account to start analyzing research literature"}
          </p>
        </div>

        {error && (
          <div className="bg-[#B84747]/10 border border-[#B84747]/20 text-[#B84747] rounded-xl p-3.5 text-xs text-center font-medium animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#9F907E] font-semibold uppercase tracking-wider block">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. John Doe"
                className="w-full px-4 py-2.5 bg-[#141210] border border-[#36302A] rounded-xl text-xs text-[#E6DCC3] placeholder:text-[#9F907E]/50 focus:outline-none focus:border-[#D4783C]/50 focus:ring-1 focus:ring-[#D4783C]/30 transition-all"
                required={!isLogin}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] text-[#9F907E] font-semibold uppercase tracking-wider block">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="researcher@institute.edu"
              className="w-full px-4 py-2.5 bg-[#141210] border border-[#36302A] rounded-xl text-xs text-[#E6DCC3] placeholder:text-[#9F907E]/50 focus:outline-none focus:border-[#D4783C]/50 focus:ring-1 focus:ring-[#D4783C]/30 transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-[#9F907E] font-semibold uppercase tracking-wider block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-[#141210] border border-[#36302A] rounded-xl text-xs text-[#E6DCC3] placeholder:text-[#9F907E]/50 focus:outline-none focus:border-[#D4783C]/50 focus:ring-1 focus:ring-[#D4783C]/30 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#D4783C] hover:bg-[#E08950] text-[#141210] font-bold text-xs rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-md shadow-[#D4783C]/20 cursor-pointer text-center block"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5 text-[#141210]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-[11px] text-[#D4783C] hover:text-[#E08950] font-medium transition-colors cursor-pointer"
          >
            {isLogin
              ? "New researcher? Create an account here"
              : "Already have an account? Sign in here"}
          </button>
        </div>
      </div>
    </main>
  );
}
