import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import logo from '../assets/logo.png'; 
import { signInWithGoogle } from '../firebase';

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear previous sessionStorage token on page load
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('googleAccessToken');
    sessionStorage.removeItem('user');
  }, []);

  const handleGoogleLogin = async () => {
    const user = await signInWithGoogle();
    if (user) {
      const email = (user.email || "").trim().toLowerCase(); // normalize email
      const allowedDomains = ["stinte.co", "upandcs.com"]; // add all allowed domains
      const isAllowed = allowedDomains.some(domain => email.endsWith(`@${domain.toLowerCase()}`));

      console.log("Logging in email:", email, "Allowed:", isAllowed); // for debugging

      if (isAllowed) {
        navigate('/dashboard');
      } else {
        alert("Access restricted to STINTE accounts only.");
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
