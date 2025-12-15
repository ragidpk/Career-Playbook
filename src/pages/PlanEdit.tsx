import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Calendar, Check, Circle, Clock } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { usePlan } from '../hooks/usePlan';
import { updatePlan, updateMilestone } from '../services/plan.service';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import type { Database } from '../types/database.types';

type WeeklyMilestone = Database['public']['Tables']['weekly_milestones']['Row'];

const statusOptions = [
  { value: 'not_started', label: 'Not Started', icon: Circle, color: 'bg-yellow-100 text-yellow-700' },
  { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'bg-green-100 text-green-700' },
  { value: 'completed', label: 'Completed', icon: Check, color: 'bg-blue-100 text-blue-700' },
] as const;

const MAX_GOAL_LENGTH = 200;

// Helper to get week dates (Monday to Sunday)
const getWeekDates = (startDate: string, weekNumber: number) => {
  const planStart = new Date(startDate);
  const firstMonday = startOfWeek(planStart, { weekStartsOn: 1 });
  const weekStart = addDays(firstMonday, (weekNumber - 1) * 7);
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  return {
    start: format(weekStart, 'MMM d'),
    end: format(weekEnd, 'MMM d, yyyy'),
  };
};

export default function PlanEdit() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { plan, milestones, isLoading } = usePlan(id);

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [localMilestones, setLocalMilestones] = useState<WeeklyMilestone[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize form when plan loads
  useEffect(() => {
    if (plan) {
      setTitle(plan.title);
      setStartDate(plan.start_date);
    }
  }, [plan]);

  useEffect(() => {
    if (milestones.length > 0 && localMilestones.length === 0) {
      setLocalMilestones(milestones);
    }
  }, [milestones, localMilestones.length]);

  const handleMilestoneChange = (milestoneId: string, field: 'goal' | 'status', value: string) => {
    setLocalMilestones((prev) =>
      prev.map((m) =>
        m.id === milestoneId ? { ...m, [field]: value } : m
      )
    );
  };

  const handleSave = async () => {
    if (!id || !plan) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Calculate new end date (84 days from start)
      const newEndDate = format(addDays(new Date(startDate), 84), 'yyyy-MM-dd');

      // Update plan details
      await updatePlan(id, {
        title,
        start_date: startDate,
        end_date: newEndDate,
      });

      // Update milestones that have changed
      const updatePromises = localMilestones.map(async (milestone) => {
        const original = milestones.find((m) => m.id === milestone.id);
        if (original && (original.goal !== milestone.goal || original.status !== milestone.status)) {
          return updateMilestone(milestone.id, {
            goal: milestone.goal,
            status: milestone.status,
          });
        }
        return null;
      });

      await Promise.all(updatePromises);

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['plan', id] });
      await queryClient.invalidateQueries({ queryKey: ['plans'] });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Plan Not Found</h1>
          <Link
            to="/plan"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
          >
            Go to Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={`/plans/${id}`}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Plan
            </Link>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-5 h-5" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* Plan Details Card */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="text-xl font-display font-semibold text-gray-900 mb-6">
            Plan Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Plan Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="My 90-Day Career Plan"
              />
            </div>

            {/* Start Date */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* End Date (calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date (auto-calculated)
              </label>
              <div className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-600">
                {startDate ? format(addDays(new Date(startDate), 84), 'MMMM d, yyyy') : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* 12-Week Milestones */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="text-xl font-display font-semibold text-gray-900 mb-2">
            12-Week Milestones
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Edit the goal for each week. Goals are limited to {MAX_GOAL_LENGTH} characters.
          </p>

          <div className="space-y-4">
            {localMilestones.map((milestone) => {
              const weekDates = startDate
                ? getWeekDates(startDate, milestone.week_number)
                : null;
              const statusOption = statusOptions.find((s) => s.value === milestone.status) || statusOptions[0];

              return (
                <div
                  key={milestone.id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Week Number */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                        <span className="text-lg font-bold text-primary-600">
                          {milestone.week_number}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      {/* Week Header */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">
                            Week {milestone.week_number}
                          </h3>
                          {weekDates && (
                            <p className="text-xs text-gray-500">
                              {weekDates.start} - {weekDates.end}
                            </p>
                          )}
                        </div>

                        {/* Status Dropdown */}
                        <select
                          value={milestone.status}
                          onChange={(e) =>
                            handleMilestoneChange(milestone.id, 'status', e.target.value)
                          }
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 focus:ring-2 focus:ring-primary-500 ${statusOption.color}`}
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Goal Input */}
                      <div>
                        <textarea
                          value={milestone.goal || ''}
                          onChange={(e) => {
                            if (e.target.value.length <= MAX_GOAL_LENGTH) {
                              handleMilestoneChange(milestone.id, 'goal', e.target.value);
                            }
                          }}
                          placeholder="What do you want to achieve this week?"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-sm"
                          rows={2}
                        />
                        <div className="flex justify-end mt-1">
                          <span
                            className={`text-xs ${
                              (milestone.goal?.length || 0) >= MAX_GOAL_LENGTH
                                ? 'text-red-600'
                                : 'text-gray-400'
                            }`}
                          >
                            {milestone.goal?.length || 0}/{MAX_GOAL_LENGTH}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-5 h-5" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save All Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
