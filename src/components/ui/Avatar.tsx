import { classNames } from '@/lib/format';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={classNames(
      'rounded-full bg-brand-100 text-brand-700 font-semibold flex items-center justify-center shrink-0',
      sizes[size],
      className,
    )}>
      {initials}
    </div>
  );
}
