import { auth, db, storage } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

// ✅ Register User and store in Firestore
export const registerUser = async (email, password, role, extraData = {}) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const baseData = {
    uid: user.uid,
    email,
    role,
    createdAt: new Date().toISOString(),
    credentialStatus: "pending",
    credentialFiles: [],
    ...extraData,
  };

  await setDoc(doc(db, "users", user.uid), baseData);

  if (role === "supplier") {
    await setDoc(doc(db, "suppliers", user.uid), {
      ...baseData,
      companyName: extraData.companyName || "",
      phone: extraData.phone || "",
      address: extraData.address || "",
      addressValidated: false, // Will be validated by extension
      materials: [],
    });
  }

  if (role === "buyer") {
    await setDoc(doc(db, "buyers", user.uid), {
      ...baseData,
      projectType: extraData.projectType || "",
    });
  }

  return user;
};

// ✅ Login
export const loginUser = async (email, password) => {
  const res = await signInWithEmailAndPassword(auth, email, password);
  return res.user;
};

// ✅ Logout
export const logoutUser = async () => {
  await signOut(auth);
};

// ✅ Listen to auth state changes
export const subscribeToAuth = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// ✅ Fetch user data
export const getUserProfile = async (uid) => {
  const docSnap = await getDoc(doc(db, "users", uid));
  return docSnap.exists() ? docSnap.data() : null;
};

export const uploadCredentialFile = async (uid, file, role, onProgress) => {
  if (!file) {
    throw new Error("No file selected");
  }

  const fileId = `${Date.now()}-${file.name}`;
  const storageRef = ref(storage, `credentials/${uid}/${fileId}`);
  const metadata = {
    contentType: file.type,
  };

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (onProgress) {
          const percent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          onProgress(percent);
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const payload = {
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            url: downloadURL,
            uploadedAt: new Date().toISOString(),
          };

          await updateDoc(doc(db, "users", uid), {
            credentialStatus: "under_review",
            credentialFiles: arrayUnion(payload),
          });

          if (role === "supplier" || role === "buyer") {
            const targetCollection = role === "supplier" ? "suppliers" : "buyers";
            try {
              await updateDoc(doc(db, targetCollection, uid), {
                credentialStatus: "under_review",
                credentialFiles: arrayUnion(payload),
              });
            } catch (updateError) {
              console.warn(
                `Could not update ${targetCollection} credential metadata for ${uid}:`,
                updateError
              );
            }
          }

          resolve({
            credentialStatus: "under_review",
            file: payload,
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};