import { db } from "../firebaseConfig.js";
import { collection, addDoc, getDocs } from "firebase/firestore";

// Create RFQ
export const createRFQ = async (buyerId, details) => {
  await addDoc(collection(db, "rfqs"), {
    buyerId,
    ...details,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
};

// List all RFQs
export const getRFQs = async (buyerId) => {
  const snapshot = await getDocs(collection(db, "rfqs"));
  return snapshot.docs.map((d) => d.data()).filter((r) => r.buyerId === buyerId);
};