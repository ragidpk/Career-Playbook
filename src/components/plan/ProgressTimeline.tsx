import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Database } from '../../types/database.types';

type WeeklyMilestone = Database['public']['Tables']['weekly_milestones']['Row'];

interface ProgressTimelineProps {
  milestones: WeeklyMilestone[];
}

const statusColors = {
  not_started: '#9CA3AF', // gray-400
  in_progress: '#FCD34D', // yellow-300
  completed: '#34D399', // green-400
};

const statusLabels = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function ProgressTimeline({ milestones }: ProgressTimelineProps) {
  // Transform milestones into chart data
  const chartData = milestones.map((milestone, index) => ({
    name: `W${milestone.week_number}`,
    week: milestone.week_number,
    value: 1, // Each week is equal height
    status: milestone.status,
    goal: milestone.goal || 'No goal set',
    orderIndex: index,
  }));

  // Calculate completion stats
  const totalWeeks = milestones.length;
  const completedWeeks = milestones.filter(m => m.status === 'completed').length;
  const inProgressWeeks = milestones.filter(m => m.status === 'in_progress').length;
  const notStartedWeeks = milestones.filter(m => m.status === 'not_started').length;
  const completionPercentage = totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Timeline</h3>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
          <div className="text-sm text-gray-600">Complete</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{completedWeeks}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{inProgressWeeks}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{notStartedWeeks}</div>
          <div className="text-sm text-gray-600">Not Started</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#6B7280', fontSize: 12 }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis hide />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                      <div className="font-semibold text-gray-900 mb-1">
                        Week {data.week}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        Status: <span className="font-medium">{statusLabels[data.status as keyof typeof statusLabels]}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {data.goal}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={statusColors[entry.status as keyof typeof statusColors]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-gray-700">
              {statusLabels[status as keyof typeof statusLabels]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
