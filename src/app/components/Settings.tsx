// Import React state hook
import { useState } from "react";
// Import icon components from lucide-react
import {
  Save,
  Settings as SettingsIcon,
  DollarSign,
  Percent,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

// Data structure for a single tax bracket
export interface TaxBracket {
  // Minimum income threshold for this bracket
  minIncome: number;
  // Maximum income threshold (null = no upper limit)
  maxIncome: number | null;
  // Tax rate percentage
  rate: number;
  // Base tax amount for this bracket
  baseAmount: number;
}

// Complete payroll settings
export interface PayrollSettings {
  // Array of tax brackets for calculating income tax
  taxBrackets: TaxBracket[];
  // Pension contribution rate as percentage
  pensionRate: number;
}

// Props for the Settings component
interface SettingsProps {
  // Current settings to display/edit
  settings: PayrollSettings;
  // Callback when user saves new settings
  onSave: (settings: PayrollSettings) => void;
}

// Settings management component for payroll configuration
export function Settings({ settings, onSave }: SettingsProps) {
  // Local copy of settings being edited (not yet saved)
  const [localSettings, setLocalSettings] = useState<PayrollSettings>(settings);
  // Tracks whether changes have been saved
  const [saved, setSaved] = useState(false);
  // Error message if validation fails
  const [error, setError] = useState("");

  // Handle changes to tax bracket fields
  const handleTaxBracketChange = (
    index: number,
    field: keyof TaxBracket,
    value: string,
  ) => {
    // Create a copy of the tax brackets array
    const updatedBrackets = [...localSettings.taxBrackets];
    // Get the bracket at the specified index
    const bracket = updatedBrackets[index];
    // Skip if bracket doesn't exist
    if (!bracket) return;

    // Update the specific field based on its type
    if (field === "maxIncome") {
      // Allow empty string for null (no upper limit)
      updatedBrackets[index] = {
        ...bracket,
        maxIncome: value === "" ? null : parseFloat(value),
      };
    } else if (field === "minIncome") {
      updatedBrackets[index] = {
        ...bracket,
        minIncome: parseFloat(value) || 0,
      };
    } else if (field === "rate") {
      updatedBrackets[index] = { ...bracket, rate: parseFloat(value) || 0 };
    } else if (field === "baseAmount") {
      updatedBrackets[index] = {
        ...bracket,
        baseAmount: parseFloat(value) || 0,
      };
    }

    // Update local settings with modified brackets
    setLocalSettings({ ...localSettings, taxBrackets: updatedBrackets });
    // Clear saved flag
    setSaved(false);
  };

  // Handle changes to pension rate
  const handlePensionRateChange = (value: string) => {
    // Parse the input value as a number
    const numValue = parseFloat(value) || 0;
    // Validate that pension rate is between 0 and 100
    if (numValue >= 0 && numValue <= 100) {
      // Update the pension rate
      setLocalSettings({ ...localSettings, pensionRate: numValue });
      // Clear saved flag
      setSaved(false);
      // Clear any previous error
      setError("");
    } else {
      // Show validation error
      setError("Pension rate must be between 0 and 100");
    }
  };

  // Add a new empty tax bracket
  const addTaxBracket = () => {
    // Get the last bracket to use as a starting point
    const lastBracket =
      localSettings.taxBrackets[localSettings.taxBrackets.length - 1];
    // Create new bracket starting after the last one
    const newBracket: TaxBracket = {
      minIncome: lastBracket?.maxIncome ?? 0,
      maxIncome: null,
      rate: 0,
      baseAmount: 0,
    };
    // Add new bracket to the list
    setLocalSettings({
      ...localSettings,
      taxBrackets: [...localSettings.taxBrackets, newBracket],
    });
    // Clear saved flag
    setSaved(false);
  };

  // Remove a tax bracket from the list
  const removeTaxBracket = (index: number) => {
    // Only allow removal if more than one bracket exists
    if (localSettings.taxBrackets.length > 1) {
      // Filter out the bracket at the specified index
      const updatedBrackets = localSettings.taxBrackets.filter(
        (_, i) => i !== index,
      );
      // Update settings
      setLocalSettings({ ...localSettings, taxBrackets: updatedBrackets });
      // Clear saved flag
      setSaved(false);
    }
  };

  // Validate all settings before saving
  const validateSettings = () => {
    // Check pension rate bounds
    if (localSettings.pensionRate < 0 || localSettings.pensionRate > 100) {
      setError("Pension rate must be between 0 and 100");
      return false;
    }

    // Check all tax bracket rates are valid
    for (const bracket of localSettings.taxBrackets) {
      if (bracket.rate < 0 || bracket.rate > 100) {
        setError("Tax rates must be between 0 and 100");
        return false;
      }
    }

    // Clear error if all validations pass
    setError("");
    return true;
  };

  // Handle save button click
  const handleSave = () => {
    // Validate settings before saving
    if (validateSettings()) {
      // Call parent callback with new settings
      onSave(localSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const resetToDefaults = () => {
    const defaultSettings: PayrollSettings = {
      taxBrackets: [
        { minIncome: 0, maxIncome: 3000, rate: 10, baseAmount: 0 },
        { minIncome: 3000, maxIncome: 6000, rate: 15, baseAmount: 300 },
        { minIncome: 6000, maxIncome: null, rate: 20, baseAmount: 750 },
      ],
      pensionRate: 6,
    };
    setLocalSettings(defaultSettings);
    setSaved(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Payroll Settings
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure tax brackets and pension rates
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Save className="w-5 h-5" />
          Save Settings
        </button>
      </div>

      {/* Status Messages */}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-900">
              Settings saved successfully
            </p>
            <p className="text-sm text-green-700 mt-1">
              New rates will be applied to all future payroll calculations
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Pension Rate Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Percent className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Pension Contribution Rate
            </h3>
            <p className="text-sm text-gray-500">
              Percentage deducted from employee base pay
            </p>
          </div>
        </div>

        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pension Rate (%)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={localSettings.pensionRate}
              onChange={(e) => handlePensionRateChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.0"
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
              %
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Current rate: {localSettings.pensionRate}% of base pay
          </p>
        </div>
      </div>

      {/* Tax Brackets Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Tax Brackets
              </h3>
              <p className="text-sm text-gray-500">
                Progressive tax rates based on income levels
              </p>
            </div>
          </div>
          <button
            onClick={addTaxBracket}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Add Bracket
          </button>
        </div>

        <div className="space-y-4">
          {localSettings.taxBrackets.map((bracket, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">
                  Bracket {index + 1}
                </h4>
                {localSettings.taxBrackets.length > 1 && (
                  <button
                    onClick={() => removeTaxBracket(index)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Min Income ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={bracket.minIncome}
                    onChange={(e) =>
                      handleTaxBracketChange(index, "minIncome", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Max Income ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={bracket.maxIncome || ""}
                    onChange={(e) =>
                      handleTaxBracketChange(index, "maxIncome", e.target.value)
                    }
                    placeholder="No limit"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={bracket.rate}
                    onChange={(e) =>
                      handleTaxBracketChange(index, "rate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Base Amount ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={bracket.baseAmount}
                    onChange={(e) =>
                      handleTaxBracketChange(
                        index,
                        "baseAmount",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                {bracket.maxIncome
                  ? `Income from $${bracket.minIncome.toLocaleString()} to $${bracket.maxIncome.toLocaleString()} taxed at ${bracket.rate}%`
                  : `Income over $${bracket.minIncome.toLocaleString()} taxed at ${bracket.rate}%`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tax Calculation Example */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              How Tax Calculation Works
            </h4>
            <p className="text-sm text-blue-700 mb-3">
              Tax is calculated progressively based on income brackets. Each
              bracket applies its rate only to the income within that range.
            </p>
            <div className="text-xs text-blue-600 space-y-1">
              {localSettings.taxBrackets.map((bracket, index) => (
                <p key={index}>
                  <span className="font-medium">Bracket {index + 1}:</span>{" "}
                  {bracket.maxIncome
                    ? `$${bracket.minIncome.toLocaleString()} - $${bracket.maxIncome.toLocaleString()}`
                    : `$${bracket.minIncome.toLocaleString()}+`}{" "}
                  = {bracket.rate}% (Base: ${bracket.baseAmount})
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={resetToDefaults}
          className="text-sm text-gray-600 hover:text-gray-700 font-medium"
        >
          Reset to Default Rates
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
