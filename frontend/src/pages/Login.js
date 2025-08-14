import { signInWithGoogle } from '../firebase';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import logo from '../assets/logo.png'; 

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();

    // Sign out any existing user on page load
    signOut(auth).catch(() => {});

    // Remove any leftover token
    sessionStorage.removeItem('token');
  }, []);

  const handleGoogleLogin = async () => {
    const user = await signInWithGoogle();

    if (user) {
      const email = user.email || ""; // Ensure we have the email
      const allowedDomains = ["stinte.co", "upandcs.com"];

      if (allowedDomains.some(domain => email.endsWith(`@${domain}`))) {
        const token = await user.getIdToken();
        sessionStorage.setItem("token", token);  
        navigate('/dashboard');
      } else {
        alert("Access restricted to STINTE accounts only.");
        const auth = getAuth();
        signOut(auth); // Sign out unauthorized user immediately
      }
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
