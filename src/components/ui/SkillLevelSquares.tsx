import { cn } from '../../lib/utils';

interface SkillLevelSquaresProps {
  level?: number; // Current trained level (0-5)
  targetLevel?: number; // The level being planned/queued
  trainedLevel?: number; // Actual character trained level
  interactive?: boolean;
  onClick?: (level: 1 | 2 | 3 | 4 | 5) => void;
  className?: string;
}

export function SkillLevelSquares({ 
  level = 0, 
  targetLevel = 0, 
  trainedLevel = 0,
  interactive = false, 
  onClick,
  className 
}: SkillLevelSquaresProps) {
  return (
    <div className={cn("flex gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const isTrained = i <= trainedLevel;
        const isTarget = i <= targetLevel && !isTrained; // Only show as target if not already trained
        
        return (
          <div
            key={i}
            onClick={() => interactive && onClick?.(i as any)}
            className={cn(
              "w-3 h-3 border transition-all duration-200",
              interactive && "cursor-pointer hover:border-primary",
              // Visual Logic:
              // Trained = Filled White (or specific 'trained' color)
              // Target = Filled Primary (Blue)
              // Empty = Transparent border
              isTrained 
                ? "bg-white border-white" 
                : isTarget 
                  ? "bg-primary border-primary"
                  : "bg-transparent border-white/20",
            )}
            title={isTrained ? `Level ${i} (Trained)` : `Level ${i}`}
          />
        );
      })}
    </div>
  );
}
