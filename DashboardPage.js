import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  logoutUser,
  subscribeToAuth,
  getUserProfile,
  uploadCredentialFile,
} from "../auth";
import AddressValidationBadge from "../components/AddressValidationBadge";
import RFQBuyerPanel from "../components/RFQBuyerPanel";
import RFQSupplierPanel from "../components/RFQSupplierPanel";
import SupplierCatalogPanel from "../components/SupplierCatalogPanel";
import SupplierLogisticsPanel from "../components/SupplierLogisticsPanel";
import BuyerShipmentsPanel from "../components/BuyerShipmentsPanel";
import TwoFactorPanel from "../components/TwoFactorPanel";
import TwoFactorChallenge from "../components/TwoFactorChallenge";
import AdminComplianceConsole from "../components/AdminComplianceConsole";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [banner, setBanner] = useState(null);
  const [credentialStatus, setCredentialStatus] = useState("pending");
  const [credentialFiles, setCredentialFiles] = useState([]);
  const [isUploadingCredential, setIsUploadingCredential] = useState(false);
  const [credentialProgress, setCredentialProgress] = useState(0);
  const [twoFactorVerified, setTwoFactorVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const showBanner = (type, message) => {
    setBanner(type && message ? { type, message } : null);
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        navigate("/login");
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe && unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const hydrateProfile = async () => {
      if (!user) {
        setProfile(null);
        setCredentialStatus("pending");
        setCredentialFiles([]);
        return;
      }

      try {
        const data = await getUserProfile(user.uid);
        setProfile(data);
        setCredentialStatus(data?.credentialStatus || "pending");
        setCredentialFiles(data?.credentialFiles || []);
        if (!data?.twoFactorEnabled) {
          setTwoFactorVerified(true);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        showBanner("error", "Failed to load profile. Please refresh.");
      }
    };

    hydrateProfile();
  }, [user]);

  const refreshProfile = async (uid) => {
    const data = await getUserProfile(uid);
    setProfile(data);
    setCredentialStatus(data?.credentialStatus || "pending");
    setCredentialFiles(data?.credentialFiles || []);
    if (!data?.twoFactorEnabled) {
      setTwoFactorVerified(true);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
    setCredentialStatus("pending");
    setCredentialFiles([]);
    navigate("/login");
    showBanner("info", "You have been signed out.");
  };

  const handleCredentialUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      return;
    }

    setIsUploadingCredential(true);
    setCredentialProgress(0);
    showBanner();

    try {
      const effectiveRole = profile?.role || "supplier";
      const { credentialStatus: updatedStatus, file: uploadedFile } =
        await uploadCredentialFile(
          user.uid,
          file,
          effectiveRole,
          setCredentialProgress
        );

      setCredentialStatus(updatedStatus);
      setCredentialFiles((prev) => [...prev, uploadedFile]);
      showBanner("success", "Document uploaded. We will review it shortly.");
      await refreshProfile(user.uid);
    } catch (error) {
      showBanner(
        "error",
        error.message || "Failed to upload document. Please try again."
      );
    } finally {
      setIsUploadingCredential(false);
      setCredentialProgress(0);
      event.target.value = "";
    }
  };

  const bannerStyles =
    banner?.type === "success"
      ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30"
      : banner?.type === "error"
      ? "bg-rose-500/10 text-rose-200 ring-1 ring-rose-500/30"
      : "bg-slate-500/10 text-slate-200 ring-1 ring-slate-500/30";

  const requireTwoFactorChallenge = Boolean(
    user && profile?.twoFactorEnabled && !twoFactorVerified
  );

  const handleTwoFactorStatusChange = async (enabled) => {
    if (user?.uid) {
      await refreshProfile(user.uid);
    }
    setTwoFactorVerified(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-brand-500 border-r-transparent"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-16 h-72 w-72 rounded-full bg-brand-500/40 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-sky-500/30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.15),_rgba(15,23,42,0.95))]" />
      </div>

      <div className="relative flex min-h-screen flex-col">
        {requireTwoFactorChallenge && (
          <TwoFactorChallenge
            user={user}
            showBanner={showBanner}
            onSuccess={async () => {
              if (user?.uid) {
                await refreshProfile(user.uid);
              }
              setTwoFactorVerified(true);
            }}
          />
        )}

        <header className="flex items-center justify-between px-6 py-6 lg:px-12">
          <div className="relative inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-lg font-semibold text-white shadow-glow">
              BL
            </div>
            <div>
              <p className="text-lg font-semibold text-white">BuildLink Portal</p>
              <p className="text-sm text-slate-300">
                {profile?.role === "buyer" ? "Buyer Dashboard" : profile?.role === "supplier" ? "Supplier Dashboard" : "Admin Dashboard"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-slate-200">
              {user.email}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium text-slate-200 transition hover:border-white/40 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </header>

        {banner?.message && (
          <div className={`mx-auto w-full max-w-6xl px-6 pb-4 lg:px-12`}>
            <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${bannerStyles}`}>
              {banner.message}
            </div>
          </div>
        )}

        <main className="mx-auto w-full max-w-6xl flex-1 flex-col gap-12 px-6 pb-16 pt-4 lg:px-12">
          {user && (
            <section className="mx-auto w-full max-w-4xl pb-16">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-200">
                      Step 2 · Business verification
                    </p>
                    <h3 className="text-xl font-semibold text-white">
                      Upload your credential documents
                    </h3>
                    <p className="text-sm text-slate-300">
                      Provide trade licences, tax clearance, or professional certificates so BuildLink can verify your organisation.
                    </p>
                    {profile?.address && (
                      <div className="mt-2">
                        <AddressValidationBadge 
                          userId={user.uid} 
                          role={profile.role} 
                          address={profile.address}
                        />
                      </div>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                      credentialStatus === "verified"
                        ? "bg-emerald-500/15 text-emerald-200"
                        : credentialStatus === "under_review"
                        ? "bg-amber-500/15 text-amber-200"
                        : "bg-rose-500/15 text-rose-200"
                    }`}
                  >
                    {credentialStatus === "verified"
                      ? "Verified"
                      : credentialStatus === "under_review"
                      ? "Under review"
                      : "Pending"}
                  </span>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-200">
                      Upload documents (PDF, JPG, PNG)
                    </label>
                    <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-white/20 bg-white/5 p-5 text-sm text-slate-300">
                      <p>
                        Drag & drop or
                        <span className="font-semibold text-white"> browse files</span> to attach supporting credentials. Each upload triggers an immediate review.
                      </p>
                      <input
                        type="file"
                        className="cursor-pointer text-sm text-slate-200 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-400"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleCredentialUpload}
                        disabled={isUploadingCredential}
                      />
                      {isUploadingCredential && (
                        <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-brand-400 transition-all"
                            style={{ width: `${credentialProgress}%` }}
                          />
                        </div>
                      )}
                      <p className="text-xs text-slate-400">
                        Files are encrypted at rest in Firebase Storage. Your data remains private and viewable only to the BuildLink compliance team.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm font-medium text-slate-200">Uploaded documents</p>
                    <div className="space-y-3">
                      {credentialFiles.length === 0 && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                          <p>No documents uploaded yet.</p>
                          <p className="text-xs text-slate-400">
                            Upload at least one credential to proceed. We typically review within 1-2 business days.
                          </p>
                        </div>
                      )}

                      {credentialFiles.map((file) => (
                        <a
                          key={file.id}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-brand-400/60 hover:bg-brand-400/10"
                        >
                          <div>
                            <p className="font-medium text-white/90">{file.name}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(file.uploadedAt).toLocaleString()} · {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200 opacity-0 transition group-hover:opacity-100">
                            View
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {user && (
            <TwoFactorPanel
              user={user}
              profile={profile}
              showBanner={showBanner}
              onStatusChange={handleTwoFactorStatusChange}
            />
          )}

          {user && profile?.role === "buyer" && (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Buyer Tools</h3>
                  <p className="text-sm text-slate-300">Manage your procurement and orders</p>
                </div>
                <button
                  onClick={() => navigate("/orders")}
                  className="rounded-lg border border-brand-400/40 bg-brand-500/10 px-4 py-2 text-sm font-semibold text-brand-200 transition hover:border-brand-400 hover:bg-brand-500/20"
                >
                  View Orders →
                </button>
              </div>
              <RFQBuyerPanel
                user={user}
                profile={profile}
                showBanner={showBanner}
                twoFactorEnabled={profile?.twoFactorEnabled}
                twoFactorVerified={twoFactorVerified}
              />
            </>
          )}

          {user && profile?.role === "supplier" && (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Supplier Tools</h3>
                  <p className="text-sm text-slate-300">Manage your business operations</p>
                </div>
                <button
                  onClick={() => navigate("/inventory")}
                  className="rounded-lg border border-brand-400/40 bg-brand-500/10 px-4 py-2 text-sm font-semibold text-brand-200 transition hover:border-brand-400 hover:bg-brand-500/20"
                >
                  Manage Inventory →
                </button>
              </div>
              <RFQSupplierPanel user={user} profile={profile} showBanner={showBanner} />
              <SupplierCatalogPanel user={user} showBanner={showBanner} />
              <SupplierLogisticsPanel
                user={user}
                showBanner={showBanner}
                twoFactorEnabled={profile?.twoFactorEnabled}
                twoFactorVerified={twoFactorVerified}
              />
            </>
          )}

          {user && profile?.role === "buyer" && <BuyerShipmentsPanel user={user} />}

          {user && profile?.role === "admin" && (
            <AdminComplianceConsole user={user} showBanner={showBanner} />
          )}
        </main>

        <footer className="px-6 pb-8 text-xs text-slate-500/70 lg:px-12">
          <p>© {new Date().getFullYear()} BuildLink Networks. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

