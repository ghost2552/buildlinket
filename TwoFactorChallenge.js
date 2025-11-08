import React, { useState } from "react";
import { verifyTwoFactorCode } from "../twoFactorService";

export default function TwoFactorChallenge({ user, onSuccess, showBanner }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (event) => {
    event.preventDefault();
    if (!user?.uid || !code) return;
    setLoading(true);
    showBanner();
    try {
      await verifyTwoFactorCode(user.uid, code);
      showBanner("success", "Two-factor challenge passed.");
      onSuccess();
      setCode("");
    } catch (error) {
      showBanner("error", error?.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur">
      <form
        onSubmit={handleVerify}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-6 text-slate-100 shadow-[0_40px_80px_-40px_rgba(15,23,42,0.9)] backdrop-blur"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-200">
          Security verification
        </p>
        <h3 className="mt-2 text-xl font-semibold text-white">Enter authentication code</h3>
        <p className="mt-2 text-sm text-slate-300">
          Your account requires two-factor authentication for this action. Open your authenticator app and enter the current 6-digit code.
        </p>
        <div className="mt-4 space-y-2">
          <label className="text-xs font-medium text-slate-200">Authentication code</label>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl tracking-[0.3em] text-white focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ""))}
            placeholder="000000"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-400 via-brand-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-glow transition focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
    </div>
  );
}




