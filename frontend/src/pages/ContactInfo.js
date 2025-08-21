import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowsUpDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";

// ✅ Define columns outside so they don’t change on re-renders
const contactColumns = [
  { key: "name", label: "Name" },
  { key: "position", label: "Role" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
];

function ContactInfo() {
  const [companyInfo, setCompanyInfo] = useState({});
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

  // Fetch company + contacts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resCompany = await axios.get(`${API_BASE}/company-info`);
        setCompanyInfo(resCompany.data);

        const resContacts = await axios.get(`${API_BASE}/employees`);
        setContacts(resContacts.data);
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

  // Filter + Sort
  const sortedFilteredContacts = useMemo(() => {
    return [...contacts]
      .filter((c) =>
        contactColumns
          .map((col) => c[col.key])
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
  }, [contacts, search, sortConfig]);

  // ✅ Reusable table renderer
  const renderTable = (title, materials, search, setSearch, sortConfig, columns) => (
    <section className="bg-white p-4 rounded shadow mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
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
      </div>

      <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse" role="table">
          <thead className="bg-gray-100 sticky top-0 shadow-sm">
            <tr>
              {columns.map((col) => (
                <th
                  scope="col"
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
            {materials.length > 0 ? (
              materials.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="border-t px-4 py-2">
                      {item[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center text-gray-500 py-4 border-t"
                >
                  No contacts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

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

      {renderTable(
        "Company Contacts",
        sortedFilteredContacts,
        search,
        setSearch,
        sortConfig,
        contactColumns
      )}
    </div>
  );
}

export default ContactInfo;
