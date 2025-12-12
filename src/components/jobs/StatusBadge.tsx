import type { JobListing } from '../../services/job.service';

interface StatusBadgeProps {
  status: JobListing['application_status'];
  size?: 'sm' | 'md';
}

export const STATUS_CONFIG: Record<
  JobListing['application_status'],
  { label: string; color: string }
> = {
  saved: { label: 'Saved', color: 'bg-gray-100 text-gray-600' },
  applied: { label: 'Applied', color: 'bg-primary-50 text-primary-600' },
  interviewing: {
    label: 'Interviewing',
    color: 'bg-warning-50 text-warning-600',
  },
  offer: { label: 'Offer', color: 'bg-success-50 text-success-600' },
  rejected: { label: 'Rejected', color: 'bg-error-50 text-error-600' },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-500' },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const sizeClass =
    size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded-pill font-medium ${config.color} ${sizeClass}`}
    >
      {config.label}
    </span>
  );
}
