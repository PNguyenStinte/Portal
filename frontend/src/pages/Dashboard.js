// src/pages/Dashboard.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.png";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getAuth, signOut as firebaseSignOut } from "firebase/auth";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

function Dashboard() {
  const [events, setEvents] = useState([]);
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(sessionStorage.getItem("user")) || null
  );

  const [profileOpen, setProfileOpen] = useState(false);
  const [costcoOpen, setCostcoOpen] = useState(false);
  const [stinteOpen, setStinteOpen] = useState(false);
  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [warehouseOpen, setWarehouseOpen] = useState(false);
  const [calendarHeight, setCalendarHeight] = useState(600);

  const navigate = useNavigate();
  const auth = getAuth();

  const BASE_URL =
    process.env.NODE_ENV === "development"
      ? "http://127.0.0.1:5000"
      : "https://stinteportal-backend.onrender.com";

  const UPLOAD_URL = `${BASE_URL}/api/events/upload/`;
  const CURRENT_USER_URL = `${BASE_URL}/api/me/`;
  const EVENTS_URL = `${BASE_URL}/api/events/`;

  // Fetch current user
  const fetchCurrentUser = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken(true);
      const res = await axios.get(CURRENT_USER_URL, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setCurrentUser(res.data);
      sessionStorage.setItem("user", JSON.stringify(res.data));
    } catch (err) {
      console.error("Error fetching current user:", err.response?.data || err.message);
    }
  }, [auth, CURRENT_USER_URL]);

  // Fetch events from database
  const fetchEvents = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken(true);
      const res = await axios.get(EVENTS_URL, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setEvents(res.data);
    } catch (err) {
      console.error("Error fetching events:", err.response?.data || err.message);
    }
  }, [auth, EVENTS_URL]);

  // Initial load
  useEffect(() => {
    if (auth.currentUser) {
      fetchCurrentUser();
      fetchEvents();
    }
  }, [auth.currentUser, fetchCurrentUser, fetchEvents]);

  // Refresh events every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (auth.currentUser) fetchEvents();
    }, 120000);
    return () => clearInterval(interval);
  }, [auth.currentUser, fetchEvents]);

  // Dynamic calendar height
  useEffect(() => {
    const handleResize = () => setCalendarHeight(window.innerHeight - 400);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // File upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(UPLOAD_URL, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      // ✅ Show success with number of inserted events
      if (res.data.message) {
        alert(res.data.message); // e.g., "✅ 100 events uploaded successfully, 5 rows skipped."
        fetchEvents(); // refresh calendar immediately
      } else {
        alert("⚠️ Upload completed, but no details returned.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert(`⚠️ Upload failed: ${err.response?.data?.error || err.message}`);
    } finally {
      e.target.value = ""; // allow re-upload of same file
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      sessionStorage.clear();
      localStorage.clear();
      navigate("/");
    } catch (err) {
      console.error("Sign out error:", err);
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

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {/* BUILDOPS */}
          <button
            className="w-full text-left px-4 py-2 rounded hover:bg-gray-200 font-bold text-xl"
            onClick={() =>
              window.open("https://leads.buildops.com/login", "_blank")
            }
          >
            BUILDOPS
          </button>

          {/* CALENDAR */}
          <button
            className="w-full text-left px-4 py-2 rounded hover:bg-gray-200 font-bold text-xl"
            onClick={() => navigate("/calendar")}
          >
            CALENDAR
          </button>

          {/* COSTCO */}
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

          {/* GOOGLE */}
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

          {/* PROFILE */}
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
                {/* INSURANCE */}
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

          {/* STINTE */}
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
                  onClick={() =>
                    window.open("/Daily Safety Meeting Checklist.pdf", "_blank")
                  }
                >
                  Daily Safety Checklist
                </button>
                <button
                  className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 font-medium text-lg"
                  onClick={() =>
                    window.open("/employee-handbook.pdf", "_blank")
                  }
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
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                warehouseOpen ? "max-h-40" : "max-h-0"
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
        {/* News Board */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Company News Board</h2>
        </div>
        {/* Calendar */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-2xl font-semibold mb-4">Event Calendar</h2>

          {currentUser?.role === "Scheduler" && (
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileUpload}
              className="mb-4"
            />
          )}

          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            height={calendarHeight}
            eventContent={(eventInfo) => {
              const { title, extendedProps } = eventInfo.event;
              return (
                <div className="text-sm">
                  <b>{title}</b>
                  <div>Property: {extendedProps.property || "-"}</div>
                  <div>Status: {extendedProps.status || "-"}</div>
                  <div>Technician: {extendedProps.technician_name || "-"}</div>
                  <div>Dept: {extendedProps.department_name || "-"}</div>
                  <div>Job #: {extendedProps.job_number || "-"}</div>
                  <div>Visit #: {extendedProps.visit_number || "-"}</div>
                </div>
              );
            }}
          />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
