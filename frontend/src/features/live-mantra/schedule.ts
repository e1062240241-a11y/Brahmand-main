// Mantra chanting time slots configuration

export type TimeSlot = {
  start: number;
  end: number;
  name: string;
  recommended: boolean;
};

export const TIME_SLOTS: TimeSlot[] = [
  // Morning slots
  { start: 4, end: 6, name: 'Brahma Muhurta', recommended: true },
  { start: 6, end: 8, name: 'Morning Prayer', recommended: true },
  { start: 8, end: 10, name: 'Morning Chanting', recommended: true },
  
  // Mid-day slots  
  { start: 12, end: 13, name: 'Mid-day Meditation', recommended: false },
  { start: 13, end: 14, name: 'Afternoon Bhajan', recommended: false },
  { start: 14, end: 15, name: 'Afternoon Chanting', recommended: false },
  { start: 15, end: 16, name: 'Late Afternoon', recommended: false },
  
  // Evening slots
  { start: 16, end: 17, name: 'Evening Aarti', recommended: true },
  { start: 17, end: 18, name: 'Sandhya Time', recommended: true },
  { start: 18, end: 19, name: 'Evening Chanting', recommended: false },
  { start: 19, end: 20, name: 'Night Prayer', recommended: false },
  
  // Extended slots
  { start: 20, end: 21, name: 'Late Night Jaap', recommended: false },
  { start: 21, end: 22, name: 'Sleep Time Meditation', recommended: false },
];

// Special time slots with half-hour precision
export const SPECIAL_TIME_SLOTS: TimeSlot[] = [
  { start: 3.5, end: 4, name: 'Early Brahma', recommended: true },    // 3:30 AM - 4 AM
  { start: 15.5, end: 16, name: 'Sunset Prep', recommended: true },    // 3:30 PM - 4 PM
  { start: 17.5, end: 18, name: 'Sunset Chanting', recommended: true }, // 5:30 PM - 6 PM
  { start: 19.5, end: 20, name: 'Night Silence', recommended: false },   // 7:30 PM - 8 PM
];

// Combine all time slots
export const ALL_TIME_SLOTS = [...TIME_SLOTS, ...SPECIAL_TIME_SLOTS];

// Check if current time is within any allowed chanting window
export const isWithinGayatriMantraWindow = (date = new Date()) => {
  const currentHour = date.getHours();
  const currentMinute = date.getMinutes();
  const currentTimeDecimal = currentHour + (currentMinute / 60);
  
  // Check regular hour-based slots
  for (const slot of TIME_SLOTS) {
    if (currentHour >= slot.start && currentHour < slot.end) {
      return { allowed: true, slot: slot.name, recommended: slot.recommended };
    }
  }
  
  // Check special half-hour slots
  for (const slot of SPECIAL_TIME_SLOTS) {
    if (currentTimeDecimal >= slot.start && currentTimeDecimal < slot.end) {
      return { allowed: true, slot: slot.name, recommended: slot.recommended };
    }
  }
  
  return null;
};

// Compatibility wrapper for existing code
export const isWithinChantingWindow = isWithinGayatriMantraWindow;

// Get next available chanting time
export const getNextChantingTime = () => {
  const now = new Date();
  const currentTimeDecimal = now.getHours() + (now.getMinutes() / 60);
  
  // Sort all slots by start time
  const allSlots = [...ALL_TIME_SLOTS].sort((a, b) => a.start - b.start);
  
  // Find next slot
  for (const slot of allSlots) {
    if (slot.start > currentTimeDecimal) {
      const nextDate = new Date(now);
      const hours = Math.floor(slot.start);
      const minutes = Math.floor((slot.start % 1) * 60);
      nextDate.setHours(hours, minutes, 0, 0);
      
      // If slot is tomorrow
      if (nextDate < now) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      
      return {
        slot: slot.name,
        time: nextDate,
        formattedTime: formatDecimalTime(slot.start)
      };
    }
  }
  
  // If no slot today, return first slot of tomorrow
  const firstSlot = allSlots[0];
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const hours = Math.floor(firstSlot.start);
  const minutes = Math.floor((firstSlot.start % 1) * 60);
  tomorrow.setHours(hours, minutes, 0, 0);
  
  return {
    slot: firstSlot.name,
    time: tomorrow,
    formattedTime: formatDecimalTime(firstSlot.start)
  };
};

// Format time for display
const formatDecimalTime = (timeDecimal: number) => {
  const hours = Math.floor(timeDecimal);
  const minutes = Math.floor((timeDecimal % 1) * 60);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

// Get all available times for display
export const getAllAvailableTimes = () => {
  return ALL_TIME_SLOTS.map(slot => ({
    name: slot.name,
    time: formatDecimalTime(slot.start),
    endTime: formatDecimalTime(slot.end),
    recommended: slot.recommended,
    startDecimal: slot.start,
    endDecimal: slot.end
  })).sort((a, b) => a.startDecimal - b.startDecimal);
};

// Check if a specific time is available
export const isTimeSlotAvailable = (hour: number, minute = 0) => {
  const timeDecimal = hour + (minute / 60);
  
  for (const slot of ALL_TIME_SLOTS) {
    if (timeDecimal >= slot.start && timeDecimal < slot.end) {
      return true;
    }
  }
  return false;
};

// For compatibility with home.tsx and other components
export const getCurrentGayatriEnd = (date = new Date()) => {
  const currentHour = date.getHours();
  const currentMinute = date.getMinutes();
  const currentTimeDecimal = currentHour + (currentMinute / 60);
  
  const current = ALL_TIME_SLOTS.find(slot => currentTimeDecimal >= slot.start && currentTimeDecimal < slot.end);
  if (!current) return null;
  
  const end = new Date(date);
  const hours = Math.floor(current.end);
  const minutes = Math.floor((current.end % 1) * 60);
  end.setHours(hours, minutes, 0, 0);
  return end;
};
// Compatibility helpers
export const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const getNextGayatriStart = (date = new Date()) => {
  const next = getNextChantingTime();
  return next.time;
};

export const getScheduleWindows = () => {
  return getAllAvailableTimes().map(slot => ({
    label: `${slot.time} - ${slot.endTime}`,
    startHour: Math.floor(slot.startDecimal),
    endHour: Math.floor(slot.endDecimal)
  }));
};

export default {
  TIME_SLOTS,
  SPECIAL_TIME_SLOTS,
  ALL_TIME_SLOTS,
  isWithinChantingWindow,
  getNextChantingTime,
  getAllAvailableTimes,
  isTimeSlotAvailable
};
