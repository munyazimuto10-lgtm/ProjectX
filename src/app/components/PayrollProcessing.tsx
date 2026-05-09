import { useState, useEffect } from 'react';
import { Calendar, Download, Calculator, Save, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import type { PayrollSettings } from './Settings';
import { db } from '@/lib/db';

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
  paidLeaveHours: number;
  paidLeaveDays: number;
}

interface PayrollProcessingProps {
  settings: PayrollSettings;
  onNotification: (title: string, message: string) => void;
}

export function PayrollProcessing({ settings, onNotification }: PayrollProcessingProps) {
  const [payPeriod] = useState('2026-04-01 - 2026-04-15');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPaidLeaveModalOpen, setIsPaidLeaveModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePayroll | null>(null);
  const [leaveRate, setLeaveRate] = useState('5');
  const [employees, setEmployees] = useState<EmployeePayroll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.employees.list().then(rows => {
      setEmployees(rows.map(r => ({
        id: r.id,
        name: r.name,
        department: r.department,
        hourlyRate: r.hourly_rate,
        hoursWorked: 80,
        overtimeHours: 0,
        basePay: 0,
        tax: 0,
        pension: 0,
        netPay: 0,
        paidLeaveHours: 0,
        paidLeaveDays: 0,
      })));
    }).finally(() => setLoading(false));
  }, []);

  const handleHoursChange = (id: string, field: 'hoursWorked' | 'overtimeHours', value: string) => {
    setEmployees(employees.map(emp => emp.id === id ? { ...emp, [field]: parseFloat(value) || 0 } : emp));
    setCalculated(false);
    setSaved(false);
  };

  const calculatePayroll = () => {
    const updated = employees.map(emp => {
      const regularPay = emp.hoursWorked * emp.hourlyRate;
      const overtimePay = emp.overtimeHours * emp.hourlyRate * 1.5;
      const paidLeavePay = emp.paidLeaveHours * emp.hourlyRate;
      const totalCompensation = regularPay + overtimePay + paidLeavePay;

      let tax = 0;
      for (const bracket of settings.taxBrackets) {
        if (totalCompensation <= bracket.minIncome) continue;
        const bracketMax = bracket.maxIncome;
        const taxable = bracketMax === null
          ? totalCompensation - bracket.minIncome
          : Math.min(totalCompensation, bracketMax) - bracket.minIncome;
        if (taxable > 0) tax += (taxable * bracket.rate) / 100;
      }

      const pension = (totalCompensation * settings.pensionRate) / 100;
      return { ...emp, basePay: totalCompensation, tax, pension, netPay: totalCompensation - tax - pension };
    });

    setEmployees(updated);
    setCalculated(true);
    setSaved(false);

    const total = updated.reduce((s, e) => s + e.netPay, 0);
    onNotification('Payroll Calculated', `Payroll for ${updated.length} employees calculated. Total net pay: $${total.toFixed(2)}`);
  };

  const handleSave = async () => {
    try {
      await db.payroll.saveRun(payPeriod, employees.map(e => ({
        employee_id: e.id,
        name: e.name,
        department: e.department,
        hours_worked: e.hoursWorked,
        overtime_hours: e.overtimeHours,
        paid_leave_hours: e.paidLeaveHours,
        paid_leave_days: e.paidLeaveDays,
        base_pay: e.basePay,
        tax: e.tax,
        pension: e.pension,
        net_pay: e.netPay,
      })));
      setSaved(true);
      onNotification('Payroll Saved', `Payroll for ${employees.length} employees saved for ${payPeriod}`);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      onNotification('Save Failed', 'Could not save payroll — check your Supabase connection.');
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    console.table(employees.map(e => ({
      'Employee ID': e.id, Name: e.name, Department: e.department,
      'Hours Worked': e.hoursWorked, 'Overtime Hours': e.overtimeHours,
      'Base Pay': `$${e.basePay.toFixed(2)}`, Tax: `$${e.tax.toFixed(2)}`,
      Pension: `$${e.pension.toFixed(2)}`, 'Net Pay': `$${e.netPay.toFixed(2)}`,
    })));
    setIsExportOpen(false);
    onNotification('Payroll Exported', `Payroll exported as ${format.toUpperCase()} for ${payPeriod}`);
  };

  const calculatePaidLeave = (hoursWorked: number, rate: number) => ({
    paidLeaveHours: parseFloat(((hoursWorked * rate) / 100).toFixed(2)),
    paidLeaveDays:  parseFloat(((hoursWorked * rate) / 100 / 8).toFixed(2)),
  });

  const handleSavePaidLeave = () => {
    if (!selectedEmployee) return;
    const rate = parseFloat(leaveRate) || 0;
    const { paidLeaveHours, paidLeaveDays } = calculatePaidLeave(selectedEmployee.hoursWorked, rate);
    setEmployees(prev => prev.map(e => e.id === selectedEmployee.id ? { ...e, paidLeaveHours, paidLeaveDays } : e));
    onNotification('Paid Leave Calculated', `${selectedEmployee.name}: ${paidLeaveHours} hours (${paidLeaveDays} days) of paid leave calculated`);
    setIsPaidLeaveModalOpen(false);
    setSelectedEmployee(null);
  };

  const preview = selectedEmployee
    ? calculatePaidLeave(selectedEmployee.hoursWorked, parseFloat(leaveRate) || 0)
    : { paidLeaveHours: 0, paidLeaveDays: 0 };

  const totalBasePay  = employees.reduce((s, e) => s + e.basePay,  0);
  const totalTax      = employees.reduce((s, e) => s + e.tax,      0);
  const totalPension  = employees.reduce((s, e) => s + e.pension,  0);
  const totalNetPay   = employees.reduce((s, e) => s + e.netPay,   0);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-500">Loading payroll data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Payroll Processing</h2>
          <p className="text-sm text-gray-500 mt-1">Process payroll for the current pay period</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={calculatePayroll} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <Calculator className="w-5 h-5" />
            Calculate Payroll
          </button>
          <div className="relative">
            <button onClick={() => setIsExportOpen(!isExportOpen)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium">
              <Download className="w-5 h-5" />
              Export
            </button>
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <button onClick={() => handleExport('pdf')} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors">Export as PDF</button>
                <button onClick={() => handleExport('excel')} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg transition-colors border-t border-gray-100">Export as Excel</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status row */}
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
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${calculated ? 'bg-green-100' : 'bg-orange-100'}`}>
              {calculated ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-orange-600" />}
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className={`text-sm font-medium ${calculated ? 'text-green-600' : 'text-orange-600'}`}>{calculated ? 'Calculated' : 'Not Calculated'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Employees</p>
              <p className="text-xl font-semibold text-gray-900">{employees.length}</p>
            </div>
            {saved && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Saved</span>}
          </div>
        </div>
      </div>

      {!calculated && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Ready to calculate</p>
            <p className="text-sm text-blue-700 mt-1">Calculate paid leave for employees first, then enter hours worked and overtime hours. Click "Calculate Payroll" to compute total compensation.</p>
          </div>
        </div>
      )}

      {/* Paid Leave table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Paid Leave Calculation</h3>
            <p className="text-sm text-gray-500 mt-1">Calculate paid leave based on hours logged</p>
          </div>
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Employee', 'Department', 'Hours Logged', 'Paid Leave Hours', 'Paid Leave Days', 'Paid Leave Pay', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                        <p className="text-xs text-gray-500">{emp.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{emp.department}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.hoursWorked} hrs</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-purple-600">{emp.paidLeaveHours.toFixed(2)} hrs</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-purple-600">{emp.paidLeaveDays.toFixed(2)} days</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">${(emp.paidLeaveHours * emp.hourlyRate).toFixed(2)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button onClick={() => { setSelectedEmployee(emp); setLeaveRate('5'); setIsPaidLeaveModalOpen(true); }} className="text-blue-600 hover:text-blue-700 font-medium text-sm">Calculate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payroll table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Employee Payroll</h3>
          <p className="text-sm text-gray-500 mt-1">Edit hours and overtime — paid leave is included in total pay</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Employee', 'Department', 'Hourly Rate', 'Hours Worked', 'Overtime', 'Paid Leave', 'Total Pay', 'Tax', 'Pension', 'Net Pay'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                        <p className="text-xs text-gray-500">{emp.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{emp.department}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${emp.hourlyRate}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input type="number" min="0" step="0.5" value={emp.hoursWorked} onChange={e => handleHoursChange(emp.id, 'hoursWorked', e.target.value)} className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input type="number" min="0" step="0.5" value={emp.overtimeHours} onChange={e => handleHoursChange(emp.id, 'overtimeHours', e.target.value)} className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-purple-600">${(emp.paidLeaveHours * emp.hourlyRate).toFixed(2)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${emp.basePay.toFixed(2)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 font-medium">${emp.tax.toFixed(2)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">${emp.pension.toFixed(2)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">${emp.netPay.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-4 text-sm text-gray-900" colSpan={6}>Total</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">${totalBasePay.toFixed(2)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600">${totalTax.toFixed(2)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-orange-600">${totalPension.toFixed(2)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">${totalNetPay.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {calculated && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Compensation', value: totalBasePay, color: 'text-gray-900', note: 'Includes paid leave' },
              { label: 'Total Tax Deductions', value: totalTax,    color: 'text-red-600' },
              { label: 'Total Pension',        value: totalPension, color: 'text-orange-600' },
              { label: 'Total Net Pay',        value: totalNetPay,  color: 'text-green-600' },
            ].map(({ label, value, color, note }) => (
              <div key={label} className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500 mb-1">{label}</p>
                <p className={`text-2xl font-semibold ${color}`}>${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                {note && <p className="text-xs text-gray-500 mt-1">{note}</p>}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Payroll calculations complete</h4>
              <p className="text-sm text-gray-500 mt-1">Total compensation includes base pay, overtime, and paid leave benefits</p>
            </div>
            <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              <Save className="w-5 h-5" />
              Save Payroll
            </button>
          </div>
        </>
      )}

      {/* Paid Leave Modal */}
      {isPaidLeaveModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Calculate Paid Leave</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedEmployee.name}</p>
              </div>
              <button onClick={() => setIsPaidLeaveModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                  {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedEmployee.name}</p>
                  <p className="text-xs text-gray-600">{selectedEmployee.department}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours Logged (This Period)</label>
                <input type="number" value={selectedEmployee.hoursWorked} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Rate (%)</label>
                <input type="number" value={leaveRate} onChange={e => setLeaveRate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-500 mt-1">Percentage of hours that converts to paid leave (default: 5%)</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
                <h5 className="font-semibold text-purple-900 mb-2">Calculated Paid Leave</h5>
                <div className="flex justify-between">
                  <span className="text-purple-700">Paid Leave Hours:</span>
                  <span className="text-purple-900 font-medium">{preview.paidLeaveHours.toFixed(2)} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Paid Leave Days:</span>
                  <span className="text-purple-900 font-medium">{preview.paidLeaveDays.toFixed(2)} days</span>
                </div>
                <p className="text-xs text-purple-600 mt-2">Based on 8-hour workday standard</p>
              </div>
            </div>
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button onClick={() => setIsPaidLeaveModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleSavePaidLeave} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
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
