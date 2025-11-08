import React, { useEffect, useState } from "react";
import {
  subscribeToLogisticsProfile,
  subscribeToSupplierShipments,
  upsertLogisticsProfile,
  updateShipmentStatus,
} from "../logisticsService";

const shipmentStatusOrder = ["scheduled", "in_transit", "delivered", "cancelled"];

export default function SupplierLogisticsPanel({ user, showBanner, twoFactorEnabled, twoFactorVerified }) {
  const [profile, setProfile] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [form, setForm] = useState({
    fleetSize: "",
    coverageAreas: "",
    transportModes: "",
    leadTime: "",
    contactPerson: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingShipment, setUpdatingShipment] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribeProfile = subscribeToLogisticsProfile(user.uid, (data) => {
      setProfile(data);
      if (data) {
        setForm({
          fleetSize: data.fleetSize || "",
          coverageAreas: (data.coverageAreas || []).join(", "),
          transportModes: (data.transportModes || []).join(", "),
          leadTime: data.leadTime || "",
          contactPerson: data.contactPerson || "",
        });
      }
    });

    const unsubscribeShipments = subscribeToSupplierShipments(user.uid, setShipments);

    return () => {
      unsubscribeProfile();
      unsubscribeShipments();
    };
  }, [user?.uid]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!user?.uid) return;
    setSavingProfile(true);
    showBanner();

    try {
      await upsertLogisticsProfile(user.uid, {
        fleetSize: form.fleetSize,
        coverageAreas: form.coverageAreas
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        transportModes: form.transportModes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        leadTime: form.leadTime,
        contactPerson: form.contactPerson,
      });
      showBanner("success", "Logistics profile saved.");
    } catch (error) {
      showBanner("error", error?.message || "Unable to save logistics profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateShipment = async (shipmentId, status) => {
    if (twoFactorEnabled && !twoFactorVerified) {
      showBanner("error", "Complete two-factor verification before updating shipments.");
      return;
    }
    setUpdatingShipment(shipmentId);
    showBanner();
    try {
      await updateShipmentStatus(shipmentId, status, `Updated to ${status}`);
      showBanner("success", "Shipment status updated.");
    } catch (error) {
      showBanner("error", error?.message || "Unable to update shipment.");
    } finally {
      setUpdatingShipment(null);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl pb-20">
      <div className="mb-6 flex flex-col gap-2">
        <h3 className="text-xl font-semibold text-white">Logistics & fulfilment</h3>
        <p className="text-sm text-slate-300">
          Let buyers know your delivery strengths and keep shipments on track from pick-up to proof of delivery.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {shipments.length === 0 && (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
              <p>No shipments yet. Once buyers award an RFQ and request logistics, they will appear here.</p>
            </div>
          )}

          {shipments.map((shipment) => (
            <div key={shipment.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2 text-sm text-slate-200">
                  <h4 className="text-lg font-semibold text-white">
                    Shipment #{shipment.shipmentId?.slice(0, 6) || shipment.id}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Buyer: {shipment.buyerCompany || shipment.buyerId}
                  </p>
                  <p className="text-xs text-slate-400">Origin: {shipment.origin || "TBC"}</p>
                  <p className="text-xs text-slate-400">Destination: {shipment.destination || "TBC"}</p>
                  <div className="space-y-1 text-xs text-slate-400">
                    <p>Status timeline:</p>
                    <ol className="space-y-1">
                      {shipment.history?.map((entry, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-brand-400" />
                          <span>
                            {entry.status} · {entry.timestamp?.toDate ? entry.timestamp.toDate().toLocaleString() : "recent"}
                            {entry.note ? ` – ${entry.note}` : ""}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-200">
                    {shipment.status}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {shipmentStatusOrder.map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={status === shipment.status || updatingShipment === shipment.id}
                        onClick={() => handleUpdateShipment(shipment.id, status)}
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {status.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleProfileSubmit} className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-200">Logistics profile</p>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-200">Fleet size / capacity</label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
                value={form.fleetSize}
                onChange={(event) => setForm((prev) => ({ ...prev, fleetSize: event.target.value }))}
                placeholder="e.g. 12 articulated trucks"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-200">Coverage areas</label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
                value={form.coverageAreas}
                onChange={(event) => setForm((prev) => ({ ...prev, coverageAreas: event.target.value }))}
                placeholder="Addis Ababa, Dire Dawa, Mekelle"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-200">Transport modes</label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
                value={form.transportModes}
                onChange={(event) => setForm((prev) => ({ ...prev, transportModes: event.target.value }))}
                placeholder="Road, Heavy-lift, Crane services"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-200">Typical lead time</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
                  value={form.leadTime}
                  onChange={(event) => setForm((prev) => ({ ...prev, leadTime: event.target.value }))}
                  placeholder="3-5 days"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-200">Logistics contact</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
                  value={form.contactPerson}
                  onChange={(event) => setForm((prev) => ({ ...prev, contactPerson: event.target.value }))}
                  placeholder="Name · phone/email"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-400 via-brand-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-glow transition focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProfile ? "Saving..." : profile ? "Update profile" : "Save profile"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

