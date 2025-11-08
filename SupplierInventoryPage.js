import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, serverTimestamp } from "firebase/firestore";
import { subscribeToAuth, getUserProfile } from "../auth";
import { logEvent } from "../analytics";

export default function SupplierInventoryPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [form, setForm] = useState({
    itemName: "",
    category: "",
    quantity: "",
    unit: "",
    unitPrice: "",
    location: "",
    status: "available", // available, low_stock, out_of_stock
    notes: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
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
        // Redirect if not a supplier
        if (prof && prof.role !== "supplier") {
          navigate("/dashboard");
        }
      });
    }
  }, [user?.uid, navigate]);

  useEffect(() => {
    if (!user?.uid) return;

    // Query inventory - try with orderBy, fallback without if index missing
    const baseQuery = query(
      collection(db, "supplierInventory"),
      where("supplierId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      baseQuery,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort manually if orderBy not available
        items.sort((a, b) => {
          const aTime = a.updatedAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.updatedAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
          return bTime - aTime;
        });
        setInventory(items);
      },
      (error) => {
        console.error("Error fetching inventory:", error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      const payload = {
        supplierId: user.uid,
        itemName: form.itemName.trim(),
        category: form.category.trim(),
        quantity: Number(form.quantity) || 0,
        unit: form.unit.trim(),
        unitPrice: form.unitPrice ? Number(form.unitPrice) : null,
        location: form.location.trim(),
        status: form.status,
        notes: form.notes.trim(),
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "supplierInventory", editingId), payload);
        logEvent("inventory_updated", { item_id: editingId });
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "supplierInventory"), payload);
        logEvent("inventory_added", { category: form.category });
      }

      resetForm();
    } catch (error) {
      console.error("Error saving inventory:", error);
      alert("Failed to save inventory item. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item) => {
    setForm({
      itemName: item.itemName || "",
      category: item.category || "",
      quantity: item.quantity?.toString() || "",
      unit: item.unit || "",
      unitPrice: item.unitPrice?.toString() || "",
      location: item.location || "",
      status: item.status || "available",
      notes: item.notes || "",
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this inventory item?")) return;

    try {
      await deleteDoc(doc(db, "supplierInventory", id));
      logEvent("inventory_deleted", { item_id: id });
    } catch (error) {
      console.error("Error deleting inventory:", error);
      alert("Failed to delete item. Please try again.");
    }
  };

  const resetForm = () => {
    setForm({
      itemName: "",
      category: "",
      quantity: "",
      unit: "",
      unitPrice: "",
      location: "",
      status: "available",
      notes: "",
    });
    setEditingId(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-emerald-500/20 text-emerald-200";
      case "low_stock":
        return "bg-amber-500/20 text-amber-200";
      case "out_of_stock":
        return "bg-rose-500/20 text-rose-200";
      default:
        return "bg-slate-500/20 text-slate-200";
    }
  };

  const stats = {
    total: inventory.length,
    available: inventory.filter((i) => i.status === "available").length,
    lowStock: inventory.filter((i) => i.status === "low_stock").length,
    outOfStock: inventory.filter((i) => i.status === "out_of_stock").length,
  };

  return (
    <div className="min-h-screen bg-slate-900 px-6 py-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
            <p className="mt-2 text-slate-300">Track and manage your supply inventory</p>
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
            <p className="text-sm text-slate-400">Total Items</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <p className="text-sm text-emerald-300">Available</p>
            <p className="text-2xl font-bold text-emerald-200">{stats.available}</p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-300">Low Stock</p>
            <p className="text-2xl font-bold text-amber-200">{stats.lowStock}</p>
          </div>
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
            <p className="text-sm text-rose-300">Out of Stock</p>
            <p className="text-2xl font-bold text-rose-200">{stats.outOfStock}</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">
              {editingId ? "Edit Inventory Item" : "Add New Item"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">Item Name</label>
                <input
                  type="text"
                  value={form.itemName}
                  onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none"
                  placeholder="e.g. Cement, Steel Rebar"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-200">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none"
                    placeholder="e.g. Building Materials"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-200">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-brand-400 focus:outline-none"
                  >
                    <option value="available">Available</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-200">Quantity</label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none"
                    placeholder="100"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-200">Unit</label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none"
                    placeholder="bags, tons, m³"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-200">Unit Price (ETB)</label>
                  <input
                    type="number"
                    value={form.unitPrice}
                    onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none"
                    placeholder="500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">Storage Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none"
                  placeholder="Warehouse A, Section 3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none"
                  placeholder="Additional information..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : editingId ? "Update Item" : "Add Item"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/40"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Inventory List</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {inventory.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/20 bg-white/5 p-8 text-center text-slate-300">
                  <p>No inventory items yet.</p>
                  <p className="mt-2 text-sm text-slate-400">Add your first item to get started.</p>
                </div>
              ) : (
                inventory.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-white/10 bg-slate-900/50 p-4 transition hover:border-brand-400/40"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{item.itemName}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(item.status)}`}>
                            {item.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">{item.category}</p>
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-300">
                          <span>
                            Quantity: <strong className="text-white">{item.quantity} {item.unit}</strong>
                          </span>
                          {item.unitPrice && (
                            <span>
                              Price: <strong className="text-white">ETB {Number(item.unitPrice).toLocaleString()}/{item.unit}</strong>
                            </span>
                          )}
                          {item.location && (
                            <span>
                              Location: <strong className="text-white">{item.location}</strong>
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="mt-2 text-xs text-slate-400">{item.notes}</p>
                        )}
                      </div>
                      <div className="ml-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/40"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg border border-rose-400/40 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:border-rose-400"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

