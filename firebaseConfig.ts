
// FIREBASE IS DISABLED.
// We are now using Google Sheets via Google Apps Script as the backend.
// This file is kept as a placeholder to prevent import errors during the transition,
// but the functions do nothing.

export const db = {} as any;
export const auth = {} as any;

export const initAuth = async () => {
  console.log("Firebase Auth disabled. Using Google Sheets.");
};
