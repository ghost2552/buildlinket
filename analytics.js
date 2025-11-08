import { analytics } from "./firebaseConfig";
import { logEvent as firebaseLogEvent } from "firebase/analytics";

/**
 * Log an analytics event to Firebase Analytics
 * @param {string} eventName - The name of the event
 * @param {object} eventParams - Optional parameters for the event
 */
export const logEvent = async (eventName, eventParams = {}) => {
  try {
    if (analytics && typeof analytics.then === "function") {
      const analyticsInstance = await analytics;
      if (analyticsInstance) {
        firebaseLogEvent(analyticsInstance, eventName, eventParams);
      }
    } else if (analytics) {
      firebaseLogEvent(analytics, eventName, eventParams);
    }
  } catch (error) {
    // Silently fail in development or if analytics is not available
    if (process.env.NODE_ENV === "development") {
      console.log("Analytics event:", eventName, eventParams);
    }
  }
};

/**
 * Set user properties for analytics
 * @param {object} properties - User properties to set
 */
export const setUserProperties = async (properties) => {
  try {
    if (analytics && typeof analytics.then === "function") {
      const analyticsInstance = await analytics;
      if (analyticsInstance) {
        const { setUserProperties: firebaseSetUserProperties } = await import("firebase/analytics");
        firebaseSetUserProperties(analyticsInstance, properties);
      }
    } else if (analytics) {
      const { setUserProperties: firebaseSetUserProperties } = await import("firebase/analytics");
      firebaseSetUserProperties(analytics, properties);
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.log("Set user properties:", properties);
    }
  }
};

/**
 * Track page view
 * @param {string} pageName - Name of the page
 * @param {string} pageTitle - Title of the page
 */
export const trackPageView = async (pageName, pageTitle) => {
  await logEvent("page_view", {
    page_name: pageName,
    page_title: pageTitle,
  });
};



