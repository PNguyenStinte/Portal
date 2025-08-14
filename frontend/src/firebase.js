import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCvSK-IUHXso5s6qgnQXZTr17qS0NiLVHc",
  authDomain: "STINTE PORTAL",
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

const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Get the Firebase ID token (for your backend, if needed)
    const idToken = await user.getIdToken();

    // Get the Google OAuth access token (for calling Google Calendar API)
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential.accessToken;

    // Store both tokens
    localStorage.setItem('token', idToken);
    localStorage.setItem('googleAccessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));

    return user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    return null;
  }
};

export { auth, signInWithGoogle, provider };
