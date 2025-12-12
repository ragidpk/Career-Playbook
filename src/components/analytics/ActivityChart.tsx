import type { WeeklyActivityData } from '../../services/analytics.service';

interface ActivityChartProps {
  data: WeeklyActivityData[];
  title?: string;
}

export default function ActivityChart({ data, title = 'Weekly Activity' }: ActivityChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          No activity data available
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      <div className="flex items-end justify-between h-64 gap-2">
        {data.map((item, index) => {
          const heightPercentage = maxValue > 0 ? (item.count / maxValue) * 100 : 0;
          const minHeight = item.count > 0 ? 5 : 0;
          const height = Math.max(heightPercentage, minHeight);

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full flex flex-col items-center">
                {item.count > 0 && (
                  <span className="text-xs font-medium text-gray-600 mb-1">{item.count}</span>
                )}
                <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '200px' }}>
                  <div
                    className="absolute bottom-0 w-full bg-primary-500 rounded-t-lg transition-all duration-500 hover:bg-primary-600"
                    style={{ height: `${height}%` }}
                    title={`${item.week}: ${item.count} applications`}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-500 text-center whitespace-nowrap">
                {item.week}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
