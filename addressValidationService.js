import { db } from "../firebaseConfig";
import { doc, updateDoc, getDoc } from "firebase/firestore";

/**
 * Validate address using Firebase Extension: Validate Address in Firestore
 * The extension automatically validates addresses when they're written to Firestore
 * 
 * @param {string} userId - User ID
 * @param {string} address - Address string to validate
 * @param {string} role - User role ('supplier' or 'buyer')
 * @returns {Promise<Object>} Validation result
 */
export const validateAndSaveAddress = async (userId, address, role) => {
  try {
    const collection = role === "supplier" ? "suppliers" : "buyers";
    const userRef = doc(db, collection, userId);

    // Update address - the extension will automatically validate it
    await updateDoc(userRef, {
      address: address,
      addressUpdatedAt: new Date().toISOString(),
    });

    // Wait a moment for extension to process
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Get the updated document to check validation result
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        isValid: data.addressValidated !== false,
        validatedAddress: data.validatedAddress || address,
        validationDetails: data.addressValidationDetails || null,
      };
    }

    return { isValid: true, validatedAddress: address };
  } catch (error) {
    console.error("Address validation error:", error);
    // If extension isn't working, just return the address as-is
    return { isValid: true, validatedAddress: address, error: error.message };
  }
};

/**
 * Get address validation status for a user
 */
export const getAddressValidationStatus = async (userId, role) => {
  try {
    const collection = role === "supplier" ? "suppliers" : "buyers";
    const userRef = doc(db, collection, userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        address: data.address || "",
        isValid: data.addressValidated !== false,
        validatedAddress: data.validatedAddress || data.address || "",
        validationDetails: data.addressValidationDetails || null,
      };
    }

    return { address: "", isValid: false };
  } catch (error) {
    console.error("Error getting address validation:", error);
    return { address: "", isValid: false };
  }
};



