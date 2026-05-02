import { useState } from 'react';
import { Calendar, Download, Calculator, Save, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { PayrollSettings } from './Settings';

interface EmployeePayroll {
  id: string;
  name: string;
  department: string;
  hourlyRate: number;
  hoursWorked: number;
  overtimeHours: number;
  basePay: number;
  tax: number;
  pension: number;
  netPay: number;
  paidLeaveHours?: number;
  paidLeaveDays?: number;
}

interface PayrollProcessingProps {
  settings: PayrollSettings;
  onNotification: (title: string, message: string) => void;
}

export function PayrollProcessing({ settings, onNotification }: PayrollProcessingProps) {
  const [payPeriod, setPayPeriod] = useState('2026-04-01 - 2026-04-15');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPaidLeaveModalOpen, setIsPaidLeaveModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePayroll | null>(null);
  const [leaveRate, setLeaveRate] = useState('5'); // Default 5% of hours worked converts to paid leave

  const [employees, setEmployees] = useState<EmployeePayroll[]>([
    {
      id: 'EMP001',
      name: 'Ruvimbo Moyo',
      department: 'Engineering',
      hourlyRate: 75,
      hoursWorked: 80,
      overtimeHours: 0,
      basePay: 0,
      tax: 0,
      pension: 0,
      netPay: 0,
      paidLeaveHours: 0,
      paidLeaveDays: 0,
    },
    {
      id: 'EMP002',
      name: 'Tinashe Ncube',
      department: 'Marketing',
      hourlyRate: 65,
      hoursWorked: 80,
      overtimeHours: 0,
      basePay: 0,
      tax: 0,
      pension: 0,
      netPay: 0,
      paidLeaveHours: 0,
      paidLeaveDays: 0,
    },
    {
      id: 'EMP003',
      name: 'Tariro Sibanda',
      department: 'Sales',
      hourlyRate: 60,
      hoursWorked: 80,
      overtimeHours: 0,
      basePay: 0,
      tax: 0,
      pension: 0,
      netPay: 0,
      paidLeaveHours: 0,
      paidLeaveDays: 0,
    },
    {
      id: 'EMP004',
      name: 'Tendai Dube',
      department: 'HR',
      hourlyRate: 55,
      hoursWorked: 80,
      overtimeHours: 0,
      basePay: 0,
      tax: 0,
      pension: 0,
      netPay: 0,
      paidLeaveHours: 0,
      paidLeaveDays: 0,
    },
    {
      id: 'EMP005',
      name: 'Nyasha Ndlovu',
      department: 'Finance',
      hourlyRate: 70,
      hoursWorked: 80,
      overtimeHours: 0,
      basePay: 0,
      tax: 0,
      pension: 0,
      netPay: 0,
      paidLeaveHours: 0,
      paidLeaveDays: 0,
    },
    {
      id: 'EMP006',
      name: 'Robert Brown',
      department: 'Engineering',
      hourlyRate: 80,
      hoursWorked: 80,
      overtimeHours: 0,
      basePay: 0,
      tax: 0,
      pension: 0,
      netPay: 0,
      paidLeaveHours: 0,
      paidLeaveDays: 0,
    },
    {
      id: 'EMP007',
      name: 'Amanda White',
      department: 'Marketing',
      hourlyRate: 58,
      hoursWorked: 80,
      overtimeHours: 0,
      basePay: 0,
      tax: 0,
      pension: 0,
      netPay: 0,
      paidLeaveHours: 0,
      paidLeaveDays: 0,
    },
    {
      id: 'EMP008',
      name: 'James Wilson',
      department: 'Sales',
      hourlyRate: 85,
      hoursWorked: 80,
      overtimeHours: 0,
      basePay: 0,
      tax: 0,
      pension: 0,
      netPay: 0,
      paidLeaveHours: 0,
      paidLeaveDays: 0,
    },
  ]);

  const handleHoursChange = (id: string, field: 'hoursWorked' | 'overtimeHours', value: string) => {
    const numValue = parseFloat(value) || 0;
    setEmployees(employees.map(emp =>
      emp.id === id ? { ...emp, [field]: numValue } : emp
    ));
    setCalculated(false);
    setSaved(false);
  };

  const calculatePayroll = () => {
    const updatedEmployees = employees.map(emp => {
      // Base pay = (regular hours × hourly rate) + (overtime hours × hourly rate × 1.5)
      const regularPay = emp.hoursWorked * emp.hourlyRate;
      const overtimePay = emp.overtimeHours * emp.hourlyRate * 1.5;
      const basePay = regularPay + overtimePay;

      // Calculate paid leave compensation (paid leave hours × hourly rate)
      const paidLeavePay = (emp.paidLeaveHours || 0) * emp.hourlyRate;

      // Total compensation includes base pay and paid leave pay
      const totalCompensation = basePay + paidLeavePay;

      // Tax calculation using configurable tax brackets on total compensation
      let tax = 0;
      let remainingIncome = totalCompensation;

      for (let i = 0; i < settings.taxBrackets.length; i++) {
        const bracket = settings.taxBrackets[i];
        const bracketMin = bracket.minIncome;
        const bracketMax = bracket.maxIncome;

        if (remainingIncome <= 0) break;

        if (totalCompensation > bracketMin) {
          let taxableInBracket = 0;

          if (bracketMax === null) {
            // Last bracket with no upper limit
            taxableInBracket = totalCompensation - bracketMin;
          } else {
            // Calculate taxable amount in this bracket
            taxableInBracket = Math.min(totalCompensation, bracketMax) - bracketMin;
          }

          if (taxableInBracket > 0) {
            tax += (taxableInBracket * bracket.rate) / 100;
          }
        }
      }

      // Pension contribution using configurable rate on total compensation
      const pension = (totalCompensation * settings.pensionRate) / 100;

      // Net pay = total compensation - tax - pension
      const netPay = totalCompensation - tax - pension;

      return {
        ...emp,
        basePay: totalCompensation,
        tax,
        pension,
        netPay,
      };
    });

    setEmployees(updatedEmployees);
    setCalculated(true);
    setSaved(false);

    // Add notification
    const totalEmployees = updatedEmployees.length;
    const totalAmount = updatedEmployees.reduce((sum, emp) => sum + emp.netPay, 0);
    onNotification(
      'Payroll Calculated',
      `Payroll for ${totalEmployees} employees calculated. Total net pay: $${totalAmount.toFixed(2)}`
    );
  };

  const handleSave = () => {
    // Simulate saving payroll data
    console.log('Saving payroll data:', employees);
    setSaved(true);

    // Add notification
    onNotification(
      'Payroll Saved',
      `Payroll data for ${employees.length} employees has been successfully saved for pay period ${payPeriod}`
    );

    setTimeout(() => setSaved(false), 3000);
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    // Simulate export functionality
    console.log(`Exporting payroll as ${format.toUpperCase()}`);
    setIsExportOpen(false);

    // Create a simple data export simulation
    const exportData = employees.map(emp => ({
      'Employee ID': emp.id,
      'Name': emp.name,
      'Department': emp.department,
      'Hours Worked': emp.hoursWorked,
      'Overtime Hours': emp.overtimeHours,
      'Base Pay': `$${emp.basePay.toFixed(2)}`,
      'Tax': `$${emp.tax.toFixed(2)}`,
      'Pension': `$${emp.pension.toFixed(2)}`,
      'Net Pay': `$${emp.netPay.toFixed(2)}`,
      'Paid Leave Hours': emp.paidLeaveHours?.toFixed(2) || '0.00',
      'Paid Leave Days': emp.paidLeaveDays?.toFixed(2) || '0.00',
    }));

    console.table(exportData);

    // Add notification
    onNotification(
      'Payroll Exported',
      `Payroll data has been successfully exported as ${format.toUpperCase()} for pay period ${payPeriod}`
    );
  };

  const handleOpenPaidLeaveModal = (employee: EmployeePayroll) => {
    setSelectedEmployee(employee);
    setLeaveRate('5');
    setIsPaidLeaveModalOpen(true);
  };

  const calculatePaidLeave = (hoursWorked: number, rate: number) => {
    const paidLeaveHours = (hoursWorked * rate) / 100;
    const paidLeaveDays = paidLeaveHours / 8; // Assuming 8-hour workday
    return {
      paidLeaveHours: parseFloat(paidLeaveHours.toFixed(2)),
      paidLeaveDays: parseFloat(paidLeaveDays.toFixed(2)),
    };
  };

  const handleSavePaidLeave = () => {
    if (!selectedEmployee) return;

    const rate = parseFloat(leaveRate) || 0;
    const { paidLeaveHours, paidLeaveDays } = calculatePaidLeave(selectedEmployee.hoursWorked, rate);

    setEmployees((prevEmployees) =>
      prevEmployees.map((emp) =>
        emp.id === selectedEmployee.id
          ? {
              ...emp,
              paidLeaveHours,
              paidLeaveDays,
            }
          : emp
      )
    );

    // Add notification
    onNotification(
      'Paid Leave Calculated',
      `${selectedEmployee.name}: ${paidLeaveHours} hours (${paidLeaveDays} days) of paid leave calculated`
    );

    setIsPaidLeaveModalOpen(false);
    setSelectedEmployee(null);
  };

  const { paidLeaveHours: previewLeaveHours, paidLeaveDays: previewLeaveDays } = selectedEmployee
    ? calculatePaidLeave(selectedEmployee.hoursWorked, parseFloat(leaveRate) || 0)
    : { paidLeaveHours: 0, paidLeaveDays: 0 };

  const totalBasePay = employees.reduce((sum, emp) => sum + emp.basePay, 0);
  const totalTax = employees.reduce((sum, emp) => sum + emp.tax, 0);
  const totalPension = employees.reduce((sum, emp) => sum + emp.pension, 0);
  const totalNetPay = employees.reduce((sum, emp) => sum + emp.netPay, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Payroll Processing</h2>
          <p className="text-sm text-gray-500 mt-1">Process payroll for the current pay period</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={calculatePayroll}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Calculator className="w-5 h-5" />
            Calculate Payroll
          </button>
          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              Export
            </button>

            {/* Export Dropdown */}
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors"
                >
                  Export as PDF
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg transition-colors border-t border-gray-100"
                >
                  Export as Excel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pay Period and Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pay Period</p>
              <p className="text-sm font-medium text-gray-900">{payPeriod}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              calculated ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              {calculated ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-orange-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className={`text-sm font-medium ${calculated ? 'text-green-600' : 'text-orange-600'}`}>
                {calculated ? 'Calculated' : 'Not Calculated'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Employees</p>
              <p className="text-xl font-semibold text-gray-900">{employees.length}</p>
            </div>
            {saved && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alert Message */}
      {!calculated && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Ready to calculate</p>
            <p className="text-sm text-blue-700 mt-1">
              Calculate paid leave for employees first, then enter hours worked and overtime hours. Click "Calculate Payroll" to compute total compensation including paid leave, tax, pension, and net pay.
            </p>
          </div>
        </div>
      )}

      {/* Paid Leave Calculation Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Paid Leave Calculation</h3>
              <p className="text-sm text-gray-500 mt-1">Calculate paid leave based on hours logged - this will be included in total compensation</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours Logged
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Leave Hours
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Leave Days
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Leave Pay
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                        <p className="text-xs text-gray-500">{employee.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {employee.department}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {employee.hoursWorked} hrs
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                    {employee.paidLeaveHours?.toFixed(2) || '0.00'} hrs
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                    {employee.paidLeaveDays?.toFixed(2) || '0.00'} days
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">
                    ${((employee.paidLeaveHours || 0) * employee.hourlyRate).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleOpenPaidLeaveModal(employee)}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Calculate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Employee Payroll</h3>
          <p className="text-sm text-gray-500 mt-1">Edit hours and overtime - paid leave compensation is automatically included in total pay</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hourly Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours Worked
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overtime
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Leave
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Pay
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tax
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pension
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Pay
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                        <p className="text-xs text-gray-500">{employee.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {employee.department}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${employee.hourlyRate}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={employee.hoursWorked}
                      onChange={(e) => handleHoursChange(employee.id, 'hoursWorked', e.target.value)}
                      className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={employee.overtimeHours}
                      onChange={(e) => handleHoursChange(employee.id, 'overtimeHours', e.target.value)}
                      className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                    ${((employee.paidLeaveHours || 0) * employee.hourlyRate).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${employee.basePay.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                    ${employee.tax.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                    ${employee.pension.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    ${employee.netPay.toFixed(2)}
                  </td>
                </tr>
              ))}

              {/* Totals Row */}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-4 text-sm text-gray-900" colSpan={6}>
                  Total
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${totalBasePay.toFixed(2)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600">
                  ${totalTax.toFixed(2)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-orange-600">
                  ${totalPension.toFixed(2)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                  ${totalNetPay.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      {calculated && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Compensation</p>
            <p className="text-2xl font-semibold text-gray-900">
              ${totalBasePay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">Includes paid leave</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Tax Deductions</p>
            <p className="text-2xl font-semibold text-red-600">
              ${totalTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Pension</p>
            <p className="text-2xl font-semibold text-orange-600">
              ${totalPension.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Net Pay</p>
            <p className="text-2xl font-semibold text-green-600">
              ${totalNetPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {calculated && (
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Payroll calculations complete</h4>
            <p className="text-sm text-gray-500 mt-1">Total compensation includes base pay, overtime, and paid leave benefits</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Save className="w-5 h-5" />
              Save Payroll
            </button>
          </div>
        </div>
      )}

      {/* Paid Leave Calculation Modal */}
      {isPaidLeaveModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Calculate Paid Leave</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedEmployee.name}</p>
              </div>
              <button
                onClick={() => setIsPaidLeaveModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                    {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedEmployee.name}</p>
                    <p className="text-xs text-gray-600">{selectedEmployee.department}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hours Logged (This Period)
                </label>
                <input
                  type="number"
                  value={selectedEmployee.hoursWorked}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Total hours logged by the employee during this pay period</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Leave Rate (%)
                </label>
                <input
                  type="number"
                  value={leaveRate}
                  onChange={(e) => setLeaveRate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter leave rate"
                />
                <p className="text-xs text-gray-500 mt-1">Percentage of hours that converts to paid leave (default: 5%)</p>
              </div>

              {/* Calculation Results */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
                <h5 className="font-semibold text-purple-900 mb-2">Calculated Paid Leave</h5>
                <div className="flex justify-between">
                  <span className="text-purple-700">Paid Leave Hours:</span>
                  <span className="text-purple-900 font-medium">{previewLeaveHours.toFixed(2)} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Paid Leave Days:</span>
                  <span className="text-purple-900 font-medium">{previewLeaveDays.toFixed(2)} days</span>
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  Based on 8-hour workday standard
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setIsPaidLeaveModalOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePaidLeave}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                Save Calculation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
