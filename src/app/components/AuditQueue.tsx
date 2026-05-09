import { useState, useEffect } from 'react';
import { Search, CheckCircle, AlertTriangle, FileText, Clock, X } from 'lucide-react';
import { db } from '@/lib/db';
import type { PayrollEntryRow } from '@/lib/db';

const AUDITOR = 'Farai Mlambo';

export function AuditQueue() {
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedEntry, setSelectedEntry]   = useState<PayrollEntryRow | null>(null);
  const [comment, setComment]               = useState('');
  const [actionMessage, setActionMessage]   = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [entries, setEntries]               = useState<PayrollEntryRow[]>([]);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    db.audit.list().then(setEntries).finally(() => setLoading(false));
  }, []);

  const filtered = entries.filter(e =>
    e.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount  = entries.filter(e => e.audit_status === 'pending').length;
  const approvedCount = entries.filter(e => e.audit_status === 'approved').length;
  const flaggedCount  = entries.filter(e => e.audit_status === 'flagged').length;

  const showMessage = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 2000);
  };

  const handleApprove = async () => {
    if (!selectedEntry) return;
    await db.audit.approve(selectedEntry.id, AUDITOR);
    const today: string = new Date().toISOString().split('T')[0] ?? '';
    setEntries(prev => prev.map(e => e.id === selectedEntry.id ? { ...e, audit_status: 'approved' as const, auditor: AUDITOR, audit_date: today } : e));
    showMessage('success', 'Payslip approved successfully');
    setTimeout(() => { setSelectedEntry(null); setComment(''); }, 2000);
  };

  const handleFlag = async () => {
    if (!selectedEntry) return;
    if (!comment.trim()) { showMessage('error', 'Please enter a comment before flagging'); return; }
    await db.audit.flag(selectedEntry.id, AUDITOR, comment);
    const today: string = new Date().toISOString().split('T')[0] ?? '';
    setEntries(prev => prev.map(e => e.id === selectedEntry.id ? { ...e, audit_status: 'flagged' as const, auditor: AUDITOR, audit_date: today, audit_comments: comment } : e));
    showMessage('success', 'Payslip flagged with comments');
    setTimeout(() => { setSelectedEntry(null); setComment(''); }, 2000);
  };

  const statusColor = (s: string) => s === 'pending' ? 'bg-yellow-100 text-yellow-700' : s === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  const statusIcon  = (s: string) => s === 'pending' ? <Clock className="w-4 h-4" /> : s === 'approved' ? <CheckCircle className="w-4 h-4" /> : s === 'flagged' ? <AlertTriangle className="w-4 h-4" /> : <FileText className="w-4 h-4" />;
  const fmtStatus   = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-500">Loading audit queue...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Audit Queue</h2>
          <p className="text-sm text-gray-500 mt-1">Review and approve pending payslips</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Pending Review', count: pendingCount,  bg: 'bg-yellow-100', icon: <Clock className="w-5 h-5 text-yellow-600" />, textColor: 'text-gray-900' },
          { label: 'Approved',       count: approvedCount, bg: 'bg-green-100',  icon: <CheckCircle className="w-5 h-5 text-green-600" />, textColor: 'text-green-600' },
          { label: 'Flagged',        count: flaggedCount,  bg: 'bg-red-100',    icon: <AlertTriangle className="w-5 h-5 text-red-600" />, textColor: 'text-red-600' },
        ].map(({ label, count, bg, icon, textColor }) => (
          <div key={label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>{icon}</div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className={`text-2xl font-semibold ${textColor}`}>{count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payslip list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payslip Queue</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by ID, name, or department..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {filtered.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Employee', 'Department', 'Pay Period', 'Net Pay', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                          {entry.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{entry.name}</p>
                          <p className="text-xs text-gray-500">{entry.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{entry.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{entry.processed_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${entry.net_pay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${statusColor(entry.audit_status)}`}>
                        {statusIcon(entry.audit_status)}{fmtStatus(entry.audit_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button onClick={() => { setSelectedEntry(entry); setComment(''); setActionMessage(null); }} className="text-blue-600 hover:text-blue-700 font-medium">Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center py-12 text-sm text-gray-500">No payslips found matching your search</div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Payslip Review</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedEntry.employee_id} — {selectedEntry.name}</p>
              </div>
              <button onClick={() => { setSelectedEntry(null); setComment(''); setActionMessage(null); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* Payslip details */}
              <div className="flex-1 overflow-y-auto p-6 border-b lg:border-b-0 lg:border-r border-gray-200">
                <div className="mb-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${statusColor(selectedEntry.audit_status)}`}>
                    {statusIcon(selectedEntry.audit_status)}{fmtStatus(selectedEntry.audit_status)}
                  </span>
                </div>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Employee Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[['Employee ID', selectedEntry.employee_id], ['Name', selectedEntry.name], ['Department', selectedEntry.department], ['Processed Date', selectedEntry.processed_date]].map(([l, v]) => (
                        <div key={l}><p className="text-xs text-gray-500 mb-1">{l}</p><p className="text-sm font-medium text-gray-900">{v}</p></div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Work Hours</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-xs text-gray-500 mb-1">Regular Hours</p><p className="text-sm font-medium text-gray-900">{selectedEntry.hours_worked} hrs</p></div>
                      <div><p className="text-xs text-gray-500 mb-1">Overtime Hours</p><p className="text-sm font-medium text-gray-900">{selectedEntry.overtime_hours} hrs</p></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Breakdown</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2"><span className="text-sm text-gray-600">Base Pay</span><span className="text-sm font-medium text-gray-900">${selectedEntry.base_pay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                      <div className="flex justify-between items-center pb-2"><span className="text-sm text-gray-600">Tax Deduction</span><span className="text-sm font-medium text-red-600">-${selectedEntry.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200"><span className="text-sm text-gray-600">Pension Contribution</span><span className="text-sm font-medium text-orange-600">-${selectedEntry.pension.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                      <div className="flex justify-between items-center pt-2"><span className="text-base font-semibold text-gray-900">Net Pay</span><span className="text-base font-semibold text-green-600">${selectedEntry.net_pay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                    </div>
                  </div>
                  {selectedEntry.auditor && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Audit Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-xs text-gray-500 mb-1">Audited By</p><p className="text-sm font-medium text-gray-900">{selectedEntry.auditor}</p></div>
                        <div><p className="text-xs text-gray-500 mb-1">Audit Date</p><p className="text-sm font-medium text-gray-900">{selectedEntry.audit_date}</p></div>
                      </div>
                      {selectedEntry.audit_comments && <div className="mt-3"><p className="text-xs text-gray-500 mb-1">Comments</p><p className="text-sm text-gray-900">{selectedEntry.audit_comments}</p></div>}
                    </div>
                  )}
                </div>
              </div>

              {/* Audit actions */}
              <div className="w-full lg:w-96 p-6 bg-gray-50 flex flex-col">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Audit Actions</h4>
                {actionMessage && (
                  <div className={`mb-4 p-3 rounded-lg ${actionMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    <p className="text-sm font-medium">{actionMessage.text}</p>
                  </div>
                )}
                {selectedEntry.audit_status === 'pending' ? (
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Comments / Flag Error</label>
                      <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add comments or describe any issues found..." rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
                      <p className="text-xs text-gray-500 mt-2">Comments are optional for approval, but required when flagging.</p>
                    </div>
                    <div className="space-y-3">
                      <button onClick={handleApprove} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">
                        <CheckCircle className="w-5 h-5" />Pass & Approve
                      </button>
                      <button onClick={handleFlag} className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium">
                        <AlertTriangle className="w-5 h-5" />Flag Error
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center">
                    <div>
                      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${selectedEntry.audit_status === 'approved' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {selectedEntry.audit_status === 'approved' ? <CheckCircle className="w-8 h-8 text-green-600" /> : <AlertTriangle className="w-8 h-8 text-red-600" />}
                      </div>
                      <p className="text-sm font-medium text-gray-900">{selectedEntry.audit_status === 'approved' ? 'Already Approved' : 'Already Flagged'}</p>
                      <p className="text-sm text-gray-500 mt-1">This payslip has already been audited</p>
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
