import { useState } from 'react';
import { Search, CheckCircle, AlertTriangle, FileText, Clock, User, Calendar, DollarSign, X } from 'lucide-react';

interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  payPeriod: string;
  processedDate: string;
  basePay: number;
  tax: number;
  pension: number;
  netPay: number;
  hoursWorked: number;
  overtimeHours: number;
  status: 'pending' | 'approved' | 'flagged';
  auditor?: string;
  auditDate?: string;
  comments?: string;
}

export function AuditQueue() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [comment, setComment] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [payslips, setPayslips] = useState<Payslip[]>([
    {
      id: 'PS-2026-001',
      employeeId: 'EMP001',
      employeeName: 'Ruvimbo Moyo',
      department: 'Engineering',
      payPeriod: '2026-04-01 to 2026-04-15',
      processedDate: '2026-04-16',
      basePay: 6000,
      tax: 750,
      pension: 360,
      netPay: 4890,
      hoursWorked: 80,
      overtimeHours: 0,
      status: 'pending',
    },
    {
      id: 'PS-2026-002',
      employeeId: 'EMP002',
      employeeName: 'Tinashe Ncube',
      department: 'Marketing',
      payPeriod: '2026-04-01 to 2026-04-15',
      processedDate: '2026-04-16',
      basePay: 5200,
      tax: 600,
      pension: 312,
      netPay: 4288,
      hoursWorked: 80,
      overtimeHours: 0,
      status: 'pending',
    },
    {
      id: 'PS-2026-003',
      employeeId: 'EMP003',
      employeeName: 'Tariro Sibanda',
      department: 'Sales',
      payPeriod: '2026-04-01 to 2026-04-15',
      processedDate: '2026-04-16',
      basePay: 4800,
      tax: 540,
      pension: 288,
      netPay: 3972,
      hoursWorked: 80,
      overtimeHours: 0,
      status: 'pending',
    },
    {
      id: 'PS-2026-004',
      employeeId: 'EMP004',
      employeeName: 'Tendai Dube',
      department: 'HR',
      payPeriod: '2026-04-01 to 2026-04-15',
      processedDate: '2026-04-16',
      basePay: 4400,
      tax: 480,
      pension: 264,
      netPay: 3656,
      hoursWorked: 80,
      overtimeHours: 0,
      status: 'pending',
    },
    {
      id: 'PS-2026-005',
      employeeId: 'EMP005',
      employeeName: 'Nyasha Ndlovu',
      department: 'Finance',
      payPeriod: '2026-04-01 to 2026-04-15',
      processedDate: '2026-04-16',
      basePay: 5600,
      tax: 660,
      pension: 336,
      netPay: 4604,
      hoursWorked: 80,
      overtimeHours: 0,
      status: 'pending',
    },
    {
      id: 'PS-2026-006',
      employeeId: 'EMP006',
      employeeName: 'Simbarashe Mpofu',
      department: 'Engineering',
      payPeriod: '2026-04-01 to 2026-04-15',
      processedDate: '2026-04-16',
      basePay: 6400,
      tax: 810,
      pension: 384,
      netPay: 5206,
      hoursWorked: 80,
      overtimeHours: 0,
      status: 'pending',
    },
    {
      id: 'PS-2026-007',
      employeeId: 'EMP007',
      employeeName: 'Chenai Nyathi',
      department: 'Marketing',
      payPeriod: '2026-04-01 to 2026-04-15',
      processedDate: '2026-04-16',
      basePay: 4640,
      tax: 516,
      pension: 278.4,
      netPay: 3845.6,
      hoursWorked: 80,
      overtimeHours: 0,
      status: 'pending',
    },
    {
      id: 'PS-2026-008',
      employeeId: 'EMP008',
      employeeName: 'Tapiwa Khumalo',
      department: 'Sales',
      payPeriod: '2026-04-01 to 2026-04-15',
      processedDate: '2026-04-16',
      basePay: 6800,
      tax: 870,
      pension: 408,
      netPay: 5522,
      hoursWorked: 80,
      overtimeHours: 0,
      status: 'pending',
    },
  ]);

  const filteredPayslips = payslips.filter((payslip) =>
    payslip.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payslip.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payslip.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payslip.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = payslips.filter(p => p.status === 'pending').length;
  const approvedCount = payslips.filter(p => p.status === 'approved').length;
  const flaggedCount = payslips.filter(p => p.status === 'flagged').length;

  const handleApprove = () => {
    if (!selectedPayslip) return;

    setPayslips(payslips.map(p =>
      p.id === selectedPayslip.id
        ? { ...p, status: 'approved', auditor: 'Farai Mlambo', auditDate: '2026-04-04' }
        : p
    ));

    setActionMessage({ type: 'success', text: 'Payslip approved successfully' });
    setTimeout(() => {
      setActionMessage(null);
      setSelectedPayslip(null);
      setComment('');
    }, 2000);
  };

  const handleFlag = () => {
    if (!selectedPayslip || !comment.trim()) {
      setActionMessage({ type: 'error', text: 'Please enter a comment before flagging' });
      setTimeout(() => setActionMessage(null), 3000);
      return;
    }

    setPayslips(payslips.map(p =>
      p.id === selectedPayslip.id
        ? { ...p, status: 'flagged', auditor: 'Farai Mlambo', auditDate: '2026-04-04', comments: comment }
        : p
    ));

    setActionMessage({ type: 'success', text: 'Payslip flagged with comments' });
    setTimeout(() => {
      setActionMessage(null);
      setSelectedPayslip(null);
      setComment('');
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'flagged':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'flagged':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Audit Queue</h2>
          <p className="text-sm text-gray-500 mt-1">Review and approve pending payslips</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-semibold text-green-600">{approvedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Flagged</p>
              <p className="text-2xl font-semibold text-red-600">{flaggedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payslip List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payslip Queue</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, name, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredPayslips.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payslip ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pay Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Pay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayslips.map((payslip) => (
                  <tr key={payslip.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payslip.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                          {payslip.employeeName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{payslip.employeeName}</p>
                          <p className="text-xs text-gray-500">{payslip.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payslip.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payslip.payPeriod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${payslip.netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(payslip.status)}`}>
                        {getStatusIcon(payslip.status)}
                        {payslip.status.charAt(0).toUpperCase() + payslip.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setSelectedPayslip(payslip);
                          setComment('');
                          setActionMessage(null);
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center py-12 text-sm text-gray-500">
              No payslips found matching your search
            </div>
          )}
        </div>
      </div>

      {/* Audit Modal Window */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Payslip Review</h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedPayslip.id} - {selectedPayslip.employeeName}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPayslip(null);
                    setComment('');
                    setActionMessage(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content - Split View */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* Left Side - Payslip Details */}
              <div className="flex-1 overflow-y-auto p-6 border-b lg:border-b-0 lg:border-r border-gray-200">
                <div className="mb-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedPayslip.status)}`}>
                    {getStatusIcon(selectedPayslip.status)}
                    {selectedPayslip.status.charAt(0).toUpperCase() + selectedPayslip.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-6">
                  {/* Employee Information */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Employee Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Employee ID</p>
                        <p className="text-sm font-medium text-gray-900">{selectedPayslip.employeeId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Name</p>
                        <p className="text-sm font-medium text-gray-900">{selectedPayslip.employeeName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Department</p>
                        <p className="text-sm font-medium text-gray-900">{selectedPayslip.department}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Pay Period</p>
                        <p className="text-sm font-medium text-gray-900">{selectedPayslip.payPeriod}</p>
                      </div>
                    </div>
                  </div>

                  {/* Work Hours */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Work Hours</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Regular Hours</p>
                        <p className="text-sm font-medium text-gray-900">{selectedPayslip.hoursWorked} hrs</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Overtime Hours</p>
                        <p className="text-sm font-medium text-gray-900">{selectedPayslip.overtimeHours} hrs</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Breakdown</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2">
                        <span className="text-sm text-gray-600">Base Pay</span>
                        <span className="text-sm font-medium text-gray-900">
                          ${selectedPayslip.basePay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-2">
                        <span className="text-sm text-gray-600">Tax Deduction</span>
                        <span className="text-sm font-medium text-red-600">
                          -${selectedPayslip.tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="text-sm text-gray-600">Pension Contribution</span>
                        <span className="text-sm font-medium text-orange-600">
                          -${selectedPayslip.pension.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-base font-semibold text-gray-900">Net Pay</span>
                        <span className="text-base font-semibold text-green-600">
                          ${selectedPayslip.netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Processing Information */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Processing Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Processed Date</p>
                        <p className="text-sm font-medium text-gray-900">{selectedPayslip.processedDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Payslip ID</p>
                        <p className="text-sm font-medium text-gray-900">{selectedPayslip.id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Audit Information (if audited) */}
                  {selectedPayslip.auditor && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Audit Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Audited By</p>
                          <p className="text-sm font-medium text-gray-900">{selectedPayslip.auditor}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Audit Date</p>
                          <p className="text-sm font-medium text-gray-900">{selectedPayslip.auditDate}</p>
                        </div>
                      </div>
                      {selectedPayslip.comments && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1">Comments</p>
                          <p className="text-sm text-gray-900">{selectedPayslip.comments}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Audit Actions Panel */}
              <div className="w-full lg:w-96 p-6 bg-gray-50 flex flex-col">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Audit Actions</h4>

                {actionMessage && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    actionMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <p className="text-sm font-medium">{actionMessage.text}</p>
                  </div>
                )}

                {selectedPayslip.status === 'pending' ? (
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comments / Flag Error
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add comments or describe any issues found..."
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Comments are optional for approval, but required when flagging an error.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={handleApprove}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Pass & Approve
                      </button>
                      <button
                        onClick={handleFlag}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        <AlertTriangle className="w-5 h-5" />
                        Flag Error
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center">
                    <div>
                      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${
                        selectedPayslip.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {selectedPayslip.status === 'approved' ? (
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-8 h-8 text-red-600" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedPayslip.status === 'approved' ? 'Already Approved' : 'Already Flagged'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        This payslip has already been audited
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
