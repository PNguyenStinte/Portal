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
  const [travel, setTravel] = useState([]);
  const [work, setWork] = useState([]);
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(sessionStorage.getItem("user")) || null
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const [costcoOpen, setCostcoOpen] = useState(false);
  const [stinteOpen, setStinteOpen] = useState(false);
  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [warehouseOpen, setWarehouseOpen] = useState(false);
  const [calendarHeight, setCalendarHeight] = useState(600);
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState({ open: false, type: null });
  const [toast, setToast] = useState({ message: "", type: "success" }); 

  const navigate = useNavigate();
  const auth = getAuth();

  const BASE_URL =
    process.env.NODE_ENV === "development"
      ? "http://127.0.0.1:5000"
      : "https://stinteportal-backend.onrender.com";

  const CURRENT_USER_URL = `${BASE_URL}/api/me/`;

  const getTitleColor = (title = "") => {
    const t = title.toLowerCase();
    if (t.includes("tech refresh"))
      return "text-black-600 border-orange-600 bg-orange-100";
    if (t.includes("warehouse closed"))
      return "text-white border-gray-600 bg-black";
    if (t.includes("rest"))
      return "text-black-600 border-green-600 bg-green-100";
    if (t.includes("no job scheduled"))
      return "text-black-600 border-gray-600 bg-gray-100";
    if (t.includes("travel"))
      return "text-black-600 border-yellow-600 bg-yellow-100";
    if (t.includes("office"))
      return "text-black-600 border-blue-600 bg-blue-100";
    if (t.includes("personal leave"))
      return "text-black-600 border-purple-600 bg-purple-100";
    if (t.includes("working"))
      if (t.includes("personal leave"))
      return "text-black-600 border-purple-600 bg-purple-100";
    if (t.includes("pto"))
      return "text-black-600 border-emerald-600 bg-emerald-100";
    return "text-black border-gray-300 bg-white";
  };

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

  const fetchAllEvents = useCallback(async () => {
  if (!auth.currentUser) return;

  try {
    const token = await auth.currentUser.getIdToken(true);
    const headers = { Authorization: `Bearer ${token}` };

    // ✅ Fetch both in parallel
    const [travelRes, workRes] = await Promise.all([
      axios.get(`${BASE_URL}/api/travel/`, { headers, withCredentials: true }),
      axios.get(`${BASE_URL}/api/work/`, { headers, withCredentials: true }),
    ]);

    setTravel(travelRes.data);
    setWork(workRes.data);
  } catch (err) {
    console.error("Error fetching events:", err.response?.data || err.message);
  }
}, [auth, BASE_URL]);

  useEffect(() => {
    if (auth.currentUser) {
      fetchCurrentUser();
      fetchAllEvents();

    }
  }, [auth.currentUser, fetchCurrentUser,fetchAllEvents]);

  useEffect(() => {
  const interval = setInterval(() => {
    if (auth.currentUser) fetchAllEvents();
  }, 120000);
  return () => clearInterval(interval);
}, [auth.currentUser, fetchAllEvents]);


  useEffect(() => {
    const handleResize = () => setCalendarHeight(window.innerHeight - 400);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: "", type: "success" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;

    try {
      const token = await auth.currentUser.getIdToken(true);
      const formData = new FormData();
      formData.append("file", file);

      const endpoint =
        type === "work"
          ? `${BASE_URL}/api/work/upload/`
          : `${BASE_URL}/api/travel/upload/`;

      const res = await axios.post(endpoint, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      setToast({
        message: res.data.message || `✅ ${type} uploaded successfully`,
        type: "success",
      });
      fetchAllEvents();
    } catch (err) {
      console.error(`${type} upload error:`, err);
      setToast({
        message: `⚠️ ${type} upload failed: ${err.response?.data?.error || err.message}`,
        type: "error",
      });
    } finally {
      e.target.value = "";
    }
  };


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
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div
          className="flex items-center justify-center p-4 border-b cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <img src={logo} alt="Logo" className="h-12" />
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-2 text-sm font-sans">
          {/* BUILDOPS */}
          <button
            className="w-full text-left px-4 py-2 rounded hover:bg-gray-200 font-bold text-xl"
            onClick={() => window.open("https://leads.buildops.com/login", "_blank")}
          >
            BUILDOPS
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
              <div className="pl-6 space-y-1 mt-1 font-sans">
                {/* INSURANCE */}
                <div>
                  <button
                    className="w-full flex justify-between items-center px-2 py-1 rounded hover:bg-gray-100 font-medium text-lg"
                    onClick={() => setInsuranceOpen(!insuranceOpen)}
                  >
                    Insurance
                    {insuranceOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
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
              <div className="pl-6 space-y-1 mt-1 font-sans">
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
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                warehouseOpen ? "max-h-40" : "max-h-0"
              }`}
            >
              <div className="pl-6 space-y-1 mt-1 font-sans">
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

        <div className="p-4 border-t font-sans">
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 font-sans">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Company News Board</h2>
        </div>

        {/* Toast Notification */}
        {toast.message && (
          <div
            className={`fixed top-6 right-6 px-6 py-3 rounded-xl shadow-lg animate-slide-in z-50 text-white ${
              toast.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {toast.message}
            <button
              onClick={() => setToast({ message: "", type: "success" })}
              className="ml-4 font-bold hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        )}
          
        {/* Calendar */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-2xl font-semibold mb-4">Calendar</h2>

{/* ✅ Calendar Upload/Buttons */}
{currentUser?.role === "Scheduler" && (
  <>
    {/* Travel Upload / Delete */}
    <div className="mb-6">
      <label
        htmlFor="file-upload-travel"
        className="cursor-pointer inline-flex items-center px-4 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200 mr-2"
      >
        Upload Travel
      </label>
      <input
        id="file-upload-travel"
        type="file"
        accept=".xlsx"
        onChange={(e) => handleFileUpload(e, "travel")}
        className="hidden"
      />

      <button
        onClick={() => setIsDeleteConfirmOpen({ open: true, type: "travel" })}
        className="px-4 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
      >
        Delete All Travel
      </button>
    </div>

    {/* Work Upload / Delete */}
    <div className="mb-6">
      <label
        htmlFor="file-upload-work"
        className="cursor-pointer inline-flex items-center px-4 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200 mr-2"
      >
        Upload Work
      </label>
      <input
        id="file-upload-work"
        type="file"
        accept=".xlsx"
        onChange={(e) => handleFileUpload(e, "work")}
        className="hidden"
      />

      <button
        onClick={() => setIsDeleteConfirmOpen({ open: true, type: "work" })}
        className="px-4 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
      >
        Delete All Work
      </button>
    </div>
  </>
)}

          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={[...travel, ...work]}
            height={calendarHeight}
            eventContent={(eventInfo) => {
              const { title, extendedProps } = eventInfo.event;
              return (
                <div
                  className={`p-1 border rounded cursor-pointer text-xs ${getTitleColor(
                    title
                  )} font-sans`}
                  onClick={() => {
                    setSelectedTravel({ title, ...extendedProps });
                    setIsModalOpen(true);
                  }}
                >
                  <div className="font-bold">{title}</div>
                  <div>Technician: {extendedProps.technician_name || "-"}</div>
                </div>
              );
            }}
          />

          {isDeleteConfirmOpen.open && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-gray-900 text-white p-6 rounded-xl shadow-xl max-w-sm w-full border-l-4 border-red-500 animate-fade-in font-sans">
                <h3 className="text-xl font-bold mb-4">⚠️ Confirm Delete</h3>
                <p className="mb-6 text-gray-300">
                  Are you sure you want to delete <b>ALL {isDeleteConfirmOpen.type} events</b>? 
                  This action cannot be undone.
                </p>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setIsDeleteConfirmOpen({ open: false, type: null })}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const token = await auth.currentUser.getIdToken(true);
                        const endpoint =
                          isDeleteConfirmOpen.type === "work"
                            ? `${BASE_URL}/api/work/delete_all/`
                            : `${BASE_URL}/api/travel/delete_all/`;

                        const res = await axios.delete(endpoint, {
                          headers: { Authorization: `Bearer ${token}` },
                          withCredentials: true,
                        });

                        setToast({
                          message: res.data.message || `✅ All ${isDeleteConfirmOpen.type} events deleted.`,
                          type: "success",
                        });

                        fetchAllEvents();
                      } catch (err) {
                        console.error("Delete failed:", err);
                        setToast({
                          message: `⚠️ Delete failed: ${err.response?.data?.error || err.message}`,
                          type: "error",
                        });
                      } finally {
                        setIsDeleteConfirmOpen({ open: false, type: null });
                      }
                    }}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded transition-colors duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ✅ Event Details Modal (Travel or Work) */}
          {isModalOpen && selectedTravel && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
              <div
                className={`bg-white p-6 rounded shadow-lg max-w-md w-full border-t-4 ${getTitleColor(
                  selectedTravel.title
                )} transform transition-transform duration-300 scale-100 font-sans`}
              >
                <h2
                  className={`text-xl font-bold mb-3 ${getTitleColor(
                    selectedTravel.title
                  )}`}
                >
                  {selectedTravel.title}
                </h2>

                {/* Common Fields */}
                <p><b>Technician:</b> {selectedTravel.technician_name || "-"}</p>
                <p><b>Department:</b> {selectedTravel.department_name || "-"}</p>
                <p><b>Description:</b> {selectedTravel.description || "-"}</p>
                <p><b>Status:</b> {selectedTravel.status || "-"}</p>

                {/* Work-Specific Details */}
                {selectedTravel.event_type?.toLowerCase() === "work" && (
                  <>
                    <hr className="my-3 border-gray-300" />
                    <p><b>Property:</b> {selectedTravel.property || "-"}</p>
                    <p><b>Job #:</b> {selectedTravel.job_number || "-"}</p>
                    <p><b>Visit #:</b> {selectedTravel.visit_number || "-"}</p>
                    <p><b>Address:</b> {selectedTravel.address_line || "-"}</p>
                    <p><b>City:</b> {selectedTravel.city || "-"}</p>
                    <p><b>State:</b> {selectedTravel.state || "-"}</p>
                    <p><b>Zip Code:</b> {selectedTravel.zipcode || "-"}</p>
                  </>
                )}

                {/* Travel-Specific Fields */}
                {selectedTravel.event_type?.toLowerCase() === "travel" && (
                  <>
                    <hr className="my-3 border-gray-300" />
                    <p><b>Planned Start:</b> {selectedTravel.planned_start_time_utc || "-"}</p>
                    <p><b>Last Updated:</b> {selectedTravel.last_updated_time_utc || "-"}</p>
                  </>
                )}

                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
