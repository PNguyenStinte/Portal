import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCvSK-IUHXso5s6qgnQXZTr17qS0NiLVHc",
  authDomain: "portal-7d1e9.firebaseapp.com",
  projectId: "portal-7d1e9",
  storageBucket: "portal-7d1e9.firebasestorage.app",
  messagingSenderId: "476178266373",
  appId: "1:476178266373:web:dc6776df518b53aeea1f6c",
  measurementId: "G-1ZCEL3KRK6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Request Google Calendar read-only scope
provider.addScope("https://www.googleapis.com/auth/calendar.readonly");

// Force Google account chooser every time
provider.setCustomParameters({
  prompt: "select_account"
});

const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Get Firebase ID token for backend
    const idToken = await user.getIdToken();

    // Get Google OAuth access token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential.accessToken;

    // STORE IN sessionStorage (clears on browser close)
    sessionStorage.setItem('token', idToken);
    sessionStorage.setItem('googleAccessToken', accessToken);
    sessionStorage.setItem('user', JSON.stringify(user));

    return user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    return null;
  }
};

export { auth, signInWithGoogle, provider };
