import { useState } from 'react';
import { Plus, Trash2, Edit3, Sparkles, Check, ArrowLeft } from 'lucide-react';
import { usePlans } from '../hooks/usePlan';
import { useAuthStore } from '../store/authStore';
import PlanBuilder from '../components/plan/PlanBuilder';
import ProgressTimeline from '../components/plan/ProgressTimeline';
import { format, addDays } from 'date-fns';

type CreationMode = 'options' | 'manual' | 'template';

interface CareerCanvasForm {
  planTitle: string;
  keyPartners: string;
  keyAttributes: string;
  keyValues: string;
  valueProposition: string;
  softSkills: string;
  transferrableSkills: string;
  revenue: string;
  growthPotential: string;
}

const initialCanvasForm: CareerCanvasForm = {
  planTitle: '',
  keyPartners: '',
  keyAttributes: '',
  keyValues: '',
  valueProposition: '',
  softSkills: '',
  transferrableSkills: '',
  revenue: '',
  growthPotential: '',
};

export default function Plan() {
  const user = useAuthStore((state) => state.user);
  const { plans, createPlan, deletePlan, isLoading, isCreating, isDeleting } = usePlans(user?.id);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [creationMode, setCreationMode] = useState<CreationMode>('options');
  const [canvasForm, setCanvasForm] = useState<CareerCanvasForm>(initialCanvasForm);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const handleCanvasFormChange = (field: keyof CareerCanvasForm, value: string) => {
    setCanvasForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canvasForm.planTitle) return;

    const startDate = new Date();
    const endDate = addDays(startDate, 84); // 12 weeks = 84 days

    try {
      const newPlan = await createPlan({
        title: canvasForm.planTitle,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });

      setSelectedPlanId(newPlan.id);
      setCreationMode('options');
      setCanvasForm(initialCanvasForm);
    } catch (error) {
      console.error('Failed to create plan:', error);
      alert('Failed to create plan. Please try again.');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    try {
      await deletePlan(planId);
      if (selectedPlanId === planId) {
        setSelectedPlanId(null);
      }
    } catch (error) {
      console.error('Failed to delete plan:', error);
      alert('Failed to delete plan. Please try again.');
    }
  };

  const handleBackToOptions = () => {
    setCreationMode('options');
    setCanvasForm(initialCanvasForm);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // Manual Creation Form
  if (plans.length === 0 && creationMode === 'manual') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-card p-8">
            {/* Back Link */}
            <button
              onClick={handleBackToOptions}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to options
            </button>

            {/* Header */}
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
              Create Your Career Canvas
            </h2>
            <p className="text-gray-600 mb-8">
              Define your career journey with a structured 12-week plan
            </p>

            {/* Form */}
            <form onSubmit={handleCreatePlan} className="space-y-6">
              {/* Plan Title */}
              <div>
                <label htmlFor="plan-title" className="block text-sm font-semibold text-gray-900 mb-2">
                  Plan Title <span className="text-error-500">*</span>
                </label>
                <input
                  id="plan-title"
                  type="text"
                  value={canvasForm.planTitle}
                  onChange={(e) => handleCanvasFormChange('planTitle', e.target.value)}
                  placeholder="e.g., Transition to Product Management"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Canvas Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Key Partners */}
                <div>
                  <label htmlFor="key-partners" className="block text-sm font-semibold text-primary-600 mb-2">
                    Key Partners (Networks)
                  </label>
                  <textarea
                    id="key-partners"
                    value={canvasForm.keyPartners}
                    onChange={(e) => handleCanvasFormChange('keyPartners', e.target.value)}
                    placeholder="Who can help you?"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Key Attributes */}
                <div>
                  <label htmlFor="key-attributes" className="block text-sm font-semibold text-primary-600 mb-2">
                    Key Attributes (Self)
                  </label>
                  <textarea
                    id="key-attributes"
                    value={canvasForm.keyAttributes}
                    onChange={(e) => handleCanvasFormChange('keyAttributes', e.target.value)}
                    placeholder="Your unique qualities"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Key Values */}
                <div>
                  <label htmlFor="key-values" className="block text-sm font-semibold text-primary-600 mb-2">
                    Key Values (Self)
                  </label>
                  <textarea
                    id="key-values"
                    value={canvasForm.keyValues}
                    onChange={(e) => handleCanvasFormChange('keyValues', e.target.value)}
                    placeholder="What matters most to you?"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Value Proposition */}
                <div>
                  <label htmlFor="value-proposition" className="block text-sm font-semibold text-primary-600 mb-2">
                    Value Proposition (Strengths)
                  </label>
                  <textarea
                    id="value-proposition"
                    value={canvasForm.valueProposition}
                    onChange={(e) => handleCanvasFormChange('valueProposition', e.target.value)}
                    placeholder="What unique value do you offer?"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Soft Skills */}
                <div>
                  <label htmlFor="soft-skills" className="block text-sm font-semibold text-primary-600 mb-2">
                    Soft Skills (Strengths)
                  </label>
                  <textarea
                    id="soft-skills"
                    value={canvasForm.softSkills}
                    onChange={(e) => handleCanvasFormChange('softSkills', e.target.value)}
                    placeholder="Communication, leadership, etc."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Transferrable Skills */}
                <div>
                  <label htmlFor="transferrable-skills" className="block text-sm font-semibold text-primary-600 mb-2">
                    Transferrable Skills (Strengths)
                  </label>
                  <textarea
                    id="transferrable-skills"
                    value={canvasForm.transferrableSkills}
                    onChange={(e) => handleCanvasFormChange('transferrableSkills', e.target.value)}
                    placeholder="Skills you can apply anywhere"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Revenue */}
                <div>
                  <label htmlFor="revenue" className="block text-sm font-semibold text-primary-600 mb-2">
                    Revenue (Horizons)
                  </label>
                  <textarea
                    id="revenue"
                    value={canvasForm.revenue}
                    onChange={(e) => handleCanvasFormChange('revenue', e.target.value)}
                    placeholder="Income goals and opportunities"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Growth Potential */}
                <div>
                  <label htmlFor="growth-potential" className="block text-sm font-semibold text-primary-600 mb-2">
                    Growth Potential (Horizons)
                  </label>
                  <textarea
                    id="growth-potential"
                    value={canvasForm.growthPotential}
                    onChange={(e) => handleCanvasFormChange('growthPotential', e.target.value)}
                    placeholder="Future development opportunities"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isCreating || !canvasForm.planTitle}
                className="w-full py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create Plan & Generate AI Milestones'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">90-Day Plan</h1>
          <p className="text-gray-600">
            Create and track your career progress over 12 weeks
          </p>
        </div>

        {/* Plans List or Create First Plan */}
        {plans.length === 0 ? (
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-10">
              <h2 className="text-3xl font-display font-bold text-gray-900 mb-3">
                Create Your Career Plan
              </h2>
              <p className="text-gray-600 text-lg">
                Start building your personalized career roadmap
              </p>
            </div>

            {/* Options Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Create Manually Card */}
              <button
                onClick={() => setCreationMode('manual')}
                className="bg-white rounded-2xl shadow-card hover:shadow-card-hover p-8 text-left transition-all duration-200 border-2 border-transparent hover:border-primary-200 group"
              >
                <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-200 transition-colors">
                  <Edit3 className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="text-xl font-display font-semibold text-gray-900 mb-3">
                  Create Manually
                </h3>
                <p className="text-gray-600 mb-6">
                  Start from scratch and build a completely customized career plan tailored to your unique goals and circumstances.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-primary-500" />
                    Full control over every detail
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-primary-500" />
                    AI-generated milestones
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-primary-500" />
                    Perfect for unique career paths
                  </li>
                </ul>
              </button>

              {/* Use a Template Card */}
              <button
                onClick={() => setCreationMode('template')}
                className="bg-white rounded-2xl shadow-card hover:shadow-card-hover p-8 text-left transition-all duration-200 border-2 border-transparent hover:border-info-200 group"
              >
                <div className="w-14 h-14 bg-info-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-info-200 transition-colors">
                  <Sparkles className="w-7 h-7 text-info-600" />
                </div>
                <h3 className="text-xl font-display font-semibold text-gray-900 mb-3">
                  Use a Template
                </h3>
                <p className="text-gray-600 mb-6">
                  Get started quickly with pre-built templates designed for common career transitions and goals.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-info-500" />
                    Quick and easy setup
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-info-500" />
                    Pre-configured milestones
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-info-500" />
                    Proven career frameworks
                  </li>
                </ul>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Plan Selector */}
            <div className="bg-white rounded-2xl shadow-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label htmlFor="plan-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Select a Plan
                  </label>
                  <select
                    id="plan-select"
                    value={selectedPlanId || ''}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full md:w-auto px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Choose a plan...</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.title} ({format(new Date(plan.start_date), 'MMM d, yyyy')} - {format(new Date(plan.end_date), 'MMM d, yyyy')})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  {selectedPlanId && (
                    <button
                      onClick={() => handleDeletePlan(selectedPlanId)}
                      disabled={isDeleting}
                      className="p-2 text-error-600 hover:bg-error-50 rounded-xl transition-colors disabled:opacity-50"
                      title="Delete plan"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => setCreationMode('manual')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    New Plan
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Plan Content */}
            {selectedPlanId && selectedPlan ? (
              <div className="space-y-6">
                {/* Progress Timeline */}
                <ProgressTimeline milestones={selectedPlan.weekly_milestones} />

                {/* Plan Builder */}
                <PlanBuilder planId={selectedPlanId} />
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-card p-12 text-center">
                <p className="text-gray-600">Select a plan to view and edit</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
