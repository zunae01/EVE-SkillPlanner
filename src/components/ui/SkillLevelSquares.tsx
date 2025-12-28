import { cn } from '../../lib/utils';

interface SkillLevelSquaresProps {
  level?: number; // Current trained level (0-5)
  targetLevel?: number; // The level being planned/queued
  interactive?: boolean;
  onClick?: (level: 1 | 2 | 3 | 4 | 5) => void;
  className?: string;
}

export function SkillLevelSquares({ 
  level = 0, 
  targetLevel = 0, 
  interactive = false, 
  onClick,
  className 
}: SkillLevelSquaresProps) {
  return (
    <div className={cn("flex gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const isFilled = i <= level;
        const isTarget = i <= targetLevel && !isFilled;
        
        return (
          <div
            key={i}
            onClick={() => interactive && onClick?.(i as any)}
            className={cn(
              "w-3 h-3 border border-white/20 transition-all duration-200",
              interactive && "cursor-pointer hover:border-primary",
              isFilled ? "bg-white" : "bg-transparent",
              isTarget ? "bg-primary" : "",
              // Hover effects for interactive mode handled via parent usually, 
              // but we can add simple hover fill here if needed.
              // For now, simple filled/empty.
            )}
            title={`Level ${i}`}
          />
        );
      })}
    </div>
  );
}
