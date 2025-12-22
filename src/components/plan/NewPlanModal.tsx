import { useState } from 'react';
import { X, Target, Code, Lightbulb, RefreshCw, BarChart3, Users, Calendar, Sparkles } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const templates: Template[] = [
  {
    id: 'blank',
    name: 'Blank Plan',
    description: 'Start with a blank 12-week plan and customize it yourself',
    icon: Target,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  {
    id: 'software-engineer',
    name: 'Software Engineer Growth',
    description: 'Level up from mid-level to senior engineer',
    icon: Code,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    id: 'product-management',
    name: 'Product Management Transition',
    description: 'Transition into Product Management',
    icon: Lightbulb,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    id: 'career-pivot',
    name: 'Career Pivot',
    description: 'Change to a new industry or role',
    icon: RefreshCw,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    id: 'data-scientist',
    name: 'Data Scientist Development',
    description: 'Build data science and ML skills',
    icon: BarChart3,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    id: 'engineering-manager',
    name: 'Engineering Manager Path',
    description: 'Transition to engineering management',
    icon: Users,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
];

interface NewPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlan: (title: string, startDate: string, templateId: string | null) => Promise<void>;
  isCreating: boolean;
}

export default function NewPlanModal({ isOpen, onClose, onCreatePlan, isCreating }: NewPlanModalProps) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank');
  const [step, setStep] = useState<'details' | 'template'>('details');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only submit if we're on the template step
    if (step === 'details') {
      // Move to template selection instead of submitting
      if (title.trim()) {
        setStep('template');
      }
      return;
    }

    if (!title.trim()) return;

    await onCreatePlan(
      title.trim(),
      startDate,
      selectedTemplate === 'blank' ? null : selectedTemplate
    );

    // Reset form
    setTitle('');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setSelectedTemplate('blank');
    setStep('details');
  };

  const endDate = format(addDays(new Date(startDate), 84), 'MMM d, yyyy');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-gray-900">
                  Create New Career Plan
                </h2>
                <p className="text-sm text-gray-500">
                  {step === 'details' ? 'Step 1: Plan Details' : 'Step 2: Choose Template'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit}>
            {step === 'details' ? (
              <div className="p-6 space-y-6">
                {/* Plan Title */}
                <div>
                  <label htmlFor="plan-title" className="block text-sm font-medium text-gray-700 mb-2">
                    Plan Title *
                  </label>
                  <input
                    id="plan-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., My Senior Engineer Journey"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    autoFocus
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Give your plan a descriptive name
                  </p>
                </div>

                {/* Start Date */}
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Start Date
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Your 12-week plan will end on {endDate}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Choose a template to pre-fill your plan with proven milestones, or start blank.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                  {templates.map((template) => {
                    const Icon = template.icon;
                    const isSelected = selectedTemplate === template.id;

                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-10 h-10 ${template.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${template.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium ${isSelected ? 'text-primary-900' : 'text-gray-900'}`}>
                            {template.name}
                          </h4>
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              {step === 'details' ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('template')}
                    disabled={!title.trim()}
                    className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Choose Template
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !title.trim()}
                    className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Create Plan
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
