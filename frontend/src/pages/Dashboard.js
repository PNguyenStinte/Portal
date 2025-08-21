// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.png";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getAuth, signOut as firebaseSignOut } from "firebase/auth";

function Dashboard() {
  const [news, setNews] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [costcoOpen, setCostcoOpen] = useState(false);
  const [stinteOpen, setStinteOpen] = useState(false);
  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [warehouseOpen, setWarehouseOpen] = useState(false);

  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    axios
      .get("https://stinteportal-backend.onrender.com/Dashboard")
      .then((res) => setNews(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      sessionStorage.clear();
      localStorage.clear();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div
          className="flex items-center justify-center p-4 border-b cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <img src={logo} alt="Logo" className="h-12" />

        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div>
            <button
              onClick={() => setCostcoOpen(!costcoOpen)}
              className="w-full flex justify-between items-center px-4 py-2 rounded hover:bg-gray-200 font-bold text-xl"
            >
              COSTCO
              {costcoOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {costcoOpen && (
              <div className="pl-6 space-y-1 mt-1">
                <button
                  className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 font-medium text-lg"
                  onClick={() =>
                    window.open(
                      "https://identity.myisolved.com/Account/Login?ReturnUrl=%2F",
                      "_blank"
                    )
                  }
                >
                  Costco Sites
                </button>
                <button
                  className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 font-medium text-lg"
                  onClick={() =>
                    window.open(
                      "https://identity.myisolved.com/Account/Login?ReturnUrl=%2F",
                      "_blank"
                    )
                  }
                >
                  Costco Tech Notes
                </button>
              </div>
            )}
          </div>
          <button
            className="w-full text-left px-4 py-2 rounded hover:bg-gray-200 font-bold text-xl"
            onClick={() => window.open("https://leads.buildops.com/login", "_blank")}
          >
            BUILDOPS
          </button>
          <button
            className="w-full text-left px-4 py-2 rounded hover:bg-gray-200 font-bold text-xl"
            onClick={() => window.open("https://mail.google.com", "_blank")}
          >
            GOOGLE EMAIL
          </button>
          <button
            className="w-full text-left px-4 py-2 rounded hover:bg-gray-200 font-bold text-xl"
            onClick={() => window.open("https://chat.google.com", "_blank")}
          >
            GOOGLE CHAT
          </button>
          <div>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex justify-between items-center px-4 py-2 rounded hover:bg-gray-200 font-bold text-xl"
            >
              PROFILE
              {profileOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {profileOpen && (
              <div className="pl-6 space-y-1 mt-1">
                <div>
                  <button
                    className="w-full flex justify-between items-center px-2 py-1 rounded hover:bg-gray-100 font-medium text-lg"
                    onClick={() => setInsuranceOpen(!insuranceOpen)}
                  >
                    Insurance
                    {insuranceOpen ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                  {insuranceOpen && (
                    <div className="pl-4 mt-1 space-y-1">
                      <button
                        className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100"
                        onClick={() => navigate("/insurance/dental")}
                      >
                        Dental Insurance
                      </button>
                      <button
                        className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100"
                        onClick={() => navigate("/insurance/health")}
                      >
                        Health Insurance
                      </button>
                      <button
                        className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100"
                        onClick={() => navigate("/insurance/vision")}
                      >
                        Vision Insurance
                      </button>
                    </div>
                  )}
                </div>
                <button
                  className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 font-medium text-lg"
                  onClick={() =>
                    window.open(
                      "https://identity.myisolved.com/Account/Login?ReturnUrl=%2F",
                      "_blank"
                    )
                  }
                >
                  Pay Roll
                </button>
                <button
                  className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 font-medium text-lg"
                  onClick={() => navigate("/performance")}
                >
                  Performance Reviews / Skill Assessments
                </button>
                <button
                  className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 font-medium text-lg"
                  onClick={() => navigate("/timesheet")}
                >
                  Time Sheet
                </button>
                <button
                  className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 font-medium text-lg"
                  onClick={() => navigate("/training")}
                >
                  Training Course
                </button>
              </div>
            )}
          </div>
          <button
                  className="w-full flex justify-between items-center px-4 py-2 rounded hover:bg-gray-200 font-bold text-xl"
                  onClick={() => navigate("/schedule")}
                >
                  SCHEDULE
          </button>
          <div>
            <button
              onClick={() => setStinteOpen(!stinteOpen)}
              className="w-full flex justify-between items-center px-4 py-2 rounded hover:bg-gray-200 font-bold text-xl"
            >
              STINTE
              {stinteOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {stinteOpen && (
              <div className="pl-6 space-y-1 mt-1">
                <button
                  className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 font-medium text-lg"
                  onClick={() => navigate("/contact_info")}
                >
                  Ask IT
                </button>
                <button
                  className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 font-medium text-lg"
                  onClick={() => navigate("/contact_info")}
                >
                  Contact Information
                </button>
                <button
                  className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 font-medium text-lg"
                  onClick={() => window.open("/Daily Safety Meeting Checklist.pdf", "_blank")}
                >
                  Daily Safety Checklist
                </button>

                <button
                  className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 font-medium text-lg"
                  onClick={() => window.open("/employee-handbook.pdf", "_blank")}
                >
                  Employee Handbook
                </button>
                <button
                  className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 font-medium text-lg"
                  onClick={() =>
                    window.open(
                      "https://identity.myisolved.com/Account/Login?ReturnUrl=%2F",
                      "_blank"
                    )
                  }
                >
                  HR
                </button>
                <button
                  className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 font-medium text-lg"
                  onClick={() => navigate("/stinte/material_information")}
                >
                  Material Information
                </button>
                <button
                  className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 font-medium text-lg"
                  onClick={() =>
                    window.open(
                      "https://docs.google.com/forms/d/e/1FAIpQLSe8a8mo66k8k-ZhcUShwpB-_25onm1XclrsyqkrAUtFbSebRQ/viewform",
                      "_blank"
                    )
                  }
                >
                  Time Off Requests
                </button>
              </div>
            )}
          </div>
          {/* WAREHOUSE */}
          <div>
            <button
              onClick={() => setWarehouseOpen(!warehouseOpen)}
              className="w-full flex justify-between items-center px-4 py-2 rounded hover:bg-gray-200 font-bold text-xl"
            >
              WAREHOUSE
              {warehouseOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${warehouseOpen ? "max-h-40" : "max-h-0"
                }`}
            >
              <div className="pl-6 space-y-1 mt-1">
                <button
                  className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 font-medium text-lg"
                  onClick={() => navigate("/warehouse/material")}
                >
                  Material
                </button>
                <button
                  className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 font-medium text-lg"
                  onClick={() => navigate("/warehouse/request")}
                >
                  Request
                </button>
              </div>
            </div>
          </div>

        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Company News Board</h2>
          <div className="flex gap-2 items-center">
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {news.map((item) => (
            <article key={item.id} className="bg-white p-4 rounded shadow">
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-gray-600 text-sm">
                By {item.author} on {item.date}
              </p>
              <p className="mt-2">{item.content}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
