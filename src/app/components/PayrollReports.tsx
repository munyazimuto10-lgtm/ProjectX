// Import React hooks and types
import React, { useState, useEffect } from "react";
// Import charting components from recharts
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
// Import icon components
import { Calendar, Filter } from "lucide-react";
// Import database layer
import { db } from "@/lib/db";

// Department statistics data
interface DeptStat {
  // Department name
  department: string;
  // Total salary for the department
  totalSalary: number;
  // Number of employees in department
  employees: number;
}

// Year-to-date payroll data point
interface YtdPoint {
  // Month abbreviation (e.g., "Jan")
  month: string;
  // Total payroll amount for the month
  payroll: number;
  // Number of employees processed
  employees: number;
}

// Payroll Reports component for analytics and insights
const PayrollReports: React.FC = () => {
  // Selected year for date range (e.g., "2026")
  const [dateRange, setDateRange] = useState("2026");
  // Selected department filter (or "all")
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  // Selected employee role filter (or "all")
  const [selectedRole, setSelectedRole] = useState("all");
  // Unique key for chart re-rendering (prevents animation issues)
  const [chartKey] = useState(() => Math.random().toString(36));
  // Department salary statistics
  const [departmentData, setDepartmentData] = useState<DeptStat[]>([]);
  // Year-to-date payroll data
  const [ytdData, setYtdData] = useState<YtdPoint[]>([]);
  // Loading state while fetching data
  const [loading, setLoading] = useState(true);

  // Load report data on component mount or when dateRange changes
  useEffect(() => {
    // Fetch both department stats and year-to-date data in parallel
    Promise.all([
      db.payroll.departmentStats(dateRange),
      db.payroll.ytd(dateRange),
    ])
      .then(([deptStats, ytd]) => {
        // Transform department stats data
        setDepartmentData(
          deptStats.map((d) => ({
            department: d.department,
            totalSalary: d.totalSalary,
            employees: d.employees,
          })),
        );
        // Set YTD data
        setYtdData(ytd);
      })
      .finally(() => setLoading(false));
  }, [dateRange]);

  // Get unique list of departments from data (for filter dropdown)
  const departments = [
    "all",
    ...Array.from(new Set(departmentData.map((d) => d.department))),
  ];
  // Available employee roles for filtering
  const roles = ["all", "Manager", "Senior", "Mid-Level", "Junior", "Intern"];

  // Filter department data based on selected department
  const filteredDepartmentData =
    selectedDepartment === "all"
      ? departmentData
      : departmentData.filter((d) => d.department === selectedDepartment);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Payroll Reports
        </h1>
        <p className="text-gray-600 mt-1">
          Comprehensive payroll analytics and insights
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="2026">Year 2026</option>
              <option value="2025">Year 2025</option>
              <option value="2024">Year 2024</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === "all" ? "All Departments" : d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r === "all" ? "All Roles" : r}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => {
              setDateRange("2026");
              setSelectedDepartment("all");
              setSelectedRole("all");
            }}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Reset Filters
          </button>
          <button className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            Apply Filters
          </button>
        </div>
      </div>

      {/* Department chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Departmental Salary Distribution
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Total net pay by department (latest payroll run)
          </p>
        </div>
        {filteredDepartmentData.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            No payroll data yet — save a payroll run first.
          </p>
        ) : (
          <>
            <ResponsiveContainer
              width="100%"
              height={400}
              key={`bar-${chartKey}`}
            >
              <BarChart
                data={filteredDepartmentData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="department"
                  stroke="#6b7280"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: "12px" }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(v: number) => [
                    `$${v.toLocaleString()}`,
                    "Total Salary",
                  ]}
                  isAnimationActive={false}
                />
                <Legend />
                <Bar
                  dataKey="totalSalary"
                  fill="#3b82f6"
                  name="Total Salary"
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredDepartmentData.map((dept) => (
                <div
                  key={dept.department}
                  className="bg-gray-50 rounded-lg p-4"
                >
                  <div className="text-sm text-gray-600">{dept.department}</div>
                  <div className="text-xl font-semibold text-gray-900 mt-1">
                    ${dept.totalSalary.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {dept.employees} employee{dept.employees !== 1 ? "s" : ""}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* YTD chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Year-to-Date Payroll Costs
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Monthly payroll expenses throughout {dateRange}
          </p>
        </div>
        {ytdData.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            No payroll runs recorded for {dateRange} yet.
          </p>
        ) : (
          <>
            <ResponsiveContainer
              width="100%"
              height={400}
              key={`line-${chartKey}`}
            >
              <LineChart
                data={ytdData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  stroke="#6b7280"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: "12px" }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(v: number, name: string) => [
                    name === "payroll" ? `$${v.toLocaleString()}` : v,
                    name === "payroll" ? "Payroll Cost" : "Employees",
                  ]}
                  isAnimationActive={false}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="payroll"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Payroll Cost"
                  dot={{ fill: "#3b82f6", r: 5 }}
                  activeDot={{ r: 7 }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="employees"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Employee Count"
                  dot={{ fill: "#10b981", r: 4 }}
                  strokeDasharray="5 5"
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Total YTD Payroll",
                  color: "blue",
                  value: `$${ytdData.reduce((s, m) => s + m.payroll, 0).toLocaleString()}`,
                },
                {
                  label: "Average Monthly",
                  color: "green",
                  value: `$${Math.round(ytdData.reduce((s, m) => s + m.payroll, 0) / ytdData.length).toLocaleString()}`,
                },
                {
                  label: "Current Employees",
                  color: "purple",
                  value: String(ytdData.at(-1)?.employees ?? 0),
                },
                {
                  label: "Growth Rate",
                  color: "orange",
                  value: `+${((((ytdData.at(-1)?.payroll ?? 0) - (ytdData[0]?.payroll ?? 0)) / (ytdData[0]?.payroll || 1)) * 100).toFixed(1)}%`,
                },
              ].map(({ label, color, value }) => (
                <div key={label} className={`bg-${color}-50 rounded-lg p-4`}>
                  <div className={`text-sm text-${color}-600 font-medium`}>
                    {label}
                  </div>
                  <div
                    className={`text-2xl font-semibold text-${color}-900 mt-1`}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PayrollReports;
