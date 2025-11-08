import React, { useState, useMemo } from "react";
import { validateFirebaseConfig, getFirebaseSetupInstructions } from "../utils/firebaseSetup";

export default function FirebaseSetupGuide() {
  const [expandedStep, setExpandedStep] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const config = useMemo(() => validateFirebaseConfig(), []);
  const instructions = useMemo(() => getFirebaseSetupInstructions(), []);

  if (config.isValid || isDismissed) {
    return null; // Don't show if config is valid or dismissed
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 mx-auto w-full max-w-4xl px-4">
      <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-8 backdrop-blur-sm shadow-2xl">
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
          aria-label="Dismiss"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
            <svg
              className="h-6 w-6 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Firebase Setup Required</h3>
            <p className="text-sm text-slate-300">
              Configure your Firebase project to enable all features
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {Object.entries(instructions).map(([key, step], index) => {
          const stepNum = index + 1;
          const isExpanded = expandedStep === stepNum;

          return (
            <div
              key={key}
              className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedStep(isExpanded ? null : stepNum)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/20 text-sm font-semibold text-brand-200">
                    {stepNum}
                  </div>
                  <span className="font-medium text-white">{step.title}</span>
                </div>
                <svg
                  className={`h-5 w-5 text-slate-400 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isExpanded && (
                <div className="border-t border-white/10 bg-slate-900/50 p-4">
                  <ol className="space-y-2 text-sm text-slate-300">
                    {step.instructions.map((instruction, idx) => (
                      <li key={idx} className="flex gap-3">
                        {instruction.trim() === "" ? (
                          <span className="block h-2" />
                        ) : (
                          <>
                            <span className="text-brand-400 font-semibold min-w-[20px]">
                              {idx + 1}.
                            </span>
                            <span className="flex-1">{instruction}</span>
                          </>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-slate-300">
          <strong className="text-white">Quick Link:</strong>{" "}
          <a
            href="https://console.firebase.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-400 hover:text-brand-300 underline"
          >
            Open Firebase Console
          </a>
        </p>
        <p className="mt-2 text-xs text-slate-400">
          After completing the setup, restart your development server for changes to take effect.
        </p>
      </div>
      </div>
    </div>
  );
}

