import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="stat-label">{title}</p>
          <p className="stat-value mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-2">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-3 flex items-center gap-2">
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-pill text-xs font-semibold ${
                  trend.isPositive
                    ? 'bg-success-50 text-success-600'
                    : 'bg-error-50 text-error-600'
                }`}
              >
                {trend.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(trend.value)}%
              </div>
              <span className="text-xs text-gray-400">vs last period</span>
            </div>
          )}
        </div>
        <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-7 h-7 text-primary-500" />
        </div>
      </div>
    </div>
  );
}
