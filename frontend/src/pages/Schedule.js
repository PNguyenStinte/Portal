// src/pages/Scheduling.jsx
import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowsUpDownIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";

const visitColumns = [
  { key: "visit_id", label: "Visit #" },
  { key: "visit_date", label: "Date" },
  { key: "department_name", label: "Department" },
  { key: "visit_description", label: "Description" },
  { key: "primary_technician_name", label: "Primary Technician" },
  { key: "additional_technicians", label: "Additional Technicians" },
];

function Scheduling() {
  const [companyInfo, setCompanyInfo] = useState({});
  const [visits, setVisits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [showModal, setShowModal] = useState(false);

  const [newVisit, setNewVisit] = useState({
    visit_description: "",
    todo: "",
    required_certifications: "",
    department_name: "",
    primary_technician: "",
    additional_technicians: [],
    visit_date: "",
    duration: "",
  });

  const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

  // Fetch company + visits + dropdown data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resCompany = await axios.get(`${API_BASE}/company-info`);
        setCompanyInfo(resCompany.data);

        const resVisits = await axios.get(`${API_BASE}/visits`);
        setVisits(resVisits.data);

        const resDepts = await axios.get(`${API_BASE}/departments`);
        setDepartments(resDepts.data);

        const resEmps = await axios.get(`${API_BASE}/employees`);
        setEmployees(resEmps.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [API_BASE]);

  // Sorting
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = useCallback((key, sortConfig) => {
    const isActive = sortConfig.key === key;
    const color = isActive ? "text-blue-500" : "text-gray-400";

    if (!isActive)
      return <ArrowsUpDownIcon className={`w-4 h-4 inline ml-1 ${color}`} />;

    return sortConfig.direction === "asc" ? (
      <ChevronUpIcon className={`w-4 h-4 inline ml-1 ${color}`} />
    ) : (
      <ChevronDownIcon className={`w-4 h-4 inline ml-1 ${color}`} />
    );
  }, []);

  // Filter + Sort visits
  const sortedFilteredVisits = useMemo(() => {
    return [...visits]
      .filter((v) =>
        visitColumns
          .map((col) => v[col.key])
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .sort((a, b) => {
        if (!sortConfig.key) return 0;
        const valA = a[sortConfig.key]?.toString().toLowerCase() || "";
        const valB = b[sortConfig.key]?.toString().toLowerCase() || "";
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
  }, [visits, search, sortConfig]);

  // Create Visit
  const handleCreateVisit = async () => {
    try {
      await axios.post(`${API_BASE}/visits`, newVisit);
      setShowModal(false);
      setNewVisit({
        visit_description: "",
        todo: "",
        required_certifications: "",
        department_name: "",
        primary_technician: "",
        additional_technicians: [],
        visit_date: "",
        duration: "",
      });
      const resVisits = await axios.get(`${API_BASE}/visits`);
      setVisits(resVisits.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Company Header */}
      <section className="flex flex-col items-center mb-8">
        {companyInfo.logo_url && (
          <Link to="/dashboard">
            <img
              src={companyInfo.logo_url}
              alt="Company Logo"
              className="h-16 mb-2 cursor-pointer"
            />
          </Link>
        )}
        <h2 className="text-2xl font-bold">Scheduling</h2>
      </section>

      {/* Table */}
      <section className="bg-white p-4 rounded shadow mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Scheduled Visits</h2>
          <div className="flex gap-2 items-center">
            <div className="relative w-64">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-300 rounded pl-10 pr-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5" /> Create Visit
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200">
          <table className="w-full border-collapse" role="table">
            <thead className="bg-gray-100 sticky top-0 shadow-sm">
              <tr>
                {visitColumns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left font-semibold text-sm uppercase tracking-wider cursor-pointer ${
                      sortConfig.key === col.key ? "text-blue-500" : "text-gray-700"
                    }`}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label} {getSortIcon(col.key, sortConfig)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedFilteredVisits.length > 0 ? (
                sortedFilteredVisits.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    {visitColumns.map((col) => (
                      <td key={col.key} className="border-t px-4 py-2">
                        {Array.isArray(item[col.key])
                          ? item[col.key].join(", ")
                          : item[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={visitColumns.length}
                    className="text-center text-gray-500 py-4 border-t"
                  >
                    No visits found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create Visit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold mb-4">Create Visit</h3>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Visit Description"
                value={newVisit.visit_description}
                onChange={(e) =>
                  setNewVisit({ ...newVisit, visit_description: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="text"
                placeholder="To Do"
                value={newVisit.todo}
                onChange={(e) =>
                  setNewVisit({ ...newVisit, todo: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="text"
                placeholder="Required Certifications"
                value={newVisit.required_certifications}
                onChange={(e) =>
                  setNewVisit({ ...newVisit, required_certifications: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              />

              {/* Department dropdown */}
              <select
                value={newVisit.department_name}
                onChange={(e) =>
                  setNewVisit({ ...newVisit, department_name: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    </option>
                ))}
              </select>

              {/* Primary Technician dropdown */}
              <select
                value={newVisit.primary_technician}
                onChange={(e) =>
                  setNewVisit({ ...newVisit, primary_technician: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">Select Primary Technician</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>

              {/* Additional Technicians multi-select */}
              <select
                multiple
                value={newVisit.additional_technicians}
                onChange={(e) =>
                  setNewVisit({
                    ...newVisit,
                    additional_technicians: Array.from(
                      e.target.selectedOptions,
                      (opt) => opt.value
                    ),
                  })
                }
                className="w-full border px-3 py-2 rounded h-32"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={newVisit.visit_date}
                onChange={(e) =>
                  setNewVisit({ ...newVisit, visit_date: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="text"
                placeholder="Duration (e.g. 2 hours)"
                value={newVisit.duration}
                onChange={(e) =>
                  setNewVisit({ ...newVisit, duration: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              />

              <button
                onClick={handleCreateVisit}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Save Visit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Scheduling;
