export const formatTimeAgo = (dateString: string | Date | null | undefined) => {
  if (!dateString) return 'now';
  
  let date: Date;
  if (dateString instanceof Date) {
    date = dateString;
  } else {
    // If it's a string and doesn't have a timezone indicator, assume it's UTC (common with Python backends)
    let processedString = dateString;
    if (typeof dateString === 'string' && !dateString.includes('Z') && !dateString.includes('+')) {
      // Handle "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DDTHH:MM:SS"
      processedString = dateString.replace(' ', 'T') + 'Z';
    }
    date = new Date(processedString);
  }

  if (Number.isNaN(date.getTime())) return 'now';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  if (seconds < 0) return 'now'; // Handle slight clock drift
  
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (date.getFullYear() !== now.getFullYear()) {
      options.year = 'numeric';
    }
    return date.toLocaleDateString(undefined, options);
  }
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'now';
};
