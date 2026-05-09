import { useState, useRef, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Bell, LayoutDashboard, Users, DollarSign, FileText, Settings, Menu, X, Search, Filter, LogOut } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { EmployeeDirectory } from './components/EmployeeDirectory.js';
import { PayrollProcessing } from './components/PayrollProcessing.js';
import { Settings as SettingsComponent } from './components/Settings.js';
import type { PayrollSettings } from './components/Settings.js';
import { AuditQueue } from './components/AuditQueue.js';
import PayrollReports from './components/PayrollReports.js';
import { Authentication } from './components/Authentication.js';
import { Notifications } from './components/Notifications.js';
import EmployeePortal from './components/EmployeePortal.js';
import { db } from '@/lib/db';
import type { NotificationRow } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { PROJECTX_PORTAL_ROLE_KEY, resolveAppRole } from '@/lib/auth';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authHydrated, setAuthHydrated] = useState(false);
  const userRole = session?.user ? resolveAppRole(session.user) : null;
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthHydrated(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const adminName =
    (session?.user.user_metadata?.full_name as string | undefined)?.trim() ||
    session?.user.email?.split('@')[0] ||
    'Admin';
  const adminInitials = adminName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('') || 'AD';

  // Payroll settings state
  const [payrollSettings, setPayrollSettings] = useState<PayrollSettings>({
    taxBrackets: [],
    pensionRate: 0,
  });

  // Notification data with state
  type UiNotification = { id: number; title: string; message: string; time: string; unread: boolean };
  const toUi = (n: NotificationRow): UiNotification => ({
    id: n.id,
    title: n.title,
    message: n.message,
    time: db.timeAgo(n.created_at),
    unread: !n.is_read,
  });
  const [notificationData, setNotificationData] = useState<UiNotification[]>([]);

  const [summaryData, setSummaryData] = useState({
    totalPayroll: '$0.00',
    pendingAudits: 0,
    recentUpdates: 0,
  });
  const [payrollTrendsData, setPayrollTrendsData] = useState<{ month: string; amount: number }[]>([]);
  const [departmentPayrollData, setDepartmentPayrollData] = useState<{ department: string; amount: number }[]>([]);
  const [recentEmployeeUpdates, setRecentEmployeeUpdates] = useState<{ name: string; department: string; action: string; date: string }[]>([]);

  useEffect(() => {
    if (!session || userRole !== 'admin') return;
    let cancelled = false;

    (async () => {
      const [{ pensionRate, taxBrackets }, notifs, trends, deptPayroll, recent, latestRun, pending] = await Promise.all([
        db.settings.get(),
        db.notifications.list(),
        db.payroll.trends(),
        db.payroll.departmentPayroll(),
        db.recentActivity(),
        db.payroll.latestRun(),
        db.payroll.countPendingAudits(),
      ]);

      if (cancelled) return;

      setPayrollSettings({
        pensionRate,
        taxBrackets: taxBrackets.map(b => ({
          minIncome: Number(b.min_income),
          maxIncome: b.max_income === null ? null : Number(b.max_income),
          rate: Number(b.rate),
          baseAmount: Number(b.base_amount),
        })),
      });

      setNotificationData((notifs ?? []).map(toUi));
      setPayrollTrendsData(trends ?? []);
      setDepartmentPayrollData(deptPayroll ?? []);
      setRecentEmployeeUpdates(recent ?? []);

      setSummaryData({
        totalPayroll: `$${Number(latestRun?.total_net_pay ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        pendingAudits: pending ?? 0,
        recentUpdates: (recent ?? []).length,
      });
    })().catch(() => {
      // Leave empty states if DB isn't reachable yet.
    });

    return () => {
      cancelled = true;
    };
  }, [session, userRole]);

  // Calculate unread count
  const unreadCount = notificationData.filter(n => n.unread).length;

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationOpen]);

  const handleSignOut = async () => {
    try {
      localStorage.removeItem(PROJECTX_PORTAL_ROLE_KEY);
    } catch {
      /* ignore */
    }
    await supabase.auth.signOut();
    setSession(null);
    setActiveTab('dashboard');
  };

  if (!authHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        Loading session…
      </div>
    );
  }

  if (!session) {
    return <Authentication />;
  }

  if (userRole === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <p className="text-gray-800 font-medium max-w-md mb-2">Your Supabase Auth user needs a role in metadata.</p>
        <p className="text-sm text-gray-600 max-w-lg mb-6">
          In Supabase Dashboard → Authentication → Users → select your user → User Metadata,
          add for example{' '}
          <code className="bg-gray-200 px-1 rounded text-xs">{'{ "role": "admin" }'}</code> or{' '}
          <code className="bg-gray-200 px-1 rounded text-xs">{'{ "role": "employee" }'}</code>, then refresh this page.
        </p>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
        >
          Sign out
        </button>
      </div>
    );
  }

  if (userRole === 'employee') {
    return (
      <EmployeePortal
        onSignOut={() => void handleSignOut()}
        identifier={session.user.email ?? ''}
      />
    );
  }

  // Show Admin Dashboard for admin users
  const handleSaveSettings = (newSettings: PayrollSettings) => {
    setPayrollSettings(newSettings);
    void db.settings.save(
      newSettings.pensionRate,
      newSettings.taxBrackets.map(b => ({
        min_income: b.minIncome,
        max_income: b.maxIncome,
        rate: b.rate,
        base_amount: b.baseAmount,
      })),
    );

    // Add notification
    addNotification(
      'Settings Updated',
      'Payroll settings have been successfully saved'
    );
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employee Management', icon: Users },
    { id: 'payroll', label: 'Payroll Processing', icon: DollarSign },
    { id: 'reports', label: 'Payroll Reports', icon: FileText },
    { id: 'auditing', label: 'Auditing', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Filter employee updates based on search and department
  const filteredEmployeeUpdates = recentEmployeeUpdates.filter((update) => {
    const matchesSearch =
      update.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment = departmentFilter === 'all' || update.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  const departments = ['all', ...Array.from(new Set(recentEmployeeUpdates.map(u => u.department)))];

  // Mark notification as read
  const markAsRead = (notificationId: number) => {
    setNotificationData(prevData =>
      prevData.map(n => n.id === notificationId ? { ...n, unread: false } : n)
    );
    void db.notifications.markRead(notificationId);
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotificationData(prevData =>
      prevData.map(n => ({ ...n, unread: false }))
    );
    void db.notifications.clearAll();
  };

  // View all notifications (navigate to notifications view)
  const viewAllNotifications = () => {
    setActiveTab('notifications');
    setIsNotificationOpen(false);
  };

  // Add new notification
  const addNotification = (title: string, message: string) => {
    void db.notifications.add(title, message).then((row) => {
      const ui = toUi(row);
      setNotificationData(prevData => [ui, ...prevData]);
    });
  };

  return (
    <div className="size-full flex bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-0'
        } bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex-shrink-0`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">ProjectX</h1>
            <p className="text-sm text-gray-500 mt-1">Payroll Management</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                {adminInitials}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{adminName}</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>
            <button
              onClick={() => void handleSignOut()}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isSidebarOpen ? (
                  <X className="w-5 h-5 text-gray-600" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" />
                )}
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
                <p className="text-sm text-gray-500">Welcome back, {adminName}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">Notifications</h3>
                          <p className="text-xs text-gray-500 mt-1">{unreadCount} unread notifications</p>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={clearAllNotifications}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notificationData.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            notification.unread ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                            </div>
                            {notification.unread && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-200 text-center">
                      <button
                        onClick={viewAllNotifications}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Summary Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Payroll This Month */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Payroll This Month</p>
                      <p className="text-3xl font-semibold text-gray-900">{summaryData.totalPayroll}</p>
                      <p className="text-sm text-green-600 mt-2">+12.5% from last month</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                {/* Pending Audits */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Pending Audits</p>
                      <p className="text-3xl font-semibold text-gray-900">{summaryData.pendingAudits}</p>
                      <p className="text-sm text-orange-600 mt-2">Requires attention</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>

                {/* Recent Employee Updates */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Recent Employee Updates</p>
                      <p className="text-3xl font-semibold text-gray-900">{summaryData.recentUpdates}</p>
                      <p className="text-sm text-gray-600 mt-2">In the last 7 days</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Visualization Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payroll Trends Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Payroll Trends</h3>
                  <p className="text-sm text-gray-500 mb-4">Monthly payroll over the last 6 months</p>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={payrollTrendsData} id="payroll-trends-chart" margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <defs>
                        <clipPath id="payroll-trends-clip">
                          <rect x="0" y="0" width="100%" height="100%" />
                        </clipPath>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        clipPath="url(#payroll-trends-clip)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Department Payroll Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Payroll by Department</h3>
                  <p className="text-sm text-gray-500 mb-4">Current month distribution</p>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={departmentPayrollData} id="department-payroll-chart" margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <defs>
                        <clipPath id="department-payroll-clip">
                          <rect x="0" y="0" width="100%" height="100%" />
                        </clipPath>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="department" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                      />
                      <Bar dataKey="amount" fill="#8b5cf6" radius={[8, 8, 0, 0]} clipPath="url(#department-payroll-clip)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Employee Updates Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Recent Employee Updates</h3>
                      <p className="text-sm text-gray-500 mt-1">Latest changes to employee records</p>
                    </div>
                  </div>

                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name, action, or department..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      >
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept === 'all' ? 'All Departments' : dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredEmployeeUpdates.length > 0 ? (
                        filteredEmployeeUpdates.map((update, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm">
                                  {update.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <span className="ml-3 text-sm text-gray-900">{update.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                  update.action === 'Added'
                                    ? 'bg-green-100 text-green-700'
                                    : update.action === 'Updated'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-purple-100 text-purple-700'
                                }`}
                              >
                                {update.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {update.department}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {update.date}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                            No employee updates found matching your search criteria
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
                  <h3 className="text-lg font-semibold mb-2">Process Payroll</h3>
                  <p className="text-sm text-blue-100 mb-4">Run payroll for the current pay period</p>
                  <button className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                    Start Processing
                  </button>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
                  <h3 className="text-lg font-semibold mb-2">Generate Reports</h3>
                  <p className="text-sm text-purple-100 mb-4">Create detailed payroll and audit reports</p>
                  <button className="bg-white text-purple-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors">
                    Create Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'dashboard' && (
            <>
              {activeTab === 'employees' ? (
                <EmployeeDirectory onNotification={addNotification} />
              ) : activeTab === 'payroll' ? (
                <PayrollProcessing settings={payrollSettings} onNotification={addNotification} />
              ) : activeTab === 'reports' ? (
                <PayrollReports />
              ) : activeTab === 'auditing' ? (
                <AuditQueue />
              ) : activeTab === 'notifications' ? (
                <Notifications
                  notifications={notificationData}
                  onMarkAsRead={markAsRead}
                  onClearAll={clearAllNotifications}
                />
              ) : activeTab === 'settings' ? (
                <SettingsComponent settings={payrollSettings} onSave={handleSaveSettings} />
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {navigationItems.find(item => item.id === activeTab)?.label}
                  </h3>
                  <p className="text-gray-500">This section is under development</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}