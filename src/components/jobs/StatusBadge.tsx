import type { JobListing } from '../../services/job.service';

interface StatusBadgeProps {
  status: JobListing['application_status'];
  size?: 'sm' | 'md';
}

export const STATUS_CONFIG: Record<
  JobListing['application_status'],
  { label: string; color: string }
> = {
  saved: { label: 'Saved', color: 'bg-gray-100 text-gray-800' },
  applied: { label: 'Applied', color: 'bg-blue-100 text-blue-800' },
  interviewing: { label: 'Interviewing', color: 'bg-yellow-100 text-yellow-800' },
  offer: { label: 'Offer', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-600' },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.color} ${sizeClass}`}>
      {config.label}
    </span>
  );
}
