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
  try {
    const user = await signInWithGoogle();
    if (!user) {
      console.error("No user returned from Firebase.");
      return;
    }

    // Normalize email: trim spaces and convert to lowercase
    const email = (user.email || "").trim().toLowerCase();
    console.log("Email from Firebase:", email);

    // List of allowed domains
    const allowedDomains = ["stinte.co", "upandcs.com", "usandcs.com"];
    console.log("Allowed domains:", allowedDomains);

    // Check if email ends with any allowed domain
    const isAllowed = allowedDomains.some(domain =>
      email.endsWith(`@${domain.toLowerCase()}`)
    );

    console.log("Is email allowed?", isAllowed);

    if (isAllowed) {
      // Optional: save to sessionStorage
      sessionStorage.setItem("user", JSON.stringify({ email }));
      navigate('/dashboard');
    } else {
      alert(`Access restricted to STINTE accounts only. Your email: ${email}`);
    }
  } catch (error) {
    console.error("Google login error:", error);
    alert("An error occurred during login.");
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
