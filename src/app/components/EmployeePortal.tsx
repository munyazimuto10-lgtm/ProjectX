import React, { useState } from 'react';
import {
  User,
  FileText,
  History,
  Settings,
  Download,
  ChevronRight,
  DollarSign,
  Calendar,
  Building,
  Mail,
  Phone,
  LogOut,
  X,
  Save
} from 'lucide-react';

interface EmployeePortalProps {
  onSignOut: () => void;
}

const EmployeePortal: React.FC<EmployeePortalProps> = ({ onSignOut }) => {
  const [activeView, setActiveView] = useState<'home' | 'payment-history' | 'tax-forms' | 'profile'>('home');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedEmployee, setEditedEmployee] = useState({
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    phone: '+1 (555) 123-4567',
  });

  // Mock employee data
  const employee = {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    phone: '+1 (555) 123-4567',
    department: 'Engineering',
    position: 'Senior Developer',
    employeeId: 'EMP-001',
  };

  // Mock latest payslip
  const latestPayslip = {
    date: 'March 2026',
    grossPay: 8500.00,
    netPay: 6375.00,
    deductions: 2125.00,
    periodStart: 'Mar 1, 2026',
    periodEnd: 'Mar 31, 2026',
  };

  // Mock payment history
  const paymentHistory = [
    { id: 1, month: 'March 2026', date: 'Mar 31, 2026', amount: 6375.00, status: 'Paid' },
    { id: 2, month: 'February 2026', date: 'Feb 28, 2026', amount: 6375.00, status: 'Paid' },
    { id: 3, month: 'January 2026', date: 'Jan 31, 2026', amount: 6375.00, status: 'Paid' },
    { id: 4, month: 'December 2025', date: 'Dec 31, 2025', amount: 6375.00, status: 'Paid' },
    { id: 5, month: 'November 2025', date: 'Nov 30, 2025', amount: 6375.00, status: 'Paid' },
    { id: 6, month: 'October 2025', date: 'Oct 31, 2025', amount: 6375.00, status: 'Paid' },
  ];

  // Mock tax forms
  const taxForms = [
    { id: 1, name: 'W-2 Form 2025', year: '2025', date: 'Jan 31, 2026' },
    { id: 2, name: 'W-2 Form 2024', year: '2024', date: 'Jan 31, 2025' },
    { id: 3, name: '1099-MISC 2025', year: '2025', date: 'Feb 15, 2026' },
  ];

  const renderHome = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Welcome back,</h1>
            <p className="text-xl">{employee.name}</p>
          </div>
        </div>
        <p className="text-blue-100 mt-2">{employee.position} • {employee.department}</p>
      </div>

      {/* Latest Payslip Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Latest Payslip</h2>
              <p className="text-sm text-gray-600">{latestPayslip.date}</p>
            </div>
            <FileText className="w-6 h-6 text-green-600" />
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <p className="text-sm text-green-700 font-medium mb-1">Net Pay</p>
            <p className="text-3xl font-bold text-green-800">${latestPayslip.netPay.toLocaleString()}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-600 mb-1">Gross Pay</p>
              <p className="text-xl font-semibold text-gray-900">${latestPayslip.grossPay.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-600 mb-1">Deductions</p>
              <p className="text-xl font-semibold text-gray-900">${latestPayslip.deductions.toLocaleString()}</p>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs text-gray-500">
              Pay Period: {latestPayslip.periodStart} - {latestPayslip.periodEnd}
            </p>
          </div>

          <button className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors active:scale-98">
            <Download className="w-5 h-5" />
            Download Payslip
          </button>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => setActiveView('payment-history')}
          className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex items-center justify-between hover:shadow-lg transition-all active:scale-98"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <History className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 text-lg">Payment History</h3>
              <p className="text-sm text-gray-500">View all past payments</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-400" />
        </button>

        <button
          onClick={() => setActiveView('tax-forms')}
          className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex items-center justify-between hover:shadow-lg transition-all active:scale-98"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 text-lg">Tax Forms</h3>
              <p className="text-sm text-gray-500">Access W-2s and 1099s</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-400" />
        </button>

        <button
          onClick={() => setActiveView('profile')}
          className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex items-center justify-between hover:shadow-lg transition-all active:scale-98"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 text-lg">Profile Settings</h3>
              <p className="text-sm text-gray-500">Manage your information</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-400" />
        </button>
      </div>
    </div>
  );

  const renderPaymentHistory = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h2>
        <p className="text-sm text-gray-600 mb-6">View and download all your payment records</p>

        <div className="space-y-3">
          {paymentHistory.map((payment) => (
            <div
              key={payment.id}
              className="bg-gray-50 rounded-xl p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{payment.month}</p>
                  <p className="text-sm text-gray-500">{payment.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">${payment.amount.toLocaleString()}</p>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  {payment.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTaxForms = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tax Forms</h2>
        <p className="text-sm text-gray-600 mb-6">Download your tax documents</p>

        <div className="space-y-3">
          {taxForms.map((form) => (
            <div
              key={form.id}
              className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{form.name}</p>
                    <p className="text-xs text-gray-500">Available since {form.date}</p>
                  </div>
                </div>
              </div>
              <button className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors active:scale-98">
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>

        {/* Profile Photo */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-200">
              <Settings className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Profile Information */}
        {!isEditingProfile ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5 text-gray-600" />
                <p className="text-sm text-gray-600">Full Name</p>
              </div>
              <p className="text-base font-semibold text-gray-900 pl-8">{employee.name}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-gray-600" />
                <p className="text-sm text-gray-600">Email</p>
              </div>
              <p className="text-base font-semibold text-gray-900 pl-8">{employee.email}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="w-5 h-5 text-gray-600" />
                <p className="text-sm text-gray-600">Phone</p>
              </div>
              <p className="text-base font-semibold text-gray-900 pl-8">{employee.phone}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Building className="w-5 h-5 text-gray-600" />
                <p className="text-sm text-gray-600">Department</p>
              </div>
              <p className="text-base font-semibold text-gray-900 pl-8">{employee.department}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <p className="text-sm text-gray-600">Employee ID</p>
              </div>
              <p className="text-base font-semibold text-gray-900 pl-8">{employee.employeeId}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Full Name
              </label>
              <input
                type="text"
                value={editedEmployee.name}
                onChange={(e) => setEditedEmployee({ ...editedEmployee, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={editedEmployee.email}
                onChange={(e) => setEditedEmployee({ ...editedEmployee, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone
              </label>
              <input
                type="tel"
                value={editedEmployee.phone}
                onChange={(e) => setEditedEmployee({ ...editedEmployee, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Department and Employee ID cannot be changed. Contact HR for assistance.
              </p>
            </div>
          </div>
        )}

        {!isEditingProfile ? (
          <>
            <button
              onClick={() => setIsEditingProfile(true)}
              className="w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors active:scale-98"
            >
              <Settings className="w-5 h-5" />
              Edit Profile
            </button>

            <button
              onClick={onSignOut}
              className="w-full mt-3 bg-red-50 text-red-600 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors active:scale-98"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </>
        ) : (
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setIsEditingProfile(false);
                setEditedEmployee({
                  name: employee.name,
                  email: employee.email,
                  phone: employee.phone,
                });
              }}
              className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors active:scale-98"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
            <button
              onClick={() => {
                // In a real app, this would save to a backend
                employee.name = editedEmployee.name;
                employee.email = editedEmployee.email;
                employee.phone = editedEmployee.phone;
                setIsEditingProfile(false);
              }}
              className="flex-1 bg-green-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors active:scale-98"
            >
              <Save className="w-5 h-5" />
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {activeView !== 'home' && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setActiveView('home')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-600 rotate-180" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {activeView === 'payment-history' && 'Payment History'}
              {activeView === 'tax-forms' && 'Tax Forms'}
              {activeView === 'profile' && 'Profile Settings'}
            </h1>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {activeView === 'home' && renderHome()}
        {activeView === 'payment-history' && renderPaymentHistory()}
        {activeView === 'tax-forms' && renderTaxForms()}
        {activeView === 'profile' && renderProfile()}
      </div>

      {/* Bottom Navigation (always visible) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-around">
          <button
            onClick={() => setActiveView('home')}
            className={`flex flex-col items-center gap-1 p-2 ${activeView === 'home' ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => setActiveView('payment-history')}
            className={`flex flex-col items-center gap-1 p-2 ${activeView === 'payment-history' ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <History className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium">History</span>
          </button>
          <button
            onClick={() => setActiveView('tax-forms')}
            className={`flex flex-col items-center gap-1 p-2 ${activeView === 'tax-forms' ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium">Forms</span>
          </button>
          <button
            onClick={() => setActiveView('profile')}
            className={`flex flex-col items-center gap-1 p-2 ${activeView === 'profile' ? 'text-blue-600' : 'text-gray-500'}`}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <Settings className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeePortal;
