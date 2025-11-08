import React, { useEffect, useMemo, useState } from "react";
import {
  awardBid,
  closeRFQ,
  createRFQ,
  subscribeToBuyerRFQs,
  subscribeToRFQBids,
} from "../rfqService";
import { subscribeToCatalogIndex } from "../catalogService";
import { createShipment, subscribeToRfqShipments } from "../logisticsService";
import { logEvent } from "../analytics";

const emptyLineItem = () => ({ description: "", quantity: "", unit: "" });

const statusBadges = {
  open: "bg-emerald-500/15 text-emerald-200",
  awarded: "bg-brand-500/20 text-brand-200",
  closed: "bg-slate-500/20 text-slate-200",
};

export default function RFQBuyerPanel({ user, profile, showBanner, twoFactorEnabled, twoFactorVerified }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    budget: "",
    lineItems: [emptyLineItem()],
  });
  const [submitting, setSubmitting] = useState(false);
  const [rfqs, setRfqs] = useState([]);
  const [expandedRfq, setExpandedRfq] = useState(null);
  const [bidsMap, setBidsMap] = useState({});
  const [loadingBid, setLoadingBid] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [shipmentsMap, setShipmentsMap] = useState({});

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToBuyerRFQs(user.uid, (items) => {
      setRfqs(items);
      if (items.length === 0) {
        setExpandedRfq(null);
      }
    });
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!expandedRfq) return;
    const unsubscribe = subscribeToRFQBids(expandedRfq, (bids) => {
      setBidsMap((prev) => ({ ...prev, [expandedRfq]: bids }));
    });
    const unsubscribeShipments = subscribeToRfqShipments(expandedRfq, (shipments) => {
      setShipmentsMap((prev) => ({ ...prev, [expandedRfq]: shipments }));
    });
    return () => {
      unsubscribe();
      unsubscribeShipments();
    };
  }, [expandedRfq]);

  useEffect(() => {
    const unsubscribe = subscribeToCatalogIndex((items) => {
      setCatalog(items.filter((item) => !item.archived));
    });
    return () => unsubscribe();
  }, []);

  const handleAddLineItem = () => {
    setForm((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, emptyLineItem()],
    }));
  };

  const handleLineItemChange = (index, field, value) => {
    setForm((prev) => {
      const next = [...prev.lineItems];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, lineItems: next };
    });
  };

  const handleRemoveLineItem = (index) => {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, idx) => idx !== index),
    }));
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      dueDate: "",
      budget: "",
      lineItems: [emptyLineItem()],
    });
  };

  const handleCreateRFQ = async (event) => {
    event.preventDefault();
    if (!user?.uid) return;

    setSubmitting(true);
    showBanner();

    try {
      const cleanedLineItems = form.lineItems
        .filter((item) => item.description.trim() !== "")
        .map((item) => ({
          description: item.description.trim(),
          quantity: item.quantity.trim(),
          unit: item.unit.trim(),
        }));

      if (cleanedLineItems.length === 0) {
        throw new Error("Add at least one line item.");
      }

      const rfqId = await createRFQ(user.uid, {
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        budget: form.budget ? Number(form.budget) : null,
        lineItems: cleanedLineItems,
        buyerCompany: profile?.companyName || profile?.company || "",
      });

      // Track RFQ creation
      logEvent("rfq_created", {
        rfq_id: rfqId,
        line_items_count: cleanedLineItems.length,
        has_budget: !!form.budget,
      });

      resetForm();
      showBanner("success", "RFQ published. Suppliers have been notified.");
    } catch (error) {
      showBanner(
        "error",
        error?.message || "Unable to create RFQ. Please review the form."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleExpand = (rfqId) => {
    setExpandedRfq((current) => (current === rfqId ? null : rfqId));
  };

  const buyerSummary = useMemo(() => {
    const total = rfqs.length;
    const open = rfqs.filter((rfq) => rfq.status === "open").length;
    const awarded = rfqs.filter((rfq) => rfq.status === "awarded").length;
    return { total, open, awarded };
  }, [rfqs]);

  const handleAward = async (rfqId, bidId) => {
    if (twoFactorEnabled && !twoFactorVerified) {
      showBanner("error", "Confirm your two-factor code before awarding bids.");
      return;
    }
    setLoadingBid(true);
    showBanner();
    try {
      await awardBid(rfqId, bidId);
      
      // Track bid award
      logEvent("bid_awarded", {
        rfq_id: rfqId,
        bid_id: bidId,
      });
      
      showBanner("success", "Bid awarded successfully.");
    } catch (error) {
      showBanner("error", error?.message || "Unable to award bid.");
    } finally {
      setLoadingBid(false);
    }
  };

  const handleClose = async (rfqId) => {
    showBanner();
    try {
      await closeRFQ(rfqId);
      showBanner("info", "RFQ closed. Suppliers will no longer see it.");
    } catch (error) {
      showBanner("error", error?.message || "Unable to close RFQ.");
    }
  };

  const handleCreateShipment = async (rfq, bid) => {
    if (twoFactorEnabled && !twoFactorVerified) {
      showBanner("error", "Complete two-factor verification before scheduling shipments.");
      return;
    }

    showBanner();
    try {
      await createShipment({
        rfqId: rfq.id,
        buyerId: user.uid,
        buyerCompany: profile?.companyName || profile?.company || user.email,
        supplierId: bid.supplierId,
        supplierName: bid.supplierName || bid.supplierId,
        origin: profile?.address || "",
        destination: bid.deliveryAddress || profile?.projectType || "",
        status: "scheduled",
      });
      showBanner("success", "Shipment request created. Supplier will track delivery milestones.");
    } catch (error) {
      showBanner("error", error?.message || "Unable to create shipment.");
    }
  };

  const handleAddFromCatalog = (item) => {
    setForm((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          description: `${item.name} (${item.category || "Catalog"})`,
          quantity: "",
          unit: item.unit || "",
        },
      ],
    }));
    showBanner("info", "Catalog item copied into the RFQ line items. Adjust quantity before publishing.");
  };

  return (
    <section className="mx-auto w-full max-w-6xl pb-20">
      <div className="mb-10 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-200">
              Step 3 · Publish sourcing needs
            </p>
            <h3 className="text-xl font-semibold text-white">Create a new RFQ</h3>
            <p className="text-sm text-slate-300">
              Describe your scope and invite pre-qualified suppliers to respond. Richer line items lead to sharper proposals.
            </p>
          </div>
          <div className="grid w-full max-w-xs grid-cols-3 gap-2 text-center text-xs text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-lg font-semibold text-white">{buyerSummary.total}</p>
              <p>Total RFQs</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-emerald-500/10 px-3 py-2 text-emerald-200">
              <p className="text-lg font-semibold">{buyerSummary.open}</p>
              <p>Open</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-brand-500/10 px-3 py-2 text-brand-200">
              <p className="text-lg font-semibold">{buyerSummary.awarded}</p>
              <p>Awarded</p>
            </div>
          </div>
        </div>

        <form className="mt-6 grid gap-6" onSubmit={handleCreateRFQ}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-200">
                Catalog suggestions
              </h4>
              <span className="text-xs text-slate-400">Tap to add to RFQ</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {catalog.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAddFromCatalog(item)}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm text-slate-200 transition hover:border-brand-400/60 hover:bg-brand-400/10"
                >
                  <p className="font-semibold text-white/90">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.category || "Catalogue"}</p>
                  {item.unitPrice && (
                    <p className="mt-1 text-xs text-slate-300">
                      ETB {Number(item.unitPrice).toLocaleString()} / {item.unit || "unit"}
                    </p>
                  )}
                </button>
              ))}
              {catalog.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-xs text-slate-300">
                  Supplier catalog entries will appear here.
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Project title</label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
                placeholder="e.g. Addis Expressway Lot 04"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Budget ceiling (ETB)</label>
              <input
                type="number"
                min={0}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
                placeholder="5000000"
                value={form.budget}
                onChange={(event) => setForm((prev) => ({ ...prev, budget: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Proposal deadline</label>
              <input
                type="date"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
                value={form.dueDate}
                onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Scope summary</label>
            <textarea
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
              placeholder="Outline objectives, milestones, site access, and required standards."
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-200">Line items</label>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/30 hover:text-white"
              >
                Add line item
              </button>
            </div>
            <div className="space-y-3">
              {form.lineItems.map((item, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-[2fr_1fr_1fr_auto]"
                >
                  <input
                    className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none"
                    placeholder="Material or service description"
                    value={item.description}
                    onChange={(event) => handleLineItemChange(index, "description", event.target.value)}
                    required
                  />
                  <input
                    className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none"
                    placeholder="Quantity"
                    value={item.quantity}
                    onChange={(event) => handleLineItemChange(index, "quantity", event.target.value)}
                  />
                  <input
                    className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none"
                    placeholder="Unit"
                    value={item.unit}
                    onChange={(event) => handleLineItemChange(index, "unit", event.target.value)}
                  />
                  {form.lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(index)}
                      className="rounded-lg border border-rose-400/40 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:border-rose-400 hover:text-white"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-400 via-brand-500 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-glow transition focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Publishing..." : "Publish RFQ"}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-200">
          Active sourcing pipeline
        </h4>
        {rfqs.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-sm text-slate-300">
            <p>No RFQs yet. Share your first opportunity to engage vetted suppliers.</p>
          </div>
        )}

        {rfqs.map((rfq) => {
          const bids = bidsMap[rfq.id] || [];
          const shipments = shipmentsMap[rfq.id] || [];
          const isExpanded = expandedRfq === rfq.id;
          const badgeClass = statusBadges[rfq.status] || "bg-slate-500/20 text-slate-200";

          return (
            <div key={rfq.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${badgeClass}`}>
                      {rfq.status}
                    </span>
                    <p className="text-xs text-slate-400">
                      Due {rfq.dueDate ? new Date(rfq.dueDate).toLocaleDateString() : "TBC"}
                    </p>
                  </div>
                  <h5 className="text-lg font-semibold text-white">{rfq.title}</h5>
                  <p className="text-sm text-slate-300">{rfq.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                    {rfq.lineItems?.map((item, index) => (
                      <span key={index} className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                        {item.quantity ? `${item.quantity} ` : ""}
                        {item.unit ? `${item.unit} · ` : ""}
                        {item.description}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <p className="text-sm text-slate-300">
                    {bids.length} {bids.length === 1 ? "bid" : "bids"}
                  </p>
                  <div className="flex gap-2">
                    {rfq.status === "open" && (
                      <button
                        type="button"
                        onClick={() => handleClose(rfq.id)}
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/30 hover:text-white"
                      >
                        Close RFQ
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleExpand(rfq.id)}
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/30 hover:text-white"
                    >
                      {isExpanded ? "Hide bids" : "View bids"}
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-6 space-y-3">
                  {bids.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-slate-300">
                      No bids yet. You’ll be notified as soon as suppliers respond.
                    </div>
                  )}

                  {bids.map((bid) => {
                    const isAwarded = bid.status === "awarded";
                    const isDeclined = bid.status === "declined";
                    const isWithdrawn = bid.status === "withdrawn";

                    return (
                      <div
                        key={bid.id}
                        className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-1 text-sm text-slate-200">
                          <p className="text-base font-semibold text-white">{bid.supplierName || "Supplier"}</p>
                          <p className="text-sm text-slate-300">{bid.message}</p>
                          {isAwarded && (
                            <p className="text-xs text-brand-200">
                              Awarded · initiate logistics below
                            </p>
                          )}
                          <p className="text-xs text-slate-400">
                            Updated {bid.updatedAt?.toDate ? bid.updatedAt.toDate().toLocaleString() : "just now"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right text-sm text-slate-200">
                            {bid.amount && <p className="text-lg font-semibold text-white">ETB {Number(bid.amount).toLocaleString()}</p>}
                            {bid.leadTime && <p className="text-xs text-slate-300">Lead time: {bid.leadTime}</p>}
                          </div>
                          <div className="flex gap-2">
                            {!isAwarded && !isDeclined && !isWithdrawn && rfq.status === "open" && (
                              <button
                                type="button"
                                onClick={() => handleAward(rfq.id, bid.id)}
                                disabled={loadingBid}
                                className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {loadingBid ? "Processing..." : "Award"}
                              </button>
                            )}
                            {isAwarded && (
                              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                                Awarded
                              </span>
                            )}
                            {isDeclined && (
                              <span className="rounded-full bg-slate-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                                Declined
                              </span>
                            )}
                            {isWithdrawn && (
                              <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-200">
                                Withdrawn
                              </span>
                            )}
                          </div>
                          {isAwarded && (
                            <button
                              type="button"
                              onClick={() => handleCreateShipment(rfq, bid)}
                              className="rounded-lg border border-brand-400/40 px-3 py-1.5 text-xs font-semibold text-brand-200 transition hover:border-brand-400 hover:text-white"
                            >
                              Schedule shipment
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {shipments.length > 0 && (
                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-200">Shipments</p>
                      <div className="mt-2 space-y-2">
                        {shipments.map((shipment) => (
                          <div key={shipment.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
                            <div className="flex justify-between">
                              <span>#{shipment.shipmentId?.slice(0, 6) || shipment.id}</span>
                              <span className="text-slate-200">{shipment.status}</span>
                            </div>
                            <p>Origin: {shipment.origin || "TBC"}</p>
                            <p>Destination: {shipment.destination || "TBC"}</p>
                            <p>
                              Last update: {shipment.updatedAt?.toDate ? shipment.updatedAt.toDate().toLocaleString() : "recent"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

