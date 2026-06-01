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

export type HanumanSession = {
  readonly name: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  readonly startHour: number;
  readonly startMin: number;
  readonly endHour: number;
  readonly endMin: number;
  readonly reps: number;
  readonly startRoundOffset: number;
};

export const HANUMAN_SESSIONS: HanumanSession[] = [
  { name: 'Morning', startHour: 5, startMin: 30, endHour: 9, endMin: 0, reps: 13, startRoundOffset: 1 },
  { name: 'Afternoon', startHour: 12, startMin: 0, endHour: 15, endMin: 30, reps: 13, startRoundOffset: 14 },
  { name: 'Evening', startHour: 16, startMin: 0, endHour: 19, endMin: 30, reps: 13, startRoundOffset: 27 },
  { name: 'Night', startHour: 21, startMin: 0, endHour: 0, endMin: 15, reps: 12, startRoundOffset: 40 },
];

export const CHALISA_DURATION = 961.39; // seconds

export type HanumanStatus =
  | {
      isActive: true;
      sessionName: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
      sessionEnd: Date;
      roundOfSession: number;
      totalRepsInSession: number;
      roundOfDay: number;
      audioPositionSeconds: number;
      isCompleted: boolean;
      isBreak: boolean;
      breakRemainingSeconds?: number;
    }
  | {
      isActive: false;
      nextSessionName: 'Morning' | 'Afternoon' | 'Evening' | 'Night' | '';
      nextSessionStart: Date | null;
    };

export const getCurrentHanumanStatus = (now = new Date()): HanumanStatus => {
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  for (const session of HANUMAN_SESSIONS) {
    let isMatch = false;
    let sessionStart = new Date(now);
    let sessionEnd = new Date(now);

    if (session.name === 'Night') {
      // Night session crosses midnight: 9:00 PM to 12:15 AM
      if (currentHour >= 21) {
        sessionStart.setHours(21, 0, 0, 0);
        sessionEnd.setDate(sessionEnd.getDate() + 1);
        sessionEnd.setHours(0, 15, 0, 0);
        isMatch = now >= sessionStart && now < sessionEnd;
      } else if (currentHour === 0 && currentMin < 15) {
        sessionStart.setDate(sessionStart.getDate() - 1);
        sessionStart.setHours(21, 0, 0, 0);
        sessionEnd.setHours(0, 15, 0, 0);
        isMatch = now >= sessionStart && now < sessionEnd;
      }
    } else {
      sessionStart.setHours(session.startHour, session.startMin, 0, 0);
      sessionEnd.setHours(session.endHour, session.endMin, 0, 0);
      isMatch = now >= sessionStart && now < sessionEnd;
    }

    if (isMatch) {
      const elapsedMs = now.getTime() - sessionStart.getTime();
      const chalisaDurationMs = CHALISA_DURATION * 1000;
      const cycleDurationMs = (CHALISA_DURATION + 10) * 1000;
      const currentRep = Math.floor(elapsedMs / cycleDurationMs);

      if (currentRep < session.reps) {
        const cycleElapsedMs = elapsedMs % cycleDurationMs;
        const isBreak = cycleElapsedMs >= chalisaDurationMs;
        const audioPositionSeconds = isBreak ? CHALISA_DURATION : cycleElapsedMs / 1000;
        const roundOfSession = currentRep + 1;
        const roundOfDay = session.startRoundOffset + currentRep;
        const breakRemainingSeconds = isBreak ? Math.max(0, Math.ceil((cycleDurationMs - cycleElapsedMs) / 1000)) : undefined;

        return {
          isActive: true,
          sessionName: session.name,
          sessionEnd,
          roundOfSession,
          totalRepsInSession: session.reps,
          roundOfDay,
          audioPositionSeconds,
          isCompleted: false,
          isBreak,
          breakRemainingSeconds,
        };
      } else {
        return {
          isActive: true,
          sessionName: session.name,
          sessionEnd,
          roundOfSession: session.reps,
          totalRepsInSession: session.reps,
          roundOfDay: session.startRoundOffset + session.reps - 1,
          audioPositionSeconds: CHALISA_DURATION,
          isCompleted: true,
          isBreak: false,
        };
      }
    }
  }

  // Outside any session, find next session
  let nextSession: typeof HANUMAN_SESSIONS[number] | null = null;
  let minDiff = Infinity;
  let nextSessionStart: Date | null = null;

  for (const session of HANUMAN_SESSIONS) {
    let startCandidate = new Date(now);
    startCandidate.setHours(session.startHour, session.startMin, 0, 0);
    if (startCandidate < now) {
      startCandidate.setDate(startCandidate.getDate() + 1);
    }
    const diff = startCandidate.getTime() - now.getTime();
    if (diff < minDiff) {
      minDiff = diff;
      nextSession = session;
      nextSessionStart = startCandidate;
    }
  }

  return {
    isActive: false,
    nextSessionName: nextSession ? nextSession.name : '',
    nextSessionStart,
  };
};

export type OtherJaapSession = {
  readonly name: 'Morning' | 'Evening';
  readonly startHour: number;
  readonly endHour: number;
};

export const OTHER_JAAP_SESSIONS: OtherJaapSession[] = [
  { name: 'Morning', startHour: 6, endHour: 12 },
  { name: 'Evening', startHour: 13, endHour: 20 },
];

export type OtherJaapStatus =
  | {
      isActive: true;
      sessionName: 'Morning' | 'Evening';
      sessionEnd: Date;
      elapsedSeconds: number;
    }
  | {
      isActive: false;
      nextSessionName: 'Morning' | 'Evening';
      nextSessionStart: Date | null;
    };

export const getCurrentOtherJaapStatus = (now = new Date(), mantraType?: string): OtherJaapStatus => {
  if (mantraType === 'krishna') {
    const sessionStart = new Date(now);
    sessionStart.setHours(0, 0, 0, 0);
    const sessionEnd = new Date(now);
    sessionEnd.setHours(24, 0, 0, 0);
    const elapsedSeconds = (now.getTime() - sessionStart.getTime()) / 1000;
    return {
      isActive: true,
      sessionName: 'Morning',
      sessionEnd,
      elapsedSeconds,
    };
  }

  for (const session of OTHER_JAAP_SESSIONS) {
    const sessionStart = new Date(now);
    sessionStart.setHours(session.startHour, 0, 0, 0);
    const sessionEnd = new Date(now);
    sessionEnd.setHours(session.endHour, 0, 0, 0);

    if (now >= sessionStart && now < sessionEnd) {
      const elapsedSeconds = (now.getTime() - sessionStart.getTime()) / 1000;
      return {
        isActive: true,
        sessionName: session.name,
        sessionEnd,
        elapsedSeconds,
      };
    }
  }

  let nextSession: OtherJaapSession | null = null;
  let minDiff = Infinity;
  let nextSessionStart: Date | null = null;

  for (const session of OTHER_JAAP_SESSIONS) {
    const startCandidate = new Date(now);
    startCandidate.setHours(session.startHour, 0, 0, 0);
    if (startCandidate < now) {
      startCandidate.setDate(startCandidate.getDate() + 1);
    }
    const diff = startCandidate.getTime() - now.getTime();
    if (diff < minDiff) {
      minDiff = diff;
      nextSession = session;
      nextSessionStart = startCandidate;
    }
  }

  return {
    isActive: false,
    nextSessionName: nextSession ? nextSession.name : 'Morning',
    nextSessionStart,
  };
};

export const getSynchronizedIndex = (words: string[], elapsedSeconds: number, mantraType?: string): { currentIndex: number; isHolding: boolean } => {
  if (mantraType === 'gayatri') {
    const totalDuration = 29.276;
    const position = elapsedSeconds % totalDuration;
    
    if (position < 5.4) return { currentIndex: 0, isHolding: false }; // ॐ भूर्भुवः स्वः
    if (position < 10.2) return { currentIndex: 1, isHolding: false }; // तत्सवितुर्वरेण्यं
    if (position < 16.2) return { currentIndex: 2, isHolding: false }; // भर्गो देवस्य धीमहि
    
    return { currentIndex: 3, isHolding: position >= 27.9 }; // धियो यो नः प्रचोदयात् (holds at end)
  }

  if (mantraType === 'shiva') {
    const wordDurations = [4.2, 1.0, 2.5];
    const totalDuration = 8.48;
    const position = elapsedSeconds % totalDuration;
    let accumulated = 0;
    for (let i = 0; i < wordDurations.length; i++) {
      accumulated += wordDurations[i];
      if (position < accumulated) {
        return { currentIndex: i, isHolding: false };
      }
    }
    return { currentIndex: words.length - 1, isHolding: true };
  }

  if (mantraType === 'krishna') {
    const totalDuration = 22.77;
    const position = elapsedSeconds % totalDuration;
    if (position < 11.75) {
      const cycle1Ends = [0.75, 1.4, 2.0, 2.6, 3.1, 3.6, 4.35, 5.8, 6.2, 6.6, 7.3, 8.0, 8.7, 9.4, 10.0, 11.75];
      for (let i = 0; i < cycle1Ends.length; i++) {
        if (position < cycle1Ends[i]) {
          return { currentIndex: i, isHolding: false };
        }
      }
      return { currentIndex: 15, isHolding: true };
    } else {
      const relPos = position - 11.75;
      const cycle2Ends = [0.6, 1.25, 1.85, 2.45, 3.05, 3.65, 4.35, 5.85, 6.45, 7.05, 7.65, 8.25, 8.85, 9.45, 10.05, 11.02];
      for (let i = 0; i < cycle2Ends.length; i++) {
        if (relPos < cycle2Ends[i]) {
          return { currentIndex: 16 + i, isHolding: false };
        }
      }
      return { currentIndex: 31, isHolding: true };
    }
  }

  const wordDurations = words.map(w => (w.length > 7 ? 3.0 : 1.2));
  const totalDuration = wordDurations.reduce((a, b) => a + b, 0) + 4.0;
  const position = elapsedSeconds % totalDuration;

  let accumulated = 0;
  for (let i = 0; i < wordDurations.length; i++) {
    accumulated += wordDurations[i];
    if (position < accumulated) {
      return { currentIndex: i, isHolding: false };
    }
  }
  return { currentIndex: words.length - 1, isHolding: true };
};

export default {
  TIME_SLOTS,
  SPECIAL_TIME_SLOTS,
  ALL_TIME_SLOTS,
  isWithinChantingWindow,
  getNextChantingTime,
  getAllAvailableTimes,
  isTimeSlotAvailable,
  getCurrentHanumanStatus,
  HANUMAN_SESSIONS,
  CHALISA_DURATION,
  getCurrentOtherJaapStatus,
  OTHER_JAAP_SESSIONS,
  getSynchronizedIndex
};
