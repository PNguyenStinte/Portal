import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowsUpDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";

function ContactInfo() {
  const [companyInfo, setCompanyInfo] = useState({});
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    axios
      .get("https://stinteportal-backend.onrender.com/company-info")
      .then((res) => setCompanyInfo(res.data))
      .catch((err) => console.error(err));

    axios
      .get("https://stinteportal-backend.onrender.com/employees")
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error(err));
  }, []);

  const columns = [
    { key: "name", label: "Name" },
    { key: "position", label: "Position" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
  ];

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const getSortIcon = (key) => {
    const isActive = sortConfig.key === key;
    const activeColor = isActive ? "text-blue-500" : "text-gray-400";

    if (!isActive) {
      return (
        <ArrowsUpDownIcon className={`w-4 h-4 inline ml-1 ${activeColor}`} />
      );
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUpIcon className={`w-4 h-4 inline ml-1 ${activeColor}`} />
    ) : (
      <ChevronDownIcon className={`w-4 h-4 inline ml-1 ${activeColor}`} />
    );
  };

  const sortedEmployees = [...employees]
    .filter((emp) =>
      [emp.name, emp.position, emp.phone, emp.email]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const valueA = a[sortConfig.key]?.toString().toLowerCase();
      const valueB = b[sortConfig.key]?.toString().toLowerCase();
      if (valueA < valueB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valueA > valueB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Company Info */}
      <section className="mb-8 bg-white p-4 rounded shadow">
        <div className="flex flex-col items-center mb-4">
          {companyInfo.logo_url && (
            <Link to="/dashboard">
              <img
                src={companyInfo.logo_url}
                alt="Company Logo"
                className="h-16 mb-2 cursor-pointer"
              />
            </Link>
          )}
          <h2 className="text-2xl font-bold text-center">
            Company Contact Information
          </h2>
        </div>

        <p>
          <strong>Name:</strong> {companyInfo.name}
        </p>
        <p>
          <strong>Address:</strong>{" "}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              companyInfo.address
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {companyInfo.address}
          </a>
        </p>
        <p>
          <strong>Phone:</strong> {companyInfo.phone}
        </p>
        <p>
          <strong>Email:</strong>{" "}
          <a
            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
              companyInfo.email
            )}&su=Hello%20${encodeURIComponent(companyInfo.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {companyInfo.email}
          </a>
        </p>
      </section>

      {/* Employee List */}
      <section className="bg-white p-4 rounded shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Employee Directory</h2>
          <div className="relative w-64">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded pl-10 pr-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 sticky top-0 shadow-sm">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left font-semibold text-sm uppercase tracking-wider cursor-pointer ${
                      sortConfig.key === col.key
                        ? "text-blue-500"
                        : "text-gray-700"
                    }`}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label} {getSortIcon(col.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedEmployees.length > 0 ? (
                sortedEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="border-t px-4 py-2">{emp.name}</td>
                    <td className="border-t px-4 py-2">{emp.position}</td>
                    <td className="border-t px-4 py-2">{emp.phone}</td>
                    <td className="border-t px-4 py-2">
                      <a
                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                          emp.email
                        )}&su=Hello%20${encodeURIComponent(emp.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {emp.email}
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center text-gray-500 py-4 border-t"
                  >
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default ContactInfo;
