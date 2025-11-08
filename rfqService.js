import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

const rfqCollection = collection(db, "rfqs");
const bidCollection = collection(db, "bids");

export const createRFQ = async (buyerId, payload) => {
  const data = {
    ...payload,
    buyerId,
    status: "open",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    awardedBidId: null,
  };

  const docRef = await addDoc(rfqCollection, data);
  return docRef.id;
};

export const subscribeToBuyerRFQs = (buyerId, callback) => {
  const q = query(rfqCollection, where("buyerId", "==", buyerId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const rfqs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(rfqs);
  });
};

export const subscribeToOpenRFQs = (callback) => {
  const q = query(rfqCollection, where("status", "==", "open"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const rfqs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(rfqs);
  });
};

export const subscribeToRFQBids = (rfqId, callback) => {
  const q = query(bidCollection, where("rfqId", "==", rfqId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const bids = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(bids);
  });
};

export const subscribeToSupplierBids = (supplierId, callback) => {
  const q = query(bidCollection, where("supplierId", "==", supplierId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const bids = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(bids);
  });
};

export const submitBid = async (rfqId, supplierId, payload) => {
  const bidId = `${rfqId}_${supplierId}`;
  const bidRef = doc(db, "bids", bidId);
  const data = {
    ...payload,
    rfqId,
    supplierId,
    status: "submitted",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(bidRef, data, { merge: true });
  await updateDoc(doc(db, "rfqs", rfqId), {
    updatedAt: serverTimestamp(),
    lastBidAt: serverTimestamp(),
  });

  return bidId;
};

export const withdrawBid = async (rfqId, supplierId, note = "Withdrawn by supplier") => {
  const bidId = `${rfqId}_${supplierId}`;
  const bidRef = doc(db, "bids", bidId);
  await updateDoc(bidRef, {
    status: "withdrawn",
    withdrawalNote: note,
    updatedAt: serverTimestamp(),
  });
};

export const awardBid = async (rfqId, bidId) => {
  const rfqRef = doc(db, "rfqs", rfqId);
  const bidRef = doc(db, "bids", bidId);

  await updateDoc(rfqRef, {
    status: "awarded",
    awardedBidId: bidId,
    updatedAt: serverTimestamp(),
  });

  await updateDoc(bidRef, {
    status: "awarded",
    updatedAt: serverTimestamp(),
  });

  const q = query(bidCollection, where("rfqId", "==", rfqId));
  const snapshot = await getDocs(q);
  const promises = snapshot.docs
    .filter((docSnap) => docSnap.id !== bidId)
    .map((docSnap) =>
      updateDoc(doc(db, "bids", docSnap.id), {
        status: docSnap.data().status === "withdrawn" ? "withdrawn" : "declined",
        updatedAt: serverTimestamp(),
      })
    );

  await Promise.all(promises);
};

export const closeRFQ = async (rfqId) => {
  await updateDoc(doc(db, "rfqs", rfqId), {
    status: "closed",
    updatedAt: serverTimestamp(),
  });
};

export const appendRFQActivity = async (rfqId, entry) => {
  await updateDoc(doc(db, "rfqs", rfqId), {
    activity: arrayUnion({
      ...entry,
      timestamp: serverTimestamp(),
    }),
  });
};

