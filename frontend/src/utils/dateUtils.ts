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

export const formatReelDate = (dateInput: string | Date | number | null | undefined, language?: string): string => {
  const date = toISTDate(dateInput);
  if (!date) return '';

  const day = date.getDate();
  if (language === 'hi') {
    const hiMonthNames = [
      'जन', 'फर', 'मार्च', 'अप्रैल', 'मई', 'जून',
      'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
    ];
    const month = hiMonthNames[date.getMonth()];
    return `${day} ${month}`;
  } else {
    const enMonthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const month = enMonthNames[date.getMonth()];
    return `${day} ${month}`;
  }
};

export const parseUTCDate = (dateString?: string): Date => {
  if (!dateString) return new Date(NaN);
  let ds = String(dateString);
  if (!ds.includes('Z') && !ds.includes('+') && !ds.match(/-\d\d:\d\d$/)) {
    ds = ds.includes('T') ? `${ds}Z` : `${ds.replace(' ', 'T')}Z`;
  }
  return new Date(ds);
};

export const getUnixTimestamp = (item: any): number => {
  if (!item) return 0;
  if (item.created_at) {
    const d = parseUTCDate(item.created_at);
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }
  if (item.timestamp) {
    const tsStr = String(item.timestamp).toLowerCase();
    const now = Date.now();
    if (tsStr.includes('just now') || tsStr.includes('now')) {
      return now;
    }
    const match = tsStr.match(/^(\d+)\s*(m|h|d)\s*ago/);
    if (match) {
      const val = parseInt(match[1], 10);
      const unit = match[2];
      if (unit === 'm') return now - val * 60 * 1000;
      if (unit === 'h') return now - val * 60 * 60 * 1000;
      if (unit === 'd') return now - val * 24 * 60 * 60 * 1000;
    }

    const d = parseUTCDate(item.timestamp);
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }
  if (item.start_time) {
    const d = parseUTCDate(item.start_time);
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }
  return 0;
};

export const getTimeAgo = (dateString?: string): string => {
  if (!dateString) return 'Just now';
  const date = parseUTCDate(dateString);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};


