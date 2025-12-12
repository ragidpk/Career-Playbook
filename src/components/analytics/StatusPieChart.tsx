import type { CompanyStatusBreakdown } from '../../services/analytics.service';

interface StatusPieChartProps {
  data: CompanyStatusBreakdown[];
}

const statusColors: Record<string, string> = {
  Researching: 'bg-blue-500',
  Applied: 'bg-yellow-500',
  Interviewing: 'bg-purple-500',
  Offer: 'bg-green-500',
  Rejected: 'bg-red-500',
};

export default function StatusPieChart({ data }: StatusPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="text-lg font-display font-semibold text-gray-900 mb-6">Status Breakdown</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          No company data available
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Simple donut chart using CSS
  let cumulativePercentage = 0;

  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <h3 className="text-lg font-display font-semibold text-gray-900 mb-6">Status Breakdown</h3>

      <div className="flex items-center justify-center mb-6">
        <div className="relative w-48 h-48">
          {/* Donut segments using conic gradient */}
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `conic-gradient(
                ${data.map((item) => {
                  const startPercentage = cumulativePercentage;
                  cumulativePercentage += item.percentage;
                  const color = statusColors[item.status]?.replace('bg-', '') || 'gray-500';
                  const colorValue = {
                    'blue-500': '#3b82f6',
                    'yellow-500': '#eab308',
                    'purple-500': '#a855f7',
                    'green-500': '#22c55e',
                    'red-500': '#ef4444',
                  }[color] || '#6b7280';
                  return `${colorValue} ${startPercentage}% ${cumulativePercentage}%`;
                }).join(', ')}
              )`,
            }}
          >
            {/* Center white circle to create donut effect */}
            <div className="absolute inset-0 m-auto w-28 h-28 bg-white rounded-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{total}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${statusColors[item.status] || 'bg-gray-500'}`} />
              <span className="text-sm text-gray-700">{item.status}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{item.count}</span>
              <span className="text-sm text-gray-500">({item.percentage.toFixed(1)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
