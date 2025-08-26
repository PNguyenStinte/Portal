import { useState, useEffect } from 'react';
import { signInWithGoogle } from '../firebase';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState(""); // NEW

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) navigate('/dashboard');
  }, [navigate]);

  const handleGoogleLogin = async () => {
    try {
      const user = await signInWithGoogle();
      if (!user) return;

      const idToken = await user.getIdToken();

      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem("token", idToken);
        sessionStorage.setItem("user", JSON.stringify(data.user));
        navigate("/dashboard");
      } else {
        setError(data.message || "Login failed"); // show error in UI instead of alert
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong during login.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ffffff] px-4">
      <div className="text-center space-y-4 w-full max-w-xlg">
      <img
        src={logo}
        alt="Stinte Logo"
        className="w-50 mx-auto mb-10"  // 16rem wide
      />


        <h1 className="text-2xl font-semibold">
          Sign in to STINTE Technician Portal
        </h1>

        {error && (
          <div className="bg-red-100 text-red-800 border border-red-300 px-4 py-2 rounded-md">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          className="mt-4 flex items-center justify-center rounded-md px-20 py-5 text-sm font-medium hover:bg-gray-100 border border-gray-300 bg-white mx-auto"
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
