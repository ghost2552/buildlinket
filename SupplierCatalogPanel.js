import React, { useEffect, useState } from "react";
import {
  archiveCatalogItem,
  createCatalogItem,
  subscribeToSupplierCatalog,
  updateCatalogItem,
} from "../catalogService";

const emptyItem = {
  name: "",
  category: "",
  unit: "",
  unitPrice: "",
  availability: "",
  certifications: "",
};

export default function SupplierCatalogPanel({ user, showBanner }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyItem);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToSupplierCatalog(user.uid, setItems);
    return () => unsubscribe();
  }, [user?.uid]);

  const resetForm = () => {
    setForm(emptyItem);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user?.uid) return;
    setIsSaving(true);
    showBanner();

    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        unit: form.unit.trim(),
        unitPrice: form.unitPrice ? Number(form.unitPrice) : null,
        availability: form.availability.trim(),
        certifications: form.certifications
          .split(",")
          .map((token) => token.trim())
          .filter(Boolean),
      };

      if (editingId) {
        await updateCatalogItem(editingId, payload);
        showBanner("success", "Catalog item updated.");
      } else {
        await createCatalogItem(user.uid, payload);
        showBanner("success", "Catalog item added.");
      }

      resetForm();
    } catch (error) {
      showBanner("error", error?.message || "Unable to save catalog item.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      category: item.category || "",
      unit: item.unit || "",
      unitPrice: item.unitPrice || "",
      availability: item.availability || "",
      certifications: (item.certifications || []).join(", "),
    });
  };

  const handleArchive = async (itemId) => {
    showBanner();
    try {
      await archiveCatalogItem(itemId);
      showBanner("info", "Item archived.");
    } catch (error) {
      showBanner("error", error?.message || "Unable to archive item.");
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl pb-16">
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-semibold text-white">Catalog manager</h3>
        <p className="text-sm text-slate-300">
          Keep your material and service catalog up to date so buyers can discover accurate pricing and certifications.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
              <p>No catalog entries yet. Add your first product or service.</p>
            </div>
          )}

          {items.map((item) => (
            <div key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2 text-sm text-slate-200">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="rounded-full border border-white/10 px-3 py-1">
                      {item.category || "Uncategorised"}
                    </span>
                    {item.certifications?.map((cert) => (
                      <span key={cert} className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-brand-200">
                        {cert}
                      </span>
                    ))}
                  </div>
                  <h4 className="text-lg font-semibold text-white">{item.name}</h4>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    {item.unitPrice ? `ETB ${Number(item.unitPrice).toLocaleString()} per ${item.unit || "unit"}` : "Pricing on request"}
                  </p>
                  <p className="text-xs text-slate-400">Availability: {item.availability || "Contact for lead time"}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/30 hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArchive(item.id)}
                    className="rounded-lg border border-rose-400/40 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:border-rose-400 hover:text-white"
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.8)] backdrop-blur">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-200">
              {editingId ? "Update item" : "Add new item"}
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-200">Name</label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g. Precast girder"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-200">Category</label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                placeholder="Structural steel"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-200">Unit</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
                  value={form.unit}
                  onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))}
                  placeholder="ton"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-200">Unit price (ETB)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
                  value={form.unitPrice}
                  onChange={(event) => setForm((prev) => ({ ...prev, unitPrice: event.target.value }))}
                  placeholder="25000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-200">Availability</label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
                value={form.availability}
                onChange={(event) => setForm((prev) => ({ ...prev, availability: event.target.value }))}
                placeholder="Ready stock within 2 weeks"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-200">Certifications (comma separated)</label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
                value={form.certifications}
                onChange={(event) => setForm((prev) => ({ ...prev, certifications: event.target.value }))}
                placeholder="ISO 9001, CE"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-brand-400 via-brand-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-glow transition focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : editingId ? "Update item" : "Add item"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}




