// src/pages/Dashboard.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.png";
import { ChevronDown, ChevronUp, X } from "lucide-react"; // Added X icon
import {
  getAuth,
  signOut as firebaseSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";

// react-big-calendar + date-fns localizer
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  "en-US": require("date-fns/locale/en-US"),
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

function Dashboard() {
  const [news, setNews] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [costcoOpen, setCostcoOpen] = useState(false);
  const [stinteOpen, setStinteOpen] = useState(false);
  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [googleToken, setGoogleToken] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null); 
  const [view, setView] = useState("month");      
  const [date, setDate] = useState(new Date());   
  const [warehouseOpen, setWarehouseOpen] = useState(false);

  const navigate = useNavigate();
  const auth = getAuth();

  const [user, setUser] = useState(null);

  useEffect(() => {
    axios
        .get("https://stinteportal-backend.onrender.com/Dashboard")
        .then((res) => setNews(res.data))
        .catch((err) => console.error(err));

  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
    });
    return () => unsub();
  }, [auth]);

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      sessionStorage.clear();
      localStorage.clear();
      setGoogleToken(null);
      setCalendarEvents([]);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/calendar.readonly");
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      if (accessToken) {
        setGoogleToken(accessToken);
        fetchCalendarEvents(accessToken);
      } else {
        console.warn("No access token returned from Google sign-in.");
      }
    } catch (err) {
      console.error("Google sign-in failed:", err);
    }
  };

  const fetchCalendarEvents = useCallback(
    async (accessToken) => {
      if (!accessToken) return;
      setLoadingCalendar(true);

      try {
        const timeMin = new Date().toISOString();
        const timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + 60);
        const timeMaxISO = timeMax.toISOString();

        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
          timeMin
        )}&timeMax=${encodeURIComponent(timeMaxISO)}&singleEvents=true&orderBy=startTime&maxResults=2500`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        });

        if (res.status === 401 || res.status === 403) {
          console.warn("Google token invalid or expired. Please reconnect.");
          setGoogleToken(null);
          setCalendarEvents([]);
          setLoadingCalendar(false);
          return;
        }

        const data = await res.json();
        if (!data.items) {
          setCalendarEvents([]);
          setLoadingCalendar(false);
          return;
        }

        const events = data.items.map((ev) => {
          const startRaw = ev.start?.dateTime ?? ev.start?.date;
          const endRaw = ev.end?.dateTime ?? ev.end?.date;
          const start = startRaw ? new Date(startRaw) : new Date();
          const end = endRaw ? new Date(endRaw) : start;

          return {
            id: ev.id,
            title: ev.summary || "(no title)",
            start,
            end,
            description: ev.description || "",
            location: ev.location || "",
            raw: ev,
          };
        });

        setCalendarEvents(events);
      } catch (err) {
        console.error("Error fetching calendar events:", err);
      } finally {
        setLoadingCalendar(false);
      }
    },
    [setCalendarEvents]
  );

  const refreshCalendar = async () => {
    if (!googleToken) {
      await connectGoogleCalendar();
      return;
    }
    await fetchCalendarEvents(googleToken);
  };

  const CalendarControls = () => (
    <div className="flex items-center gap-3">
      {!googleToken ? (
        <button
          onClick={connectGoogleCalendar}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Connect Google Calendar
        </button>
      ) : (
        <>
          <button
            onClick={refreshCalendar}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Refresh Calendar
          </button>
          <button
            onClick={() => {
              setGoogleToken(null);
              setCalendarEvents([]);
            }}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Disconnect
          </button>
        </>
      )}
    </div>
  );

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
                  onClick={() => navigate("/contact-info")}
                >
                  Ask IT
                </button>
                <button
                  className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 font-medium text-lg"
                  onClick={() => navigate("/contact-info")}
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Company News Board</h2>
          <div className="flex gap-2 items-center">
            <CalendarControls />
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

        {/* Calendar area */}
        <div className="bg-white p-4 rounded shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">My Google Calendar</h3>
            <div className="text-sm text-gray-600">
              {user ? user.email : "Not signed in"}
            </div>
          </div>

          {loadingCalendar ? (
            <div className="p-6 text-center text-gray-600">Loading events…</div>
          ) : googleToken && calendarEvents.length > 0 ? (
            <BigCalendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              onSelectEvent={(event) => setSelectedEvent(event)}
              view={view}
              onView={(newView) => setView(newView)}
              date={date}
              onNavigate={(newDate) => setDate(newDate)}
              views={['month', 'week', 'day', 'agenda']}
              popup
            />
          ) : googleToken && calendarEvents.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No upcoming events in the next 60 days.
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="mb-4 text-gray-700">
                Connect your Google account to view your personal calendar events
              </p>
              <div className="flex justify-center">
                <button
                  onClick={connectGoogleCalendar}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Connect Google Calendar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sleek Event Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md transform transition-all scale-100">
              {/* Header */}
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-xl font-semibold text-gray-800">
                  {selectedEvent.title}
                </h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="mt-4 space-y-2 text-gray-700">
                <p>
                  <strong>Start:</strong>{" "}
                  {selectedEvent.start.toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
                <p>
                  <strong>End:</strong>{" "}
                  {selectedEvent.end.toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
                {selectedEvent.location && (
                  <p>
                    <strong>Location:</strong> {selectedEvent.location}
                  </p>
                )}
                {selectedEvent.description && (
                  <p className="mt-2 whitespace-pre-line">
                    {selectedEvent.description}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 text-right">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
