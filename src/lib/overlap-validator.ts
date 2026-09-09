export interface TimeInterval {
  id?: string;
  time_from: string;
  time_to: string;
}

/**
 * Checks if a proposed time range overlaps with any existing time intervals.
 * Two intervals (startA, endA) and (startB, endB) overlap if startA < endB and endA > startB.
 */
export function hasTaskOverlap(
  newInterval: { time_from: string; time_to: string; excludeTaskId?: string },
  existingIntervals: TimeInterval[]
): { hasOverlap: boolean; overlappingTask?: TimeInterval; errorMessage?: string } {
  const { time_from, time_to, excludeTaskId } = newInterval;

  if (!time_from || !time_to) {
    return { hasOverlap: false };
  }

  for (const item of existingIntervals) {
    // Skip if comparing with itself during edit
    if (excludeTaskId && item.id === excludeTaskId) {
      continue;
    }

    // Standard interval overlap condition: A_start < B_end AND A_end > B_start
    if (time_from < item.time_to && time_to > item.time_from) {
      return {
        hasOverlap: true,
        overlappingTask: item,
        errorMessage: 'This task overlaps with an existing task period.',
      };
    }
  }

  return { hasOverlap: false };
}
