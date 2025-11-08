import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../auth";
import { logEvent } from "../analytics";

const roleMeta = {
  supplier: {
    label: "Supplier",
    heroTitle: "Showcase your catalogue across high-value infrastructure projects.",
    heroSubtitle:
      "Bring your materials, logistics capacity, and compliance certificates into one trusted workspace to win more qualified deals.",
    description: "Sign in to your supplier workspace.",
  },
  buyer: {
    label: "Buyer",
    heroTitle: "Source compliant suppliers for ambitious developments.",
    heroSubtitle:
      "Discover vetted partners, request proposals, and manage procurement workflows with the assurance of full compliance visibility.",
    description: "Sign in to your buyer workspace.",
  },
};

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("supplier");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [banner, setBanner] = useState(null);
  const navigate = useNavigate();

  const roleDetails = roleMeta[role];

  const showBanner = (type, message) => {
    setBanner(type && message ? { type, message } : null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    showBanner();
    try {
      const loggedUser = await loginUser(email, password);
      
      // Track login event
      logEvent("login", { method: "email" });
      
      onLoginSuccess?.(loggedUser);
      showBanner("success", "Login successful. Redirecting...");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      showBanner("error", error.message || "Login failed. Check your details.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const bannerStyles =
    banner?.type === "success"
      ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30"
      : banner?.type === "error"
      ? "bg-rose-500/10 text-rose-200 ring-1 ring-rose-500/30"
      : "bg-slate-500/10 text-slate-200 ring-1 ring-slate-500/30";

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-16 h-72 w-72 rounded-full bg-brand-500/40 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-sky-500/30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.15),_rgba(15,23,42,0.95))]" />
      </div>

      <div className="relative flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-6 lg:px-12">
          <div className="relative inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-lg font-semibold text-white shadow-glow">
              BL
            </div>
            <div>
              <p className="text-lg font-semibold text-white">BuildLink Portal</p>
              <p className="text-sm text-slate-300">Connect buyers and suppliers seamlessly.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium text-slate-200 transition hover:border-white/40 hover:text-white"
          >
            Sign up
          </button>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 pb-16 pt-4 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <section className="max-w-xl space-y-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                {roleDetails.label} experience
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {roleDetails.heroTitle}
              </h1>
              <p className="text-lg text-slate-300">{roleDetails.heroSubtitle}</p>
            </div>
          </section>

          <section className="w-full max-w-xl">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-[0_40px_80px_-40px_rgba(15,23,42,0.8)] backdrop-blur">
              <div className="mb-6 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-200">Sign in</p>
                <h2 className="text-2xl font-semibold text-white">Welcome back to BuildLink</h2>
                <p className="text-sm text-slate-400">{roleDetails.description}</p>
              </div>

              <div className="mb-6 flex rounded-full bg-slate-800/80 p-1">
                {Object.entries(roleMeta).map(([value, meta]) => {
                  const isActive = value === role;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRole(value)}
                      className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>

              {banner?.message && (
                <div className={`mb-6 rounded-2xl px-4 py-3 text-sm font-medium ${bannerStyles}`}>
                  {banner.message}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Email</label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Password</label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
                    required
                  />
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-400 via-brand-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-glow transition focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoggingIn ? "Signing in..." : "Sign in"}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/signup")}
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-slate-900"
                  >
                    Create new account
                  </button>
                </div>
              </form>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

