import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

const catalogCollection = collection(db, "supplierCatalog");

export const subscribeToSupplierCatalog = (supplierId, callback) => {
  const q = query(
    catalogCollection,
    where("supplierId", "==", supplierId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    callback(items);
  });
};

export const subscribeToCatalogIndex = (callback) => {
  const q = query(catalogCollection, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    callback(items);
  });
};

export const createCatalogItem = async (supplierId, payload) => {
  const data = {
    ...payload,
    supplierId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    archived: false,
  };

  const docRef = await addDoc(catalogCollection, data);
  return docRef.id;
};

export const updateCatalogItem = async (itemId, payload) => {
  await updateDoc(doc(db, "supplierCatalog", itemId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
};

export const archiveCatalogItem = async (itemId) => {
  await updateDoc(doc(db, "supplierCatalog", itemId), {
    archived: true,
    updatedAt: serverTimestamp(),
  });
};

export const deleteCatalogItem = async (itemId) => {
  await deleteDoc(doc(db, "supplierCatalog", itemId));
};




