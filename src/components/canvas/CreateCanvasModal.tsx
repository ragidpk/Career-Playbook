import { useState } from 'react';
import { X, Target, Calendar, Building2, ChevronDown } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { INDUSTRY_CATEGORIES } from '../../data/industries';

interface CreateCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    currentRole: string;
    targetRole: string;
    targetDate: string;
    industry: string;
  }) => Promise<void>;
  isCreating: boolean;
}

export default function CreateCanvasModal({
  isOpen,
  onClose,
  onCreate,
  isCreating,
}: CreateCanvasModalProps) {
  const [currentRole, setCurrentRole] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [industry, setIndustry] = useState('');
  const [targetDate, setTargetDate] = useState(
    format(addMonths(new Date(), 3), 'yyyy-MM-dd')
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentRole.trim()) {
      setError('Please enter your current role');
      return;
    }
    if (!targetRole.trim()) {
      setError('Please enter your target role');
      return;
    }
    if (!industry) {
      setError('Please select your target industry');
      return;
    }
    if (!targetDate) {
      setError('Please select a target date');
      return;
    }

    const selectedDate = new Date(targetDate);
    if (selectedDate <= new Date()) {
      setError('Target date must be in the future');
      return;
    }

    try {
      await onCreate({
        currentRole: currentRole.trim(),
        targetRole: targetRole.trim(),
        industry: industry.trim(),
        targetDate,
      });
      // Reset form
      setCurrentRole('');
      setTargetRole('');
      setIndustry('');
      setTargetDate(format(addMonths(new Date(), 3), 'yyyy-MM-dd'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create canvas');
    }
  };

  const handleClose = () => {
    setCurrentRole('');
    setTargetRole('');
    setIndustry('');
    setTargetDate(format(addMonths(new Date(), 3), 'yyyy-MM-dd'));
    setError(null);
    onClose();
  };

  // Calculate min date (tomorrow)
  const minDate = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="text-xl font-display font-bold text-gray-900">
              Set Your Career Goal
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Current Role */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What is your current role?
            </label>
            <input
              type="text"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              placeholder="e.g., Software Engineer, Marketing Manager..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Target Role */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What role are you targeting?
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Senior Engineer, CTO, Product Manager..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Industry */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4 inline mr-1" />
              What industry are you targeting?
            </label>
            <div className="relative">
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors appearance-none bg-white pr-10"
              >
                <option value="">Select an industry...</option>
                {INDUSTRY_CATEGORIES.map((category) => (
                  <optgroup key={category.label} label={category.label}>
                    {category.industries.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind.split(' - ')[1]}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Target Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              When do you want to achieve this goal?
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={minDate}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
            <p className="mt-2 text-sm text-gray-500">
              Set a realistic timeline for your career transition
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 px-4 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Start Planning'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
