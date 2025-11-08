import { authenticator } from "@otplib/preset-default";
import QRCode from "qrcode";
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

export const generateTwoFactorEnrollment = async (uid, email) => {
  const secret = authenticator.generateSecret();
  const otpAuthUrl = authenticator.keyuri(email, "BuildLink", secret);
  const qr = await QRCode.toDataURL(otpAuthUrl);

  await updateDoc(doc(db, "users", uid), {
    twoFactor: {
      secret,
      otpAuthUrl,
      enabled: false,
      createdAt: serverTimestamp(),
    },
  });

  return { secret, otpAuthUrl, qr };
};

export const verifyTwoFactorCode = async (uid, token) => {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    throw new Error("User not found");
  }

  const data = snap.data();
  const secret = data?.twoFactor?.secret;
  if (!secret) {
    throw new Error("Two-factor authentication is not enabled.");
  }

  const isValid = authenticator.verify({ token, secret });
  if (!isValid) {
    throw new Error("Invalid verification code.");
  }

  await updateDoc(userRef, {
    twoFactorEnabled: true,
    twoFactorEnrolledAt: serverTimestamp(),
    "twoFactor.enabled": true,
  });

  return true;
};

export const disableTwoFactor = async (uid) => {
  await updateDoc(doc(db, "users", uid), {
    twoFactorEnabled: false,
    twoFactorDisabledAt: serverTimestamp(),
    twoFactor: {},
  });
};

