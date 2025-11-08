import React, { useEffect, useState } from "react";
import { subscribeToPendingCredentials, updateCredentialStatus } from "../complianceService";

export default function AdminComplianceConsole({ user, showBanner }) {
  const [pending, setPending] = useState([]);
  const [processing, setProcessing] = useState(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToPendingCredentials(setPending);
    return () => unsubscribe();
  }, []);

  if (pending.length === 0) {
    return (
      <section className="mx-auto w-full max-w-6xl pb-16">
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
          <p>Nothing to review. Suppliers and buyers will appear here when documentation is submitted.</p>
        </div>
      </section>
    );
  }

  const handleDecision = async (uid, decision) => {
    if (!user?.uid) return;
    setProcessing(uid);
    showBanner();
    try {
      await updateCredentialStatus(uid, decision, user.uid, note);
      showBanner("success", `Marked as ${decision}.`);
      setNote("");
    } catch (error) {
      showBanner("error", error?.message || "Unable to update credential status.");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl pb-16">
      <div className="mb-4 flex flex-col gap-2">
        <h3 className="text-xl font-semibold text-white">Compliance console</h3>
        <p className="text-sm text-slate-300">
          Review and approve supplier/buyer credentials. Attach notes to maintain an auditable trail.
        </p>
      </div>

      <div className="space-y-4">
        {pending.map((record) => (
          <div key={record.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2 text-sm text-slate-200">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{record.role}</p>
                <h4 className="text-lg font-semibold text-white">{record.companyName || record.email}</h4>
                <p className="text-xs text-slate-400">Contact: {record.email}</p>
                <div className="space-y-1">
                  <p className="text-xs text-slate-300">Uploaded documents</p>
                  <ul className="space-y-1 text-xs">
                    {record.credentialFiles?.map((file) => (
                      <li key={file.id}>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-200 underline-offset-2 hover:underline"
                        >
                          {file.name}
                        </a>
                        <span className="text-slate-500"> · {new Date(file.uploadedAt).toLocaleString()}</span>
                      </li>
                    ))}
                    {(!record.credentialFiles || record.credentialFiles.length === 0) && (
                      <li className="text-slate-500">No files uploaded</li>
                    )}
                  </ul>
                </div>
              </div>
              <div className="flex w-full max-w-xs flex-col gap-3 text-sm text-slate-200">
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
                  placeholder="Review notes (visible to internal teams only)"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDecision(record.id, "verified")}
                    disabled={processing === record.id}
                    className="flex-1 rounded-lg bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(record.id, "rejected")}
                    disabled={processing === record.id}
                    className="flex-1 rounded-lg bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}




