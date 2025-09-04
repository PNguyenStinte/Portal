import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import ContactInfo from "./pages/ContactInfo";
import Materials from "./pages/Material";
import Schedule from "./pages/Schedule";
import Calendar from "./pages/Calendar";

function App() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/stinte/material_information"
          element={
            <PrivateRoute>
              <Materials />
            </PrivateRoute>
          }
        />
        <Route path="/contact_info" element={<ContactInfo />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/schedule" element={<Schedule />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
