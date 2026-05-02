import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Filter } from 'lucide-react';

interface PayrollReportsProps {}

const PayrollReports: React.FC<PayrollReportsProps> = () => {
  const [dateRange, setDateRange] = useState('2026');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [chartKey] = useState(() => Math.random().toString(36));

  // Mock data for departmental salary distribution
  const departmentData = [
    { id: 'dept-1', department: 'Engineering', totalSalary: 125000, employees: 12 },
    { id: 'dept-2', department: 'Sales', totalSalary: 98000, employees: 10 },
    { id: 'dept-3', department: 'Marketing', totalSalary: 67000, employees: 7 },
    { id: 'dept-4', department: 'HR', totalSalary: 45000, employees: 5 },
    { id: 'dept-5', department: 'Finance', totalSalary: 82000, employees: 8 },
    { id: 'dept-6', department: 'Operations', totalSalary: 56000, employees: 6 },
  ];

  // Mock data for year-to-date payroll costs
  const ytdData = [
    { id: 'month-1', month: 'Jan', payroll: 42000, employees: 45 },
    { id: 'month-2', month: 'Feb', payroll: 43500, employees: 46 },
    { id: 'month-3', month: 'Mar', payroll: 44200, employees: 47 },
    { id: 'month-4', month: 'Apr', payroll: 45800, employees: 48 },
    { id: 'month-5', month: 'May', payroll: 46500, employees: 48 },
    { id: 'month-6', month: 'Jun', payroll: 47200, employees: 49 },
    { id: 'month-7', month: 'Jul', payroll: 48000, employees: 50 },
    { id: 'month-8', month: 'Aug', payroll: 48500, employees: 50 },
    { id: 'month-9', month: 'Sep', payroll: 49200, employees: 51 },
    { id: 'month-10', month: 'Oct', payroll: 50000, employees: 52 },
    { id: 'month-11', month: 'Nov', payroll: 50800, employees: 52 },
    { id: 'month-12', month: 'Dec', payroll: 51500, employees: 53 },
  ];

  const departments = ['all', 'Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'];
  const roles = ['all', 'Manager', 'Senior', 'Mid-Level', 'Junior', 'Intern'];

  // Filter the data based on selected filters
  const filteredDepartmentData = selectedDepartment === 'all'
    ? departmentData
    : departmentData.filter(d => d.department === selectedDepartment);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Payroll Reports</h1>
        <p className="text-gray-600 mt-1">Comprehensive payroll analytics and insights</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Range Filter */}
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
              <option value="Q1-2026">Q1 2026</option>
              <option value="Q2-2026">Q2 2026</option>
              <option value="Q3-2026">Q3 2026</option>
              <option value="Q4-2026">Q4 2026</option>
              <option value="last-6-months">Last 6 Months</option>
              <option value="last-3-months">Last 3 Months</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {roles.map(role => (
                <option key={role} value={role}>
                  {role === 'all' ? 'All Roles' : role}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => {
              setDateRange('2026');
              setSelectedDepartment('all');
              setSelectedRole('all');
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

      {/* Departmental Salary Distribution Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Departmental Salary Distribution</h2>
          <p className="text-sm text-gray-600 mt-1">Total monthly salary costs by department</p>
        </div>

        <ResponsiveContainer width="100%" height={400} key={`bar-${chartKey}`}>
          <BarChart
            data={filteredDepartmentData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="department"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total Salary']}
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
          {filteredDepartmentData.map(dept => (
            <div key={dept.department} className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">{dept.department}</div>
              <div className="text-xl font-semibold text-gray-900 mt-1">
                ${dept.totalSalary.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">{dept.employees} employees</div>
            </div>
          ))}
        </div>
      </div>

      {/* Year-to-Date Payroll Costs Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Year-to-Date Payroll Costs</h2>
          <p className="text-sm text-gray-600 mt-1">Monthly payroll expenses throughout the year</p>
        </div>

        <ResponsiveContainer width="100%" height={400} key={`line-${chartKey}`}>
          <LineChart
            data={ytdData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value: number, name: string) => [
                name === 'payroll' ? `$${value.toLocaleString()}` : value,
                name === 'payroll' ? 'Payroll Cost' : 'Employees'
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
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="employees"
              stroke="#10b981"
              strokeWidth={2}
              name="Employee Count"
              dot={{ fill: '#10b981', r: 4 }}
              strokeDasharray="5 5"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Summary Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">Total YTD Payroll</div>
            <div className="text-2xl font-semibold text-blue-900 mt-1">
              ${ytdData.reduce((sum, month) => sum + month.payroll, 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium">Average Monthly</div>
            <div className="text-2xl font-semibold text-green-900 mt-1">
              ${Math.round(ytdData.reduce((sum, month) => sum + month.payroll, 0) / ytdData.length).toLocaleString()}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 font-medium">Current Employees</div>
            <div className="text-2xl font-semibold text-purple-900 mt-1">
              {ytdData[ytdData.length - 1].employees}
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm text-orange-600 font-medium">Growth Rate</div>
            <div className="text-2xl font-semibold text-orange-900 mt-1">
              +{(((ytdData[ytdData.length - 1].payroll - ytdData[0].payroll) / ytdData[0].payroll) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollReports;
