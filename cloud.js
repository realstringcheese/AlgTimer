// === cloud.js — Google Sign-In & Auto-Sync via Firebase ===
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
  return FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.startsWith("PASTE_");
}

export async function initCloud(onAuthChange) {
  if (!isCloudConfigured()) {
    onAuthChange(null, { configured: false });
    return;
  }
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
        const cloudData = await pullFromCloud(user.uid);
        onAuthChange(user, { configured: true, cloudData });
      } else {
        onAuthChange(null, { configured: true });
      }
    });
  } catch (err) {
    console.warn("Firebase failed to load:", err);
    onAuthChange(null, { configured: false });
  }
}

export async function signInGoogle() {
  if (!auth || !authMod) return { error: "Cloud auth not ready yet—refresh and try again." };
  const provider = new authMod.GoogleAuthProvider();
  await authMod.signInWithPopup(auth, provider);
  return { ok: true };
}

export async function signOutGoogle() {
  if (auth && authMod) await authMod.signOut(auth);
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
      console.warn("Cloud sync error:", err);
    }
  }, 1500);
}