import { signInWithGoogle } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import logo from '../assets/logo.png';

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      // Token exists, redirect immediately
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleGoogleLogin = async () => {
    const user = await signInWithGoogle();

    if (user) {
      const email = user.email || "";
      const allowedDomains = ["stinte.co", "upandcs.com"];

      if (allowedDomains.some(domain => email.endsWith(`@${domain}`))) {
        const token = await user.getIdToken();
        sessionStorage.setItem("token", token); // Persist token
        navigate('/dashboard');
      } else {
        alert("Access restricted to STINTE accounts only.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ffffff] px-4">
      <div className="text-center space-y-6">
        <img
          src={logo}
          alt="Stinte Logo"
          className="w-40 mx-auto mb-10"
        />
        <h1 className="text-2xl font-semibold">
          Sign in to STINTE Technician Portal
        </h1>
        <button
          onClick={handleGoogleLogin}
          className="mt-4 w-full max-w-sm mx-auto flex items-center justify-center border border-gray-300 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-100 bg-white"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-6 h-6 mr-2"
          />
          Continue with Google
        </button>
      </div>
    </div>
  );
}

export default Login;
