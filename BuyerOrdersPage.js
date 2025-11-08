import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { collection, onSnapshot, query, where, orderBy, doc, getDoc } from "firebase/firestore";
import { subscribeToAuth, getUserProfile } from "../auth";

export default function BuyerOrdersPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user?.uid) {
      getUserProfile(user.uid).then((prof) => {
        setProfile(prof);
        // Redirect if not a buyer
        if (prof && prof.role !== "buyer") {
          navigate("/dashboard");
        }
      });
    }
  }, [user?.uid, navigate]);

  useEffect(() => {
    if (!user?.uid) return;

    // Get orders from shipments
    const shipmentsQuery = query(
      collection(db, "shipments"),
      where("buyerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(shipmentsQuery, async (snapshot) => {
      const shipments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      // Get RFQ details for each shipment
      const ordersWithDetails = await Promise.all(
        shipments.map(async (shipment) => {
          let rfqData = null;
          if (shipment.rfqId) {
            try {
              const rfqDoc = await getDoc(doc(db, "rfqs", shipment.rfqId));
              rfqData = rfqDoc.exists() ? rfqDoc.data() : null;
            } catch (error) {
              console.warn("Error fetching RFQ:", error);
            }
          }
          
          return {
            id: shipment.id,
            shipmentId: shipment.shipmentId || shipment.id,
            rfqTitle: rfqData?.title || shipment.rfqId || "Order",
            rfqDescription: rfqData?.description || "",
            lineItems: rfqData?.lineItems || [],
            supplierName: shipment.supplierName || "Supplier",
            supplierId: shipment.supplierId,
            status: shipment.status || "scheduled",
            origin: shipment.origin || "",
            destination: shipment.destination || "",
            createdAt: shipment.createdAt,
            updatedAt: shipment.updatedAt,
            history: shipment.history || [],
            budget: rfqData?.budget || null,
          };
        })
      );

      setOrders(ordersWithDetails);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, navigate]);

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-500/20 text-emerald-200";
      case "in_transit":
        return "bg-blue-500/20 text-blue-200";
      case "scheduled":
        return "bg-amber-500/20 text-amber-200";
      case "cancelled":
        return "bg-rose-500/20 text-rose-200";
      default:
        return "bg-slate-500/20 text-slate-200";
    }
  };

  const stats = {
    total: orders.length,
    scheduled: orders.filter((o) => o.status === "scheduled").length,
    inTransit: orders.filter((o) => o.status === "in_transit").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-brand-500 border-r-transparent"></div>
          <p className="text-slate-300">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 px-6 py-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">My Orders</h1>
            <p className="mt-2 text-slate-300">Track your ordered supplies and shipments</p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/40 hover:text-white"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">Total Orders</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-300">Scheduled</p>
            <p className="text-2xl font-bold text-amber-200">{stats.scheduled}</p>
          </div>
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
            <p className="text-sm text-blue-300">In Transit</p>
            <p className="text-2xl font-bold text-blue-200">{stats.inTransit}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <p className="text-sm text-emerald-300">Delivered</p>
            <p className="text-2xl font-bold text-emerald-200">{stats.delivered}</p>
          </div>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-4 text-lg font-medium text-slate-300">No orders yet</p>
              <p className="mt-2 text-sm text-slate-400">
                Orders will appear here after you award bids on RFQs and create shipments
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="mt-6 rounded-lg bg-brand-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-400"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-brand-400/40"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-white">{order.rfqTitle}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${getStatusColor(order.status)}`}>
                        {order.status.replace("_", " ")}
                      </span>
                    </div>
                    {order.rfqDescription && (
                      <p className="mt-2 text-sm text-slate-300">{order.rfqDescription}</p>
                    )}
                    
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-xs text-slate-400">Supplier</p>
                        <p className="text-sm font-medium text-white">{order.supplierName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Shipment ID</p>
                        <p className="text-sm font-medium text-white font-mono">
                          #{order.shipmentId?.slice(0, 8) || order.id.slice(0, 8)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Origin</p>
                        <p className="text-sm font-medium text-white">{order.origin || "TBC"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Destination</p>
                        <p className="text-sm font-medium text-white">{order.destination || "TBC"}</p>
                      </div>
                    </div>

                    {order.budget && (
                      <div className="mt-4">
                        <p className="text-xs text-slate-400">Order Value</p>
                        <p className="text-lg font-semibold text-white">
                          ETB {Number(order.budget).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {order.lineItems && order.lineItems.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Order Items</p>
                        <div className="flex flex-wrap gap-2">
                          {order.lineItems.map((item, idx) => (
                            <span
                              key={idx}
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                            >
                              {item.quantity} {item.unit} · {item.description}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {order.history && order.history.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Timeline</p>
                        <div className="space-y-2">
                          {order.history.slice(-5).reverse().map((entry, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                              <div className="h-2 w-2 rounded-full bg-brand-400"></div>
                              <span className="capitalize">{entry.status?.replace("_", " ")}</span>
                              {entry.note && <span className="text-slate-500">· {entry.note}</span>}
                              {entry.timestamp && (
                                <span className="ml-auto text-slate-500">
                                  {entry.timestamp?.toDate ? entry.timestamp.toDate().toLocaleString() : "Recent"}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
