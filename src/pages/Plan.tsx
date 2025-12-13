import { useState } from 'react';
import { Plus, Trash2, Edit3, Sparkles, Check } from 'lucide-react';
import { usePlans } from '../hooks/usePlan';
import { useAuthStore } from '../store/authStore';
import PlanBuilder from '../components/plan/PlanBuilder';
import ProgressTimeline from '../components/plan/ProgressTimeline';
import { format, addDays } from 'date-fns';

export default function Plan() {
  const user = useAuthStore((state) => state.user);
  const { plans, createPlan, deletePlan, isLoading, isCreating, isDeleting } = usePlans(user?.id);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanStartDate, setNewPlanStartDate] = useState('');

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPlanTitle || !newPlanStartDate) return;

    const startDate = new Date(newPlanStartDate);
    const endDate = addDays(startDate, 84); // 12 weeks = 84 days

    try {
      const newPlan = await createPlan({
        title: newPlanTitle,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });

      setSelectedPlanId(newPlan.id);
      setShowCreateModal(false);
      setNewPlanTitle('');
      setNewPlanStartDate('');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">90-Day Plan</h1>
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
                onClick={() => setShowCreateModal(true)}
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
                onClick={() => setShowCreateModal(true)}
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label htmlFor="plan-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Select a Plan
                  </label>
                  <select
                    id="plan-select"
                    value={selectedPlanId || ''}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete plan"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-600">Select a plan to view and edit</p>
              </div>
            )}
          </div>
        )}

        {/* Create Plan Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Create New 90-Day Plan
              </h2>
              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div>
                  <label htmlFor="plan-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Title
                  </label>
                  <input
                    id="plan-title"
                    type="text"
                    value={newPlanTitle}
                    onChange={(e) => setNewPlanTitle(e.target.value)}
                    placeholder="e.g., Q1 2025 Career Goals"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    value={newPlanStartDate}
                    onChange={(e) => setNewPlanStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    End date will be automatically set to 12 weeks (84 days) later
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewPlanTitle('');
                      setNewPlanStartDate('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
