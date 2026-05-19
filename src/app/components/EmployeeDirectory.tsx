// Import React hooks
import { useState, useEffect } from "react";
// Import icon components
import {
  Search,
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Edit2,
  Trash2,
} from "lucide-react";
// Import database layer
import { db } from "@/lib/db";

// Employee data structure for directory display
interface Employee {
  // Unique employee identifier
  id: string;
  // Full name
  name: string;
  // Department assignment
  department: string;
  // Job position/title
  position: string;
  // Current employment status
  status: "Active" | "Inactive" | "On Leave";
  // Email address
  email: string;
  // Phone number
  phone: string;
  // Date joined company
  joiningDate: string;
}

interface DepartmentOption {
  id: string;
  name: string;
}

// Form data structure for employee creation/editing
interface EmployeeFormData {
  // First name
  firstName: string;
  // Last name
  lastName: string;
  // Email address
  email: string;
  // Phone number
  phone: string;
  // Department ID selected from the dropdown
  department: string;
  // Job position
  position: string;
  // Date joined (ISO format)
  joiningDate: string;
  // Basic monthly salary
  basicPay: string;
  // Housing allowance
  housingAllowance: string;
  // Transportation allowance
  transportAllowance: string;
  // Medical allowance
  medicalAllowance: string;
  // Other allowances
  otherAllowances: string;
  // Bank name
  bankName: string;
  // Bank account number
  accountNumber: string;
  // IFSC code (Indian banking)
  ifscCode: string;
  // Branch name
  branchName: string;
}

// Props for EmployeeDirectory component
interface EmployeeDirectoryProps {
  // Callback to display notifications
  onNotification: (title: string, message: string) => void;
}

// Empty form template for resetting form state
const emptyForm: EmployeeFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  department: "",
  position: "",
  joiningDate: "",
  basicPay: "",
  housingAllowance: "",
  transportAllowance: "",
  medicalAllowance: "",
  otherAllowances: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  branchName: "",
};

// Employee directory component for managing employee records
export function EmployeeDirectory({ onNotification }: EmployeeDirectoryProps) {
  // Search query for filtering employees
  const [searchQuery, setSearchQuery] = useState("");
  // Controls visibility of add/edit employee modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Current step in multi-step form (1: personal, 2: salary, 3: banking)
  const [currentStep, setCurrentStep] = useState(1);
  // Currently selected employee for viewing details
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  // Controls visibility of employee details modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  // Tracks whether currently editing an employee (vs. creating new)
  const [isEditMode, setIsEditMode] = useState(false);
  // ID of employee being edited
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(
    null,
  );
  // Current form data being entered/edited
  const [formData, setFormData] = useState<EmployeeFormData>(emptyForm);
  // All employees in the directory
  const [employees, setEmployees] = useState<Employee[]>([]);
  // Available departments for the form
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  // Loading state while fetching employee list
  const [loading, setLoading] = useState(true);
  // Submitting state while saving employee data
  const [submitting, setSubmitting] = useState(false);
  // Error message from form submission
  const [submitError, setSubmitError] = useState("");

  // Load all employees on component mount
  useEffect(() => {
    // Fetch employees and departments from database
    setLoading(true);
    Promise.all([db.employees.list(), db.departments.list()])
      .then(([rows, deptRows]) => {
        setEmployees(
          rows.map((r) => ({
            id: r.id,
            name: r.name,
            department: r.department,
            position: r.position,
            status: r.status,
            email: r.email,
            phone: r.phone,
            joiningDate: r.joining_date,
          })),
        );
        setDepartments(deptRows);
      })
      .catch((err) => {
        const msg =
          (err as { message?: string })?.message ??
          (typeof err === "string" ? err : "Failed to load employees.");
        setSubmitError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter employees based on search query across multiple fields
  const filteredEmployees = employees.filter(
    (employee) =>
      employee.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.status.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Multi-step form configuration
  const steps = [
    { number: 1, title: "Personal Details" },
    { number: 2, title: "Salary Structure" },
    { number: 3, title: "Banking Information" },
  ];

  // Handle changes to form input fields
  const handleInputChange = (field: keyof EmployeeFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };
  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    const validDepartment = departments.some(
      (d) => d.id === formData.department,
    );

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.department ||
      !validDepartment ||
      !formData.position ||
      !formData.joiningDate
    ) {
      setSubmitError(
        "Please fill in all required fields and select a valid department.",
      );
      return;
    }

    setSubmitError("");
    setSubmitting(true);

    try {
      if (isEditMode && editingEmployeeId) {
        await db.employees.update(editingEmployeeId, {
          name: fullName,
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          position: formData.position,
          joining_date: formData.joiningDate,
          basic_pay: parseFloat(formData.basicPay) || 0,
          housing_allowance: parseFloat(formData.housingAllowance) || 0,
          transport_allowance: parseFloat(formData.transportAllowance) || 0,
          medical_allowance: parseFloat(formData.medicalAllowance) || 0,
          other_allowances: parseFloat(formData.otherAllowances) || 0,
          bank_name: formData.bankName,
          bank_account_number: formData.accountNumber,
          bank_routing_number: formData.ifscCode,
        });
        const departmentName =
          departments.find((d) => d.id === formData.department)?.name ?? "";
        setEmployees((prev) =>
          prev.map((e) =>
            e.id === editingEmployeeId
              ? {
                  ...e,
                  name: fullName,
                  email: formData.email,
                  phone: formData.phone,
                  department: departmentName,
                  position: formData.position,
                  joiningDate: formData.joiningDate,
                }
              : e,
          ),
        );
        onNotification(
          "Employee Updated",
          `${fullName}'s information has been successfully updated`,
        );
      } else {
        const newId = await db.employees.nextId();
        await db.employees.insert({
          id: newId,
          name: fullName,
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          position: formData.position,
          status: "Active",
          joining_date: formData.joiningDate,
          hourly_rate: 0,
          basic_pay: parseFloat(formData.basicPay) || 0,
          housing_allowance: parseFloat(formData.housingAllowance) || 0,
          transport_allowance: parseFloat(formData.transportAllowance) || 0,
          medical_allowance: parseFloat(formData.medicalAllowance) || 0,
          other_allowances: parseFloat(formData.otherAllowances) || 0,
          bank_name: formData.bankName,
          bank_account_number: formData.accountNumber,
          bank_routing_number: formData.ifscCode,
        });
        const departmentName =
          departments.find((d) => d.id === formData.department)?.name ?? "";
        setEmployees((prev) => [
          ...prev,
          {
            id: newId,
            name: fullName,
            email: formData.email,
            phone: formData.phone,
            department: departmentName,
            position: formData.position,
            joiningDate: formData.joiningDate,
            status: "Active",
          },
        ]);
        onNotification(
          "Employee Added",
          `${fullName} has been added to ${departmentName || formData.department} department`,
        );
      }

      setIsModalOpen(false);
      setCurrentStep(1);
      setIsEditMode(false);
      setEditingEmployeeId(null);
      setFormData(emptyForm);
    } catch (err) {
      const msg =
        (err as { message?: string })?.message ??
        (typeof err === "string"
          ? err
          : "Failed to save employee. Please try again.");
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    const ok = window.confirm(
      `Delete ${employee.name} (${employee.id})? This cannot be undone.`,
    );
    if (!ok) return;

    try {
      await db.employees.delete(employee.id);
      setEmployees((prev) => prev.filter((e) => e.id !== employee.id));
      onNotification("Employee Deleted", `${employee.name} has been deleted`);
      if (selectedEmployee?.id === employee.id) {
        setIsDetailsModalOpen(false);
        setSelectedEmployee(null);
      }
    } catch (err) {
      const msg =
        (err as { message?: string })?.message ??
        (typeof err === "string"
          ? err
          : "Failed to delete employee. Please try again.");
      onNotification("Delete failed", msg);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    const [first = "", ...rest] = employee.name.split(" ");
    const departmentId =
      departments.find((d) => d.name === employee.department)?.id ?? "";
    setFormData({
      ...emptyForm,
      firstName: first,
      lastName: rest.join(" "),
      email: employee.email,
      phone: employee.phone,
      department: departmentId,
      position: employee.position,
      joiningDate: employee.joiningDate,
    });
    setEditingEmployeeId(employee.id);
    setIsEditMode(true);
    setIsDetailsModalOpen(false);
    setIsModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Inactive":
        return "bg-gray-100 text-gray-700";
      case "On Leave":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const calculateTotalSalary = () => {
    return (
      (parseFloat(formData.basicPay) || 0) +
      (parseFloat(formData.housingAllowance) || 0) +
      (parseFloat(formData.transportAllowance) || 0) +
      (parseFloat(formData.medicalAllowance) || 0) +
      (parseFloat(formData.otherAllowances) || 0)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        Loading employees...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Employee Directory
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage all employee information and records
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Employee
        </button>
      </div>
      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, name, department, position, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Employees</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {employees.length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">
            {employees.filter((e) => e.status === "Active").length}
          </p>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
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
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                          {employee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {employee.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {employee.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {employee.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {employee.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(employee.status)}`}
                      >
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setIsDetailsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleEditEmployee(employee)}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => void handleDeleteEmployee(employee)}
                          className="text-red-600 hover:text-red-700"
                          aria-label={`Delete ${employee.name}`}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No employees found matching your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {isEditMode ? "Edit Employee" : "Add New Employee"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {isEditMode
                      ? "Update employee details"
                      : "Fill in the details to add a new employee"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setCurrentStep(1);
                    setIsEditMode(false);
                    setEditingEmployeeId(null);
                    setSubmitError("");
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="mt-6 flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep > step.number ? "bg-green-600" : currentStep === step.number ? "bg-blue-600" : "bg-gray-200"} text-white text-sm font-medium transition-colors`}
                      >
                        {currentStep > step.number ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          step.number
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium ${currentStep >= step.number ? "text-gray-900" : "text-gray-400"}`}
                      >
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-2 ${currentStep > step.number ? "bg-green-600" : "bg-gray-200"}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="employee@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 234-567-8900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.department}
                        onChange={(e) =>
                          handleInputChange("department", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select department</option>
                        {departments.length === 0 ? (
                          <option value="" disabled>
                            No departments available
                          </option>
                        ) : (
                          departments.map((department) => (
                            <option key={department.id} value={department.id}>
                              {department.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.position}
                        onChange={(e) =>
                          handleInputChange("position", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Senior Developer"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Joining Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.joiningDate}
                      onChange={(e) =>
                        handleInputChange("joiningDate", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Basic Pay <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        $
                      </span>
                      <input
                        type="number"
                        value={formData.basicPay}
                        onChange={(e) =>
                          handleInputChange("basicPay", e.target.value)
                        }
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {(
                      [
                        "housingAllowance",
                        "transportAllowance",
                        "medicalAllowance",
                        "otherAllowances",
                      ] as const
                    ).map((field) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (s) => s.toUpperCase())}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                            $
                          </span>
                          <input
                            type="number"
                            value={formData[field]}
                            onChange={(e) =>
                              handleInputChange(field, e.target.value)
                            }
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Total Monthly Salary
                      </span>
                      <span className="text-xl font-semibold text-blue-600">
                        $
                        {calculateTotalSalary().toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) =>
                        handleInputChange("bankName", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter bank name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) =>
                        handleInputChange("accountNumber", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter account number"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IFSC Code / Routing Number{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.ifscCode}
                        onChange={(e) =>
                          handleInputChange("ifscCode", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., ABCD0123456"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Branch Name
                      </label>
                      <input
                        type="text"
                        value={formData.branchName}
                        onChange={(e) =>
                          handleInputChange("branchName", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter branch name"
                      />
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Review Summary
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Name:</span>{" "}
                        {formData.firstName} {formData.lastName}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span>{" "}
                        {formData.email}
                      </p>
                      <p>
                        <span className="font-medium">Department:</span>{" "}
                        {formData.department}
                      </p>
                      <p>
                        <span className="font-medium">Position:</span>{" "}
                        {formData.position}
                      </p>
                      <p>
                        <span className="font-medium">Total Salary:</span> $
                        {calculateTotalSalary().toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 space-y-3">
              {submitError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  {submitError}
                </p>
              )}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${currentStep === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <div className="flex gap-2">
                  {currentStep < 3 ? (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                      {submitting
                        ? isEditMode
                          ? "Updating..."
                          : "Adding..."
                        : isEditMode
                          ? "Update Employee"
                          : "Add Employee"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Details Modal */}
      {isDetailsModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Employee Details
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Complete information for {selectedEmployee.name}
                </p>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                  Personal Information
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {[
                    ["Employee ID", selectedEmployee.id],
                    ["Full Name", selectedEmployee.name],
                    ["Email Address", selectedEmployee.email],
                    ["Phone Number", selectedEmployee.phone],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-sm text-gray-600">{label}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                  Employment Details
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Department</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedEmployee.department}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Position</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedEmployee.position}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Joining Date</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(
                        selectedEmployee.joiningDate,
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Employment Status
                    </span>
                    <span
                      className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedEmployee.status)}`}
                    >
                      {selectedEmployee.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => handleEditEmployee(selectedEmployee)}
                className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                <Edit2 className="w-4 h-4" />
                Edit Employee
              </button>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
