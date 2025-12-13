interface ProgressBarProps {
  title: string;
  percentage: number;
  color?: 'primary' | 'success' | 'warning' | 'info';
  subtitle?: string;
  showLabel?: boolean;
}

const colorClasses = {
  primary: 'from-primary-400 to-primary-600',
  success: 'from-success-500 to-success-600',
  warning: 'from-warning-500 to-warning-600',
  info: 'from-info-500 to-info-600',
};

const bgClasses = {
  primary: 'bg-primary-100',
  success: 'bg-success-100',
  warning: 'bg-warning-100',
  info: 'bg-info-100',
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
    <div className="bg-white rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-sm font-semibold text-gray-900">
          {title}
        </h3>
        {showLabel && (
          <span className="text-sm font-bold text-gray-900">
            {clampedPercentage}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-sm text-gray-500 mb-4">{subtitle}</p>}
      <div className={`w-full ${bgClasses[color]} rounded-pill h-2.5`}>
        <div
          className={`h-2.5 rounded-pill bg-gradient-to-r ${colorClasses[color]} transition-all duration-700 ease-out`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
}
