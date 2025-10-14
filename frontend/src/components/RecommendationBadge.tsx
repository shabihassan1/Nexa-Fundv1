// RecommendationBadge.tsx - Badge components for personalized recommendations

import { Star, Target, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  className?: string;
  score?: number;
}

export const TopMatchBadge = ({ className, score }: BadgeProps) => (
  <div className={cn(
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
    "bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-sm",
    className
  )}>
    <Star className="w-3.5 h-3.5 fill-current" />
    {score ? `${Math.round(score * 100)}% Match` : 'Top Match'}
  </div>
);

export const RecommendedBadge = ({ className, score }: BadgeProps) => (
  <div className={cn(
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
    "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm",
    className
  )}>
    <Target className="w-3.5 h-3.5" />
    {score ? `${Math.round(score * 100)}%` : 'Recommended'}
  </div>
);

export const TrendingBadge = ({ className }: BadgeProps) => (
  <div className={cn(
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
    "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm",
    className
  )}>
    <TrendingUp className="w-3.5 h-3.5" />
    Trending
  </div>
);

export const EndingSoonBadge = ({ className, daysLeft }: BadgeProps & { daysLeft?: number }) => (
  <div className={cn(
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
    "bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-sm animate-pulse",
    className
  )}>
    <Clock className="w-3.5 h-3.5" />
    {daysLeft !== undefined ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left` : 'Ending Soon'}
  </div>
);

// Badge container for multiple badges
export const BadgeContainer = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("flex flex-wrap gap-1.5", className)}>
    {children}
  </div>
);
