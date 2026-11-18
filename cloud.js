// === cloud.js — Google Sign-In & Auto-Sync ===
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDT1XQir4xIzJfiZFvf-EYH9GH52g6cswE",
  authDomain: "algtimer.firebaseapp.com",
  projectId: "algtimer",
  storageBucket: "algtimer.firebasestorage.app",
  messagingSenderId: "615880870296",
  appId: "1:615880870296:web:c62dc51f535542d00143ed",
};

let auth = null;
let db = null;
let authMod = null;
let fsMod = null;
let currentUser = null;
let syncTimer = null;

export function isCloudConfigured() {
  return Boolean(FIREBASE_CONFIG.apiKey);
}

export async function initCloud(onAuthChange) {
  try {
    const appMod = await import("https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js");
    authMod = await import("https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js");
    fsMod = await import("https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js");

    const fbApp = appMod.initializeApp(FIREBASE_CONFIG);
    auth = authMod.getAuth(fbApp);
    db = fsMod.getFirestore(fbApp);

    authMod.onAuthStateChanged(auth, async (user) => {
      currentUser = user;
      if (user) {
        // Run callback immediately so the UI updates without waiting on Firestore
        onAuthChange(user, { configured: true });

        // Pull cloud data in background with a timeout
        try {
          const cloudData = await Promise.race([
            pullFromCloud(user.uid),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000)),
          ]);
          if (cloudData) {
            onAuthChange(user, { configured: true, cloudData });
          }
        } catch (e) {
          console.warn("Cloud pull skipped or offline:", e);
        }
      } else {
        onAuthChange(null, { configured: true });
      }
    });
  } catch (err) {
    console.error("Firebase init error:", err);
    onAuthChange(null, { configured: false });
  }
}

export async function signInGoogle() {
  if (!auth || !authMod) {
    return { error: "Auth is still loading. Refresh and try again." };
  }
  const provider = new authMod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    await authMod.signInWithPopup(auth, provider);
    return { ok: true };
  } catch (err) {
    console.warn("Google sign-in error:", err);
    return { error: err.code || err.message || "Sign-in failed." };
  }
}

export async function signOutGoogle() {
  if (auth && authMod) {
    await authMod.signOut(auth);
  }
}

export async function pullFromCloud(uid) {
  if (!db || !fsMod) return null;
  const snap = await fsMod.getDoc(fsMod.doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export function scheduleCloudPush(getPayloadFn) {
  if (!currentUser || !db || !fsMod) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      const payload = getPayloadFn();
      await fsMod.setDoc(fsMod.doc(db, "users", currentUser.uid), {
        ...payload,
        updatedAt: Date.now(),
      }, { merge: true });
    } catch (err) {
      console.warn("Cloud sync save error:", err);
    }
  }, 1200);
}