import React, { useEffect, useMemo, useState } from "react";
import {
  submitBid,
  subscribeToOpenRFQs,
  subscribeToSupplierBids,
  withdrawBid,
} from "../rfqService";
import { logEvent } from "../analytics";

const statusTone = {
  submitted: "bg-brand-500/20 text-brand-200",
  awarded: "bg-emerald-500/20 text-emerald-200",
  declined: "bg-slate-500/20 text-slate-200",
  withdrawn: "bg-rose-500/20 text-rose-200",
};

export default function RFQSupplierPanel({ user, profile, showBanner }) {
  const [rfqs, setRfqs] = useState([]);
  const [bids, setBids] = useState([]);
  const [formState, setFormState] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToOpenRFQs(setRfqs);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToSupplierBids(user.uid, setBids);
    return () => unsubscribe();
  }, [user?.uid]);

  const bidsByRfq = useMemo(() => {
    return bids.reduce((acc, bid) => {
      acc[bid.rfqId] = bid;
      return acc;
    }, {});
  }, [bids]);

  const handleInputChange = (rfqId, field, value) => {
    setFormState((prev) => ({
      ...prev,
      [rfqId]: {
        ...prev[rfqId],
        [field]: value,
      },
    }));
  };

  const handleSubmitBid = async (rfq) => {
    if (!user?.uid) return;
    const current = formState[rfq.id] || {};
    const existingBid = bidsByRfq[rfq.id];
    const amount = current.amount ?? existingBid?.amount;
    if (!amount) {
      showBanner("error", "Please provide a proposed amount.");
      return;
    }

    setSubmittingId(rfq.id);
    showBanner();

    try {
      const bidId = await submitBid(rfq.id, user.uid, {
        amount: Number(amount),
        leadTime: current.leadTime ?? existingBid?.leadTime ?? "",
        message: current.message ?? existingBid?.message ?? "",
        supplierName: profile?.companyName || profile?.company || profile?.email || user.email,
      });

      // Track bid submission
      logEvent("bid_submitted", {
        rfq_id: rfq.id,
        bid_id: bidId,
        amount: Number(amount),
      });

      showBanner("success", "Bid submitted successfully.");
      setFormState((prev) => ({ ...prev, [rfq.id]: {} }));
    } catch (error) {
      showBanner("error", error?.message || "Unable to submit bid.");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleWithdraw = async (rfqId) => {
    if (!user?.uid) return;
    setSubmittingId(rfqId);
    showBanner();
    try {
      await withdrawBid(rfqId, user.uid);
      
      // Track bid withdrawal
      logEvent("bid_withdrawn", {
        rfq_id: rfqId,
      });
      
      showBanner("info", "Bid withdrawn. Buyers will no longer see it.");
      setFormState((prev) => ({ ...prev, [rfqId]: {} }));
    } catch (error) {
      showBanner("error", error?.message || "Unable to withdraw bid.");
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredRfqs = rfqs.filter((rfq) => rfq.buyerId !== user?.uid);

  return (
    <section className="mx-auto w-full max-w-6xl pb-20">
      <div className="mb-8 flex flex-col gap-2">
        <h3 className="text-xl font-semibold text-white">Opportunities curated for you</h3>
        <p className="text-sm text-slate-300">
          Respond to active sourcing needs. You can revisit and update bids until a buyer awards the RFQ.
        </p>
      </div>

      {filteredRfqs.length === 0 && (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300">
          <p>No open RFQs at the moment. Stay tuned for new opportunities.</p>
        </div>
      )}

      <div className="space-y-6">
        {filteredRfqs.map((rfq) => {
          const existingBid = bidsByRfq[rfq.id];
          const statusClass = statusTone[existingBid?.status] || "bg-brand-500/20 text-brand-200";
          const bidForm = formState[rfq.id] || {};
          const resolvedMessage = bidForm.message ?? existingBid?.message ?? "";
          const resolvedAmount = bidForm.amount ?? existingBid?.amount ?? "";
          const resolvedLeadTime = bidForm.leadTime ?? existingBid?.leadTime ?? "";

          return (
            <div key={rfq.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-white/80">
                      Deadline {rfq.dueDate ? new Date(rfq.dueDate).toLocaleDateString() : "TBC"}
                    </span>
                    {existingBid && (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusClass}`}>
                        {existingBid.status}
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-semibold text-white">{rfq.title}</h4>
                  <p className="text-sm text-slate-300">{rfq.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                    {rfq.lineItems?.map((item, index) => (
                      <span key={index} className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                        {item.description}
                        {item.quantity && ` · ${item.quantity}${item.unit ? ` ${item.unit}` : ""}`}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 text-right text-sm text-slate-300">
                  {rfq.budget ? (
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Budget ceiling</p>
                      <p className="text-lg font-semibold text-white">ETB {Number(rfq.budget).toLocaleString()}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Budget confidential</p>
                  )}
                  <p className="text-xs text-slate-400">
                    Posted {rfq.createdAt?.toDate ? rfq.createdAt.toDate().toLocaleDateString() : "recently"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-200">Proposal message</label>
                  <textarea
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
                    placeholder="Outline delivery readiness, specifications, and differentiators."
                    value={resolvedMessage}
                    onChange={(event) => handleInputChange(rfq.id, "message", event.target.value)}
                    disabled={existingBid && existingBid.status === "awarded"}
                  />
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">Offer amount (ETB)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
                      placeholder="4250000"
                      value={resolvedAmount}
                      onChange={(event) => handleInputChange(rfq.id, "amount", event.target.value)}
                      disabled={existingBid && existingBid.status === "awarded"}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">Lead time</label>
                    <input
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
                      placeholder="e.g. 6 weeks"
                      value={resolvedLeadTime}
                      onChange={(event) => handleInputChange(rfq.id, "leadTime", event.target.value)}
                      disabled={existingBid && existingBid.status === "awarded"}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleSubmitBid(rfq)}
                      disabled={submittingId === rfq.id || (existingBid && existingBid.status === "awarded")}
                      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-400 via-brand-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-glow transition focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submittingId === rfq.id ? "Saving..." : existingBid ? "Update bid" : "Submit bid"}
                    </button>
                    {existingBid && existingBid.status === "submitted" && (
                      <button
                        type="button"
                        onClick={() => handleWithdraw(rfq.id)}
                        disabled={submittingId === rfq.id}
                        className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Withdraw bid
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

