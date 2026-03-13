import { cn } from '@/lib/utils';

const BELT_COLORS: Record<string, { bg: string; text: string; border?: string }> = {
  branca:    { bg: 'bg-white', text: 'text-zinc-800', border: 'border border-zinc-300' },
  amarela:   { bg: 'bg-yellow-400', text: 'text-yellow-950' },
  laranja:   { bg: 'bg-orange-500', text: 'text-white' },
  verde:     { bg: 'bg-green-500', text: 'text-white' },
  roxa:      { bg: 'bg-purple-500', text: 'text-white' },
  marrom:    { bg: 'bg-amber-800', text: 'text-white' },
  preta:     { bg: 'bg-zinc-900', text: 'text-white', border: 'border border-zinc-600' },
  vermelha:  { bg: 'bg-red-500', text: 'text-white' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

interface StudentAvatarProps {
  name: string;
  avatarUrl?: string | null;
  belt?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-14 h-14 text-lg',
  lg: 'w-20 h-20 text-2xl',
};

export function StudentAvatar({ name, avatarUrl, belt, size = 'md', className }: StudentAvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn('rounded-full object-cover', sizeClasses[size], className)}
      />
    );
  }

  const colors = BELT_COLORS[belt || ''] || BELT_COLORS.branca;

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold select-none',
        sizeClasses[size],
        colors.bg,
        colors.text,
        colors.border,
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}

export { BELT_COLORS };
