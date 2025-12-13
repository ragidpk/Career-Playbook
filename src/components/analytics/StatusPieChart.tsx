import type { CompanyStatusBreakdown } from '../../services/analytics.service';

interface StatusPieChartProps {
  data: CompanyStatusBreakdown[];
}

// Design system color tokens with hex values
const statusColorConfig: Record<string, { bg: string; hex: string }> = {
  Researching: { bg: 'bg-primary-500', hex: '#2563EB' },
  Applied: { bg: 'bg-warning-500', hex: '#F59E0B' },
  Interviewing: { bg: 'bg-info-500', hex: '#8B5CF6' },
  Offer: { bg: 'bg-success-500', hex: '#22C55E' },
  Rejected: { bg: 'bg-error-500', hex: '#EF4444' },
};

const defaultColor = { bg: 'bg-gray-500', hex: '#6B7280' };

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

  // Build gradient segments using reduce for deterministic calculation
  const segments = data.reduce<{ start: number; end: number; color: string }[]>(
    (acc, item) => {
      const lastEnd = acc.length > 0 ? acc[acc.length - 1].end : 0;
      const colorConfig = statusColorConfig[item.status] || defaultColor;
      acc.push({
        start: lastEnd,
        end: lastEnd + item.percentage,
        color: colorConfig.hex,
      });
      return acc;
    },
    []
  );

  // Build conic-gradient string from pre-computed segments
  const gradientStops = segments
    .map((seg) => `${seg.color} ${seg.start}% ${seg.end}%`)
    .join(', ');

  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <h3 className="text-lg font-display font-semibold text-gray-900 mb-6">Status Breakdown</h3>

      <div className="flex items-center justify-center mb-6">
        <div className="relative w-48 h-48">
          {/* Donut segments using conic gradient */}
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `conic-gradient(${gradientStops})`,
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
        {data.map((item, index) => {
          const colorConfig = statusColorConfig[item.status] || defaultColor;
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${colorConfig.bg}`} />
                <span className="text-sm text-gray-700">{item.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                <span className="text-sm text-gray-500">({item.percentage.toFixed(1)}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
