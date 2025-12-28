export const SP_MULTIPLIER = 250;

export function calculateSkillPoints(rank: number, level: number): number {
  if (level <= 0) return 0;
  // Formula: 250 * rank * 32^((level-1)/2)
  // But strictly, EVE stores specific integers.
  // L1: 250*R
  // L2: 1414*R
  // L3: 8000*R
  // L4: 45255*R
  // L5: 256000*R
  
  // We'll use the precise values for accuracy if possible, but the formula is close enough for planning.
  // Actually, let's use the constant multipliers for standard levels.
  const multipliers = [0, 250, 1414, 8000, 45255, 256000];
  if (level >= 1 && level <= 5) {
      return multipliers[level] * rank;
  }
  return 0; // fallback
}

export function calculateTrainingTime(
  spNeeded: number,
  primaryAttrVal: number,
  secondaryAttrVal: number
): number {
  // Returns time in seconds
  const spPerMinute = primaryAttrVal + (secondaryAttrVal / 2);
  const minutes = spNeeded / spPerMinute;
  return minutes * 60;
}

export function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${Math.floor(seconds % 60)}s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}
