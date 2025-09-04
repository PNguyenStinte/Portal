import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowsUpDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";

// ✅ Move column definitions outside the component
const dataColumns = [
  { key: "category", label: "Category" },
  { key: "description", label: "Part Description" },
  { key: "manufacture", label: "Manufacture" },
  { key: "vendor", label: "Vendor" },
];

const electricalColumns = [
  { key: "description", label: "Part Description" },
  { key: "manufacture", label: "Manufacture" },
  { key: "vendor", label: "Vendor" },
];

function Materials() {
  const [companyInfo, setCompanyInfo] = useState({});
  const [dataMaterials, setDataMaterials] = useState([]);
  const [electricalMaterials, setElectricalMaterials] = useState([]);
  const [searchData, setSearchData] = useState("");
  const [searchElectrical, setSearchElectrical] = useState("");
  const [sortData, setSortData] = useState({ key: null, direction: "asc" });
  const [sortElectrical, setSortElectrical] = useState({ key: null, direction: "asc" });

  // ✅ Base URL from env or fallback
  const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

  // DRY fetch helper
  const fetchData = async (url, setter) => {
    try {
      const res = await axios.get(url);
      setter(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData(`${API_BASE}/api/company-info`, setCompanyInfo);
    fetchData(`${API_BASE}/api/materials/data`, setDataMaterials);
    fetchData(`${API_BASE}/api/materials/electrical`, setElectricalMaterials);
  }, [API_BASE]);

  // Sorting
  const handleSort = (key, table) => {
    if (table === "data") {
      setSortData((prev) => ({
        key,
        direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
      }));
    } else {
      setSortElectrical((prev) => ({
        key,
        direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
      }));
    }
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

  const getSortedFiltered = (materials, search, sortConfig, columns) => {
    return [...materials]
      .filter((item) =>
        columns
          .map((col) => item[col.key])
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
  };

  // ✅ Now ESLint won’t complain, since columns are stable
  const sortedFilteredData = useMemo(
    () => getSortedFiltered(dataMaterials, searchData, sortData, dataColumns),
    [dataMaterials, searchData, sortData]
  );

  const sortedFilteredElectrical = useMemo(
    () =>
      getSortedFiltered(
        electricalMaterials,
        searchElectrical,
        sortElectrical,
        electricalColumns
      ),
    [electricalMaterials, searchElectrical, sortElectrical]
  );

  const renderTable = (title, materials, search, setSearch, sortConfig, columns, tableKey) => {
    return (
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
                    onClick={() => handleSort(col.key, tableKey)}
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
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Company Logo and Header */}
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
        <h2 className="text-2xl font-bold">Material Information</h2>
      </section>

      {renderTable(
        "Data Materials",
        sortedFilteredData,
        searchData,
        setSearchData,
        sortData,
        dataColumns,
        "data"
      )}

      {renderTable(
        "Electrical Materials",
        sortedFilteredElectrical,
        searchElectrical,
        setSearchElectrical,
        sortElectrical,
        electricalColumns,
        "electrical"
      )}
    </div>
  );
}

export default Materials;
