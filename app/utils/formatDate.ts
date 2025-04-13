/**
 * Format a date string to a more readable format for "joined at" dates
 */
export function formatJoinedDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
} 