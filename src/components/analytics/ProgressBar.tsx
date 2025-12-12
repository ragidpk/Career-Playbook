interface ProgressBarProps {
  title: string;
  percentage: number;
  color?: 'primary' | 'green' | 'blue' | 'purple';
  subtitle?: string;
  showLabel?: boolean;
}

const colorClasses = {
  primary: 'bg-primary-600',
  green: 'bg-green-600',
  blue: 'bg-blue-600',
  purple: 'bg-purple-600',
};

export default function ProgressBar({
  title,
  percentage,
  color = 'primary',
  subtitle,
  showLabel = true,
}: ProgressBarProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {showLabel && <span className="text-sm font-semibold text-gray-900">{clampedPercentage}%</span>}
      </div>
      {subtitle && <p className="text-sm text-gray-500 mb-3">{subtitle}</p>}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${colorClasses[color]}`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
}
