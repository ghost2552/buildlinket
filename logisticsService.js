import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

const shipmentCollection = collection(db, "shipments");

export const upsertLogisticsProfile = async (supplierId, payload) => {
  const ref = doc(db, "logisticsProfiles", supplierId);
  await setDoc(ref, {
    supplierId,
    ...payload,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const getLogisticsProfile = async (supplierId) => {
  const ref = doc(db, "logisticsProfiles", supplierId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};

export const subscribeToLogisticsProfile = (supplierId, callback) => {
  const ref = doc(db, "logisticsProfiles", supplierId);
  return onSnapshot(ref, (snapshot) => {
    callback(snapshot.exists() ? snapshot.data() : null);
  });
};

export const createShipment = async (payload) => {
  const ref = doc(shipmentCollection);
  const status = payload.status || "scheduled";
  await setDoc(ref, {
    ...payload,
    shipmentId: ref.id,
    status,
    history: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(ref, {
    history: arrayUnion({
      status,
      note: "Shipment scheduled",
      timestamp: serverTimestamp(),
    }),
  });
  return ref.id;
};

export const updateShipmentStatus = async (shipmentId, status, note = "") => {
  const ref = doc(db, "shipments", shipmentId);
  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp(),
    history: arrayUnion({
      status,
      note,
      timestamp: serverTimestamp(),
    }),
  });
};

export const appendShipmentHistory = async (shipmentId, entry) => {
  const ref = doc(db, "shipments", shipmentId);
  await updateDoc(ref, {
    history: arrayUnion({
      ...entry,
      timestamp: serverTimestamp(),
    }),
  });
};

export const subscribeToSupplierShipments = (supplierId, callback) => {
  const q = query(
    shipmentCollection,
    where("supplierId", "==", supplierId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const shipments = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    callback(shipments);
  });
};

export const subscribeToBuyerShipments = (buyerId, callback) => {
  const q = query(
    shipmentCollection,
    where("buyerId", "==", buyerId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const shipments = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    callback(shipments);
  });
};

export const subscribeToRfqShipments = (rfqId, callback) => {
  const q = query(
    shipmentCollection,
    where("rfqId", "==", rfqId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const shipments = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    callback(shipments);
  });
};

