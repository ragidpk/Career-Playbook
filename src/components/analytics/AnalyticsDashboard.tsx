import { useState } from 'react';
import { RefreshCw, TrendingUp, Briefcase, Target, Calendar } from 'lucide-react';
import { useDashboardData } from '../../hooks/useAnalytics';
import StatCard from './StatCard';
import ProgressBar from './ProgressBar';
import FunnelChart from './FunnelChart';
import ActivityChart from './ActivityChart';
import StatusPieChart from './StatusPieChart';
import LoadingSpinner from '../shared/LoadingSpinner';

interface AnalyticsDashboardProps {
  userId: string;
}

type DateRange = 'week' | 'month' | 'all';

export default function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const { funnel, activity, statusBreakdown, planProgress, canvasCompletion, overallStats, isLoading, error } =
    useDashboardData(userId);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Error loading analytics</p>
        <p className="text-sm mt-1">Please try refreshing the page</p>
      </div>
    );
  }

  const weeksToShow = dateRange === 'week' ? 4 : dateRange === 'month' ? 12 : 24;

  return (
    <div className="space-y-6">
      {/* Header with date range selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-gray-900">Analytics Dashboard</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white rounded-2xl shadow-card px-1 py-1">
            <button
              onClick={() => setDateRange('week')}
              className={`px-4 py-2 rounded-pill text-sm font-medium transition-colors ${
                dateRange === 'week'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              type="button"
            >
              This Week
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-4 py-2 rounded-pill text-sm font-medium transition-colors ${
                dateRange === 'month'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              type="button"
            >
              This Month
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-4 py-2 rounded-pill text-sm font-medium transition-colors ${
                dateRange === 'all'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              type="button"
            >
              All Time
            </button>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-card text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            type="button"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Key metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Applications"
          value={overallStats?.totalApplications || 0}
          icon={Briefcase}
          subtitle="Applied, interviewing, or offers"
        />
        <StatCard
          title="Interviews Active"
          value={overallStats?.interviewsThisWeek || 0}
          icon={Calendar}
          subtitle="Currently in interview stage"
        />
        <StatCard
          title="Active Companies"
          value={overallStats?.activeCompanies || 0}
          icon={TrendingUp}
          subtitle="Researching or in process"
        />
        <StatCard
          title="Plan Progress"
          value={`${overallStats?.planProgress || 0}%`}
          icon={Target}
          subtitle="90-day plan completion"
        />
      </div>

      {/* Progress bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProgressBar
          title="90-Day Plan Progress"
          percentage={planProgress?.completionPercentage || 0}
          color="primary"
          subtitle={`${planProgress?.completed || 0} of ${planProgress?.totalMilestones || 0} milestones completed`}
        />
        <ProgressBar
          title="Career Canvas Completion"
          percentage={canvasCompletion?.completionPercentage || 0}
          color="purple"
          subtitle={`${canvasCompletion?.sectionsCompleted || 0} of ${canvasCompletion?.totalSections || 9} sections filled`}
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {funnel && <FunnelChart data={funnel} />}
        {statusBreakdown && <StatusPieChart data={statusBreakdown} />}
      </div>

      {/* Activity chart - full width */}
      <div className="w-full">
        {activity && <ActivityChart data={activity.slice(-weeksToShow)} title="Weekly Activity Trend" />}
      </div>
    </div>
  );
}
