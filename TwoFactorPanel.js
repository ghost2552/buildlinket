import React, { useState } from "react";
import {
  disableTwoFactor,
  generateTwoFactorEnrollment,
  verifyTwoFactorCode,
} from "../twoFactorService";

export default function TwoFactorPanel({ user, profile, onStatusChange, showBanner }) {
  const [qr, setQr] = useState(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!user?.uid) return;
    setLoading(true);
    showBanner();
    try {
      const enrollment = await generateTwoFactorEnrollment(user.uid, user.email);
      setQr(enrollment.qr);
      showBanner(
        "success",
        "Scan the QR code with your authenticator app, then enter a code to verify."
      );
    } catch (error) {
      showBanner("error", error?.message || "Unable to generate two-factor secret.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!user?.uid || !code) return;
    setLoading(true);
    showBanner();
    try {
      await verifyTwoFactorCode(user.uid, code);
      showBanner("success", "Two-factor authentication enabled.");
      onStatusChange?.(true);
      setCode("");
    } catch (error) {
      showBanner("error", error?.message || "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!user?.uid) return;
    setLoading(true);
    showBanner();
    try {
      await disableTwoFactor(user.uid);
      showBanner("info", "Two-factor authentication disabled.");
      setQr(null);
      setCode("");
      onStatusChange?.(false);
    } catch (error) {
      showBanner("error", error?.message || "Unable to disable two-factor auth.");
    } finally {
      setLoading(false);
    }
  };

  const enabled = profile?.twoFactorEnabled;

  return (
    <section className="mx-auto w-full max-w-4xl pb-12">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-white">Account security</h3>
          <p className="text-sm text-slate-300">
            Protect sensitive actions (credential approvals, awarding bids, logistics updates) with a second authentication step.
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-sm text-slate-200">
                Status: {enabled ? "Enabled" : "Disabled"}
              </p>
              {profile?.twoFactorEnrolledAt?.toDate && (
                <p className="text-xs text-slate-400">
                  Enrolled {profile.twoFactorEnrolledAt.toDate().toLocaleString()}
                </p>
              )}
            </div>

            {!enabled && (
              <>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-400 via-brand-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-glow transition focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Preparing..." : qr ? "Regenerate QR" : "Enable two-factor"}
                </button>
                {qr && (
                  <div className="flex flex-col items-start gap-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-slate-300">Scan with Google Authenticator, Authy, or any TOTP app.</p>
                    <img src={qr} alt="Two-factor QR" className="h-40 w-40 rounded-xl bg-white p-2" />
                    <div className="flex w-full gap-2">
                      <input
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
                        placeholder="Enter 6-digit code"
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                      />
                      <button
                        type="button"
                        onClick={handleVerify}
                        disabled={loading}
                        className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {enabled && (
              <button
                type="button"
                onClick={handleDisable}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Processing..." : "Disable two-factor"}
              </button>
            )}
          </div>

          {enabled && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
              <p className="font-semibold text-white/80">Tip</p>
              <p>
                For best security, store recovery codes offline. Contact BuildLink support if you lose authenticator access—identity verification will be required.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

