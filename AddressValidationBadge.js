import React, { useEffect, useState } from "react";
import { getAddressValidationStatus } from "../services/addressValidationService";

export default function AddressValidationBadge({ userId, role, address }) {
  const [validationStatus, setValidationStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId && role && address) {
      getAddressValidationStatus(userId, role).then((status) => {
        setValidationStatus(status);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [userId, role, address]);

  if (loading || !validationStatus) {
    return null;
  }

  if (!address) {
    return null;
  }

  if (validationStatus.isValid) {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs">
        <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-emerald-300">Address validated</span>
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs">
      <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span className="text-amber-300">Address validation pending</span>
    </div>
  );
}



