import {
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

const reviewCollection = collection(db, "complianceReviews");

export const subscribeToPendingCredentials = (callback) => {
  const q = query(
    collection(db, "users"),
    where("credentialStatus", "in", ["pending", "under_review"]),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    callback(users);
  });
};

export const logComplianceReview = async (payload) => {
  await setDoc(doc(reviewCollection), {
    ...payload,
    createdAt: serverTimestamp(),
  });
};

export const updateCredentialStatus = async (uid, newStatus, reviewerId, note = "") => {
  const userRef = doc(db, "users", uid);

  await updateDoc(userRef, {
    credentialStatus: newStatus,
    credentialReviewedAt: serverTimestamp(),
    credentialReviewerId: reviewerId,
  });

  // Mirror to role-specific document if available
  const userSnapshot = await getDoc(userRef);

  if (userSnapshot.exists()) {
    const data = userSnapshot.data();
    const role = data?.role;
    if (role === "supplier" || role === "buyer") {
      try {
        await updateDoc(doc(db, `${role}s`, uid), {
          credentialStatus: newStatus,
          credentialReviewedAt: serverTimestamp(),
          credentialReviewerId: reviewerId,
        });
      } catch (error) {
        console.warn(`Unable to mirror credential status to ${role}s collection`, error);
      }
    }
  }

  await logComplianceReview({
    userId: uid,
    reviewerId,
    newStatus,
    note,
  });
};

