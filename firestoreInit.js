import { db } from "../firebaseConfig.js";
import { setDoc, doc } from "firebase/firestore";

export const seedFirestore = async () => {
  await setDoc(doc(db, "system", "collections"), {
    users: true,
    suppliers: true,
    buyers: true,
    materials: true,
    rfqs: true,
  });
  console.log("✅ Firestore structure initialized");
};
