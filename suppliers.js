import { db } from "../firebaseConfig.js";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";

// Add material
export const addMaterial = async (supplierId, data) => {
  await addDoc(collection(db, "materials"), {
    supplierId,
    ...data,
    createdAt: new Date().toISOString(),
  });
};

// Get all materials
export const getMaterials = async (supplierId) => {
  const snapshot = await getDocs(collection(db, "materials"));
  return snapshot.docs.map((d) => d.data()).filter((m) => m.supplierId === supplierId);
};

// Update material
export const updateMaterial = async (id, data) => {
  await updateDoc(doc(db, "materials", id), data);
};

// Delete material
export const deleteMaterial = async (id) => {
  await deleteDoc(doc(db, "materials", id));
};