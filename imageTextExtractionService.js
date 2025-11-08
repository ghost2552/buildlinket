import { storage } from "../firebaseConfig";
import { ref, getDownloadURL } from "firebase/storage";

/**
 * Extract text from images using Firebase Extension: Extract Image Text with Cloud Vision AI
 * The extension automatically extracts text when images are uploaded to Storage
 * 
 * @param {string} filePath - Storage path to the image file
 * @returns {Promise<Object>} Extracted text and metadata
 */
export const getExtractedText = async (filePath) => {
  try {
    // The extension stores extracted text in Storage metadata
    // We need to check the file's custom metadata
    const storageRef = ref(storage, filePath);
    
    // Get download URL first
    const downloadURL = await getDownloadURL(storageRef);
    
    // The extension typically stores results in a Firestore collection
    // Check for extracted text in the file's metadata or a related document
    // This depends on how the extension is configured
    
    // For now, return a structure that can be enhanced
    return {
      hasText: false,
      extractedText: null,
      confidence: null,
      fileUrl: downloadURL,
    };
  } catch (error) {
    console.error("Error getting extracted text:", error);
    return {
      hasText: false,
      extractedText: null,
      error: error.message,
    };
  }
};

/**
 * Check if text extraction is available for a credential file
 * The extension processes files in the credentials/ folder
 */
export const checkCredentialTextExtraction = async (userId, fileName) => {
  const filePath = `credentials/${userId}/${fileName}`;
  return await getExtractedText(filePath);
};



