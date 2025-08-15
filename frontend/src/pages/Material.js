import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowsUpDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";

function WarehouseMaterials() {
  const [companyInfo, setCompanyInfo] = useState({});
  const [dataMaterials, setDataMaterials] = useState([]);
  const [electricalMaterials, setElectricalMaterials] = useState([]);
  const [searchData, setSearchData] = useState("");
  const [searchElectrical, setSearchElectrical] = useState("");
  const [sortData, setSortData] = useState({ key: null, direction: "asc" });
  const [sortElectrical, setSortElectrical] = useState({
    key: null,
    direction: "asc",
  });

  const columns = [
    { key: "category", label: "Category" },
    { key: "description", label: "Part Description" },
    { key: "manufacture", label: "Manufacture" },
    { key: "vendor", label: "Vendor" },
  ];

  useEffect(() => {
    axios
      .get("http://localhost:5000/company-info")
      .then((res) => setCompanyInfo(res.data))
      .catch((err) => console.error(err));

    axios
      .get("http://localhost:5000/materials/data")
      .then((res) => setDataMaterials(res.data))
      .catch((err) => console.error(err));

    axios
      .get("http://localhost:5000/materials/electrical")
      .then((res) => setElectricalMaterials(res.data))
      .catch((err) => console.error(err));
  }, []);

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
    const activeColor = isActive ? "text-blue-500" : "text-gray-400";

    if (!isActive)
      return <ArrowsUpDownIcon className={`w-4 h-4 inline ml-1 ${activeColor}`} />;

    return sortConfig.direction === "asc" ? (
      <ChevronUpIcon className={`w-4 h-4 inline ml-1 ${activeColor}`} />
    ) : (
      <ChevronDownIcon className={`w-4 h-4 inline ml-1 ${activeColor}`} />
    );
  }, []);

  const getSortedFiltered = (materials, search, sortConfig, visibleColumns) => {
    return [...materials]
      .filter((item) =>
        visibleColumns
          .map((col) => item[col.key])
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .sort((a, b) => {
        if (!sortConfig.key) return 0;
        const valA = a[sortConfig.key]?.toLowerCase();
        const valB = b[sortConfig.key]?.toLowerCase();
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
  };

  const renderTable = (title, materials, search, setSearch, sortConfig, tableKey) => {
    // Decide visible columns
    const visibleColumns =
      tableKey === "electrical"
        ? columns.filter((col) => col.key !== "category")
        : columns;

    const sortedFilteredMaterials = getSortedFiltered(
      materials,
      search,
      sortConfig,
      visibleColumns
    );

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
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 sticky top-0 shadow-sm">
              <tr>
                {visibleColumns.map((col) => (
                  <th
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
              {sortedFilteredMaterials.length > 0 ? (
                sortedFilteredMaterials.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    {visibleColumns.map((col) => (
                      <td key={col.key} className="border-t px-4 py-2">
                        {item[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={visibleColumns.length}
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
        dataMaterials,
        searchData,
        setSearchData,
        sortData,
        "data"
      )}
      {renderTable(
        "Electrical Materials",
        electricalMaterials,
        searchElectrical,
        setSearchElectrical,
        sortElectrical,
        "electrical"
      )}
    </div>
  );
}

export default WarehouseMaterials;
