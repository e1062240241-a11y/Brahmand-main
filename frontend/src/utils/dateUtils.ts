export const IST_TIMEZONE = 'Asia/Kolkata';
export const IST_LOCALE = 'en-IN';

export const toISTDate = (dateInput: string | Date | number | null | undefined): Date | null => {
  if (!dateInput) return null;
  
  let date: Date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    let processedString = dateInput;
    if (typeof dateInput === 'string' && !dateInput.includes('Z') && !dateInput.includes('+')) {
      processedString = dateInput.replace(' ', 'T') + 'Z';
    }
    date = new Date(processedString);
  }

  if (Number.isNaN(date.getTime())) return null;
  return date;
};

export const formatDateIST = (dateInput: string | Date | number | null | undefined): string => {
  const date = toISTDate(dateInput);
  if (!date) return '';
  return date.toLocaleDateString(IST_LOCALE, {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatTimeIST = (dateInput: string | Date | number | null | undefined): string => {
  const date = toISTDate(dateInput);
  if (!date) return '';
  // Convert to upper case to match 'AM/PM' exactly
  return date.toLocaleTimeString(IST_LOCALE, {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).toUpperCase();
};

export const formatDateTimeIST = (dateInput: string | Date | number | null | undefined): string => {
  const date = toISTDate(dateInput);
  if (!date) return '';
  return `${formatDateIST(date)} ${formatTimeIST(date)}`;
};

export const formatTimeAgo = (dateString: string | Date | null | undefined) => {
  if (!dateString) return 'now';
  
  const date = toISTDate(dateString);
  if (!date) return 'now';

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  if (seconds < 0) return 'now'; // Handle slight clock drift
  
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    const options: Intl.DateTimeFormatOptions = { 
      timeZone: IST_TIMEZONE,
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    };
    return date.toLocaleDateString(IST_LOCALE, options);
  }
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'now';
};
