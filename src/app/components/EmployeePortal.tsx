import React, { useEffect, useMemo, useState } from 'react';
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
import { db } from '@/lib/db';
import type { Employee, PayrollEntryRow } from '@/lib/db';

interface EmployeePortalProps {
  onSignOut: () => void;
  identifier: string;
}

const EmployeePortal: React.FC<EmployeePortalProps> = ({ onSignOut, identifier }) => {
  const [activeView, setActiveView] = useState<'home' | 'payment-history' | 'tax-forms' | 'profile'>('home');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [entries, setEntries] = useState<PayrollEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [editedEmployee, setEditedEmployee] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');

    (async () => {
      try {
        const emp = await db.employees.getByIdentifier(identifier);
        if (cancelled) return;
        setEmployee(emp);
        setEditedEmployee({ name: emp?.name ?? '', email: emp?.email ?? '', phone: emp?.phone ?? '' });

        if (emp) {
          const rows = await db.payroll.listEmployeeEntries(emp.id);
          if (cancelled) return;
          setEntries(rows);
        } else {
          setEntries([]);
        }
      } catch (e) {
        if (cancelled) return;
        setLoadError((e as { message?: string })?.message ?? 'Failed to load employee portal data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [identifier]);

  const latestEntry = entries[0] ?? null;
  const latestPayslip = useMemo(() => {
    if (!latestEntry) return null;
    return {
      date: latestEntry.processed_date,
      grossPay: Number(latestEntry.base_pay ?? 0),
      netPay: Number(latestEntry.net_pay ?? 0),
      deductions: Number((latestEntry.tax ?? 0) + (latestEntry.pension ?? 0)),
      periodStart: latestEntry.processed_date,
      periodEnd: latestEntry.processed_date,
    };
  }, [latestEntry]);

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
            <p className="text-xl">{employee?.name ?? 'Employee'}</p>
          </div>
        </div>
        <p className="text-blue-100 mt-2">{employee?.position ?? '—'} • {employee?.department ?? '—'}</p>
      </div>

      {/* Latest Payslip Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Latest Payslip</h2>
              <p className="text-sm text-gray-600">{latestPayslip?.date ?? 'No payslips yet'}</p>
            </div>
            <FileText className="w-6 h-6 text-green-600" />
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <p className="text-sm text-green-700 font-medium mb-1">Net Pay</p>
            <p className="text-3xl font-bold text-green-800">${(latestPayslip?.netPay ?? 0).toLocaleString()}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-600 mb-1">Gross Pay</p>
              <p className="text-xl font-semibold text-gray-900">${(latestPayslip?.grossPay ?? 0).toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-600 mb-1">Deductions</p>
              <p className="text-xl font-semibold text-gray-900">${(latestPayslip?.deductions ?? 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs text-gray-500">
              Pay Period: {latestPayslip?.periodStart ?? '—'} - {latestPayslip?.periodEnd ?? '—'}
            </p>
          </div>

          <button disabled className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed">
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
          {entries.length > 0 ? entries.map((payment) => (
            <div
              key={payment.id}
              className="bg-gray-50 rounded-xl p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{payment.processed_date}</p>
                  <p className="text-sm text-gray-500">{payment.department}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">${Number(payment.net_pay ?? 0).toLocaleString()}</p>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Paid
                </span>
              </div>
            </div>
          )) : (
            <div className="text-sm text-gray-500 text-center py-10">No payment history yet.</div>
          )}
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
          <div className="text-sm text-gray-500 text-center py-10">
            No tax forms available yet.
          </div>
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
              <p className="text-base font-semibold text-gray-900 pl-8">{employee?.name ?? '—'}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-gray-600" />
                <p className="text-sm text-gray-600">Email</p>
              </div>
              <p className="text-base font-semibold text-gray-900 pl-8">{employee?.email ?? '—'}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="w-5 h-5 text-gray-600" />
                <p className="text-sm text-gray-600">Phone</p>
              </div>
              <p className="text-base font-semibold text-gray-900 pl-8">{employee?.phone ?? '—'}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Building className="w-5 h-5 text-gray-600" />
                <p className="text-sm text-gray-600">Department</p>
              </div>
              <p className="text-base font-semibold text-gray-900 pl-8">{employee?.department ?? '—'}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <p className="text-sm text-gray-600">Employee ID</p>
              </div>
              <p className="text-base font-semibold text-gray-900 pl-8">{employee?.id ?? '—'}</p>
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
                  name: employee?.name ?? '',
                  email: employee?.email ?? '',
                  phone: employee?.phone ?? '',
                });
              }}
              className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors active:scale-98"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
            <button
              onClick={() => {
                if (!employee) return;
                db.employees
                  .update(employee.id, { name: editedEmployee.name, email: editedEmployee.email, phone: editedEmployee.phone })
                  .then(() => setEmployee({ ...employee, name: editedEmployee.name, email: editedEmployee.email, phone: editedEmployee.phone }))
                  .finally(() => setIsEditingProfile(false));
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
      {loading && (
        <div className="max-w-2xl mx-auto px-4 py-6 text-gray-500">Loading employee portal...</div>
      )}
      {!loading && loadError && (
        <div className="max-w-2xl mx-auto px-4 py-6 text-red-600">{loadError}</div>
      )}
      {!loading && !loadError && !employee && (
        <div className="max-w-2xl mx-auto px-4 py-6 text-gray-600">
          Could not find an employee for <span className="font-medium">{identifier}</span>. Try signing in with an employee ID (e.g. EMP001) or the employee email.
          <div className="mt-4">
            <button
              onClick={onSignOut}
              className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-100 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
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
        {!loading && !loadError && employee && (
          <>
            {activeView === 'home' && renderHome()}
            {activeView === 'payment-history' && renderPaymentHistory()}
            {activeView === 'tax-forms' && renderTaxForms()}
            {activeView === 'profile' && renderProfile()}
          </>
        )}
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
