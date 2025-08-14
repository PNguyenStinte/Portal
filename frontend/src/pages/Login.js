import { signInWithGoogle } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { getAuth, signOut as firebaseSignOut } from "firebase/auth";
import logo from '../assets/logo.png'; 

function Login() {
  const navigate = useNavigate();
  const auth = getAuth();

  // Check if already logged in with valid token
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    } else {
      // Optional: sign out any lingering disallowed user
      firebaseSignOut(auth);
      sessionStorage.removeItem("token");
    }
  }, [navigate, auth]);

  const handleGoogleLogin = async () => {
    try {
      const user = await signInWithGoogle();

      if (user) {
        const email = user.email || "";
        const allowedDomains = ["stinte.co", "upandcs.com"];

        // Check if email ends with any allowed domain
        const isAllowed = allowedDomains.some(domain => email.endsWith(`@${domain}`));

        if (isAllowed) {
          const token = await user.getIdToken();
          sessionStorage.setItem("token", token);
          navigate('/dashboard');
        } else {
          alert("Access restricted to STINTE accounts only.");
          await firebaseSignOut(auth);
          sessionStorage.removeItem("token");
        }
      }
    } catch (error) {
      console.error("Google login failed:", error);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ffffff] px-4">
      <div className="text-center space-y-2">
        <img
          src={logo}
          alt="Stinte Logo"
          className="50 mx-auto mb-10"
        />
        <h1 className="text-2xl font-semibold">Sign in to STINTE Technician Portal</h1>
        <button
          onClick={handleGoogleLogin}
          className="mt- w-full max-w-sm mx-auto flex items-center justify-center border border-gray-300 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-100 bg-white"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-10 h-10 mr-2"
          />
          Continue with Google
        </button>
      </div>
    </div>
  );
}

export default Login;
