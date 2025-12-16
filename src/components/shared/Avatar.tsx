import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
  xl: 'w-10 h-10',
};

function getInitials(name: string | null | undefined): string {
  if (!name) return '';

  // Handle email addresses
  if (name.includes('@')) {
    return name.charAt(0).toUpperCase();
  }

  return name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const initials = getInitials(name);
  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];

  // If we have a valid image URL, show the image
  if (src) {
    return (
      <div
        className={`${sizeClass} rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 ${className}`}
      >
        <img
          src={src}
          alt={name || 'User avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Hide broken image and show fallback
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement?.classList.add('avatar-fallback');
          }}
        />
      </div>
    );
  }

  // Fallback to initials or user icon
  return (
    <div
      className={`${sizeClass} rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0 shadow-button ring-2 ring-white ${className}`}
    >
      {initials ? (
        <span className="font-semibold text-white">{initials}</span>
      ) : (
        <User className={`${iconSize} text-white`} />
      )}
    </div>
  );
}
