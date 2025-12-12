import type { ApplicationFunnelData } from '../../services/analytics.service';

interface FunnelChartProps {
  data: ApplicationFunnelData;
}

export default function FunnelChart({ data }: FunnelChartProps) {
  const stages = [
    { label: 'Researching', value: data.researching, color: 'bg-blue-500' },
    { label: 'Applied', value: data.applied, color: 'bg-yellow-500' },
    { label: 'Interviewing', value: data.interviewing, color: 'bg-purple-500' },
    { label: 'Offer', value: data.offer, color: 'bg-green-500' },
  ];

  // Calculate max value for scaling
  const maxValue = Math.max(...stages.map(s => s.value), 1);

  // Only show rejected separately
  const rejectedCount = data.rejected;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Application Funnel</h3>
      <div className="space-y-4">
        {stages.map((stage) => {
          const widthPercentage = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
          const minWidth = stage.value > 0 ? 15 : 0; // Minimum width for visibility
          const width = Math.max(widthPercentage, minWidth);

          return (
            <div key={stage.label} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                <span className="text-sm font-semibold text-gray-900">{stage.value}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-lg h-10 relative overflow-hidden">
                <div
                  className={`${stage.color} h-full rounded-lg transition-all duration-500 flex items-center justify-center`}
                  style={{ width: `${width}%` }}
                >
                  {stage.value > 0 && (
                    <span className="text-white text-sm font-medium px-2">
                      {widthPercentage.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {rejectedCount > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                <span className="text-sm font-medium text-gray-700">Rejected</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{rejectedCount}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
