import React, { useEffect, useState } from "react";
import { subscribeToBuyerShipments } from "../logisticsService";

export default function BuyerShipmentsPanel({ user }) {
  const [shipments, setShipments] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToBuyerShipments(user.uid, setShipments);
    return () => unsubscribe();
  }, [user?.uid]);

  if (!user) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-6xl pb-20">
      <div className="mb-4 flex flex-col gap-2">
        <h3 className="text-xl font-semibold text-white">Shipment tracker</h3>
        <p className="text-sm text-slate-300">
          Monitor logistics milestones for awarded projects. Updates reflect supplier progress in real time.
        </p>
      </div>

      {shipments.length === 0 && (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
          <p>No shipments yet. Once a supplier confirms delivery, you can track their progress here.</p>
        </div>
      )}

      <div className="space-y-4">
        {shipments.map((shipment) => (
          <div key={shipment.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2 text-sm text-slate-200">
                <h4 className="text-lg font-semibold text-white">
                  Shipment #{shipment.shipmentId?.slice(0, 6) || shipment.id}
                </h4>
                <p className="text-xs text-slate-400">Supplier: {shipment.supplierName || shipment.supplierId}</p>
                <p className="text-xs text-slate-400">Origin: {shipment.origin || "TBC"}</p>
                <p className="text-xs text-slate-400">Destination: {shipment.destination || "TBC"}</p>
              </div>
              <div className="flex flex-col items-end gap-1 text-right text-xs text-slate-400">
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-200">
                  {shipment.status}
                </span>
                <p>Requested {shipment.createdAt?.toDate ? shipment.createdAt.toDate().toLocaleDateString() : "recently"}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-300">
              <p>Timeline</p>
              <ol className="space-y-1">
                {shipment.history?.map((entry, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-brand-400" />
                    <span>
                      {entry.status}
                      {entry.timestamp?.toDate ? ` · ${entry.timestamp.toDate().toLocaleString()}` : ""}
                      {entry.note ? ` – ${entry.note}` : ""}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}




